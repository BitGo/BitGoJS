/**
 * MPCv2 Self-Custody SIGN: ONLINE Script (Requires Network)
 *
 * Creates the TxRequest (unsigned transaction), sends signature shares to BitGo for each
 * DSG round, and finalizes the transaction. Never handles raw key material.
 *
 * Steps:
 *   0: Create TxRequest (prebuildTransaction), optionally fetch BitGo GPG key; write tx-request.json
 *   1: POST signature share R1; write sign-round1-response.json
 *   2: POST signature share R2; write sign-round2-response.json
 *   3: POST signature share R3, sendTxRequest (finalize); write sign-result.json
 *
 * Usage:
 *   BITGO_ACCESS_TOKEN=... COIN=teth WALLET_ID=... node mpc-self-custody-sign-online.js --step 0
 *   node mpc-self-custody-sign-online.js --step 1
 *   node mpc-self-custody-sign-online.js --step 2
 *   node mpc-self-custody-sign-online.js --step 3
 *
 * Environment (step 0): BITGO_ACCESS_TOKEN, COIN, WALLET_ID; RECIPIENT_ADDRESS, AMOUNT (for tx build)
 * Environment (steps 1–3): BITGO_ACCESS_TOKEN, COIN (workspace has tx-request and payloads)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./mpc-sign-workspace-schema');
const { wrapBitGoForV1Auth } = require('./bitgo-auth-utils');

function ensureWorkspace() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
}

function readJson(name) {
  const p = workspacePath(name);
  if (!fs.existsSync(p)) throw new Error(`Missing workspace file: ${name}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(name, obj) {
  ensureWorkspace();
  const p = workspacePath(name);
  fs.writeFileSync(p, JSON.stringify(obj, null, 0), { mode: 0o600 });
  console.log(`[ONLINE] Wrote ${name}`);
}

function getBitGo() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');
  const opts = {
    env: process.env.BITGO_ENV || 'test',
    accessToken,
  };
  if (process.env.BITGO_CUSTOM_ROOT_URI) opts.customRootURI = process.env.BITGO_CUSTOM_ROOT_URI;
  let bitgo = new BitGo(opts);
  bitgo = wrapBitGoForV1Auth(bitgo);
  bitgo.authenticateWithAccessToken({ accessToken });
  return bitgo;
}

async function runStep0() {
  const bitgo = getBitGo();
  const coinId = process.env.COIN || 'teth';
  const walletId = process.env.WALLET_ID || '';
  if (!walletId) throw new Error('WALLET_ID required for step 0');

  const coin = bitgo.coin(coinId);
  const wallet = await coin.wallets().get({ id: walletId });

  const recipientAddress = process.env.RECIPIENT_ADDRESS || '';
  const amount = process.env.AMOUNT || '0';
  if (!recipientAddress) throw new Error('RECIPIENT_ADDRESS required for step 0');
  const recipients = [{ address: recipientAddress, amount }];

  const prebuildResult = await wallet.prebuildTransaction({
    type: 'transfer',
    recipients,
    apiVersion: 'full',
  });
  const txRequestId = prebuildResult.txRequestId;
  const reqWalletId = prebuildResult.walletId || walletId;

  const { commonTssMethods } = require('@bitgo/sdk-core');
  const { getTxRequest } = commonTssMethods;
  const RequestTracer = require('@bitgo/sdk-core').RequestTracer;
  const txRequest = await getTxRequest(bitgo, reqWalletId, txRequestId, new RequestTracer());

  writeJson(FILES.txRequest, txRequest);

  const bitgoGpgPath = workspacePath(FILES.bitgoGpgPublicKey);
  if (!fs.existsSync(bitgoGpgPath)) {
    const EcdsaMPCv2Utils = require('@bitgo/sdk-core').EcdsaMPCv2Utils;
    const baseCoin = bitgo.coin(coinId);
    const mpcUtils = new EcdsaMPCv2Utils(bitgo, baseCoin);
    const enterprise = process.env.ENTERPRISE || '';
    const bitgoPublicGpgKey = (
      (await mpcUtils.getBitgoGpgPubkeyBasedOnFeatureFlags(enterprise, true)) ?? mpcUtils.bitgoMPCv2PublicGpgKey
    ).armor();
    writeJson(FILES.bitgoGpgPublicKey, { bitgoGpgPublicKey: bitgoPublicGpgKey });
  }

  console.log('[ONLINE] Step 0 done. Copy tx-request.json (and bitgo-gpg-public-key.json if needed) to offline machine.');
}

async function runStep1() {
  const bitgo = getBitGo();
  const { commonTssMethods, RequestType } = require('@bitgo/sdk-core');
  const { sendSignatureShareV2 } = commonTssMethods;

  const txRequest = readJson(FILES.txRequest);
  const walletId = txRequest.walletId;
  const txRequestId = txRequest.txRequestId;

  const payload = readJson(FILES.signRound1Payload);
  const signatureShareRound1 = payload.signatureShareRound1;
  const userGpgPubKey = payload.userGpgPubKey;
  if (!signatureShareRound1 || !userGpgPubKey) throw new Error('sign-round1-payload must have signatureShareRound1 and userGpgPubKey');

  const coinId = process.env.COIN || 'teth';
  const coin = bitgo.coin(coinId);
  const RequestTracer = require('@bitgo/sdk-core').RequestTracer;

  const round1TxRequest = await sendSignatureShareV2(
    bitgo,
    walletId,
    txRequestId,
    [signatureShareRound1],
    RequestType.tx,
    'ecdsa',
    userGpgPubKey,
    undefined,
    'MPCv2',
    new RequestTracer()
  );

  writeJson(FILES.signRound1Response, round1TxRequest);
  console.log('[ONLINE] Step 1 done. Copy sign-round1-response.json to offline machine.');
}

async function runStep2() {
  const bitgo = getBitGo();
  const { commonTssMethods, RequestType } = require('@bitgo/sdk-core');
  const { sendSignatureShareV2 } = commonTssMethods;

  const txRequest = readJson(FILES.txRequest);
  const walletId = txRequest.walletId;
  const txRequestId = txRequest.txRequestId;

  const payload = readJson(FILES.signRound2Payload);
  const signatureShareRound2 = payload.signatureShareRound2;
  if (!signatureShareRound2) throw new Error('sign-round2-payload must have signatureShareRound2');

  const round1Payload = readJson(FILES.signRound1Payload);
  const userGpgPubKey = round1Payload.userGpgPubKey;
  if (!userGpgPubKey) throw new Error('sign-round1-payload must have userGpgPubKey');

  const RequestTracer = require('@bitgo/sdk-core').RequestTracer;

  const round2TxRequest = await sendSignatureShareV2(
    bitgo,
    walletId,
    txRequestId,
    [signatureShareRound2],
    RequestType.tx,
    'ecdsa',
    userGpgPubKey,
    undefined,
    'MPCv2',
    new RequestTracer()
  );

  writeJson(FILES.signRound2Response, round2TxRequest);
  console.log('[ONLINE] Step 2 done. Copy sign-round2-response.json to offline machine.');
}

async function runStep3() {
  const bitgo = getBitGo();
  const { commonTssMethods, RequestType } = require('@bitgo/sdk-core');
  const { sendSignatureShareV2, sendTxRequest } = commonTssMethods;

  const txRequest = readJson(FILES.txRequest);
  const walletId = txRequest.walletId;
  const txRequestId = txRequest.txRequestId;

  const payload = readJson(FILES.signRound3Payload);
  const signatureShareRound3 = payload.signatureShareRound3;
  if (!signatureShareRound3) throw new Error('sign-round3-payload must have signatureShareRound3');

  const round1Payload = readJson(FILES.signRound1Payload);
  const userGpgPubKey = round1Payload.userGpgPubKey;
  if (!userGpgPubKey) throw new Error('sign-round1-payload must have userGpgPubKey');

  const RequestTracer = require('@bitgo/sdk-core').RequestTracer;
  const reqId = new RequestTracer();

  await sendSignatureShareV2(
    bitgo,
    walletId,
    txRequestId,
    [signatureShareRound3],
    RequestType.tx,
    'ecdsa',
    userGpgPubKey,
    undefined,
    'MPCv2',
    reqId
  );

  const finalTxRequest = await sendTxRequest(bitgo, walletId, txRequestId, RequestType.tx, reqId);
  writeJson(FILES.signResult, finalTxRequest);
  console.log('[ONLINE] Step 3 done. Sign result written to sign-result.json');
}

async function main() {
  const step =
    process.argv.find((a) => a.startsWith('--step='))
      ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
      : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['0', '1', '2', '3'].includes(step)) {
    console.error('Usage: node mpc-self-custody-sign-online.js --step 0|1|2|3');
    process.exit(1);
  }
  if (process.env.MPC_WORKSPACE_DIR || process.env.MPC_SIGN_WORKSPACE_DIR) {
    console.log('[ONLINE] Workspace:', WORKSPACE_DIR);
  }
  if (step === '0') await runStep0();
  else if (step === '1') await runStep1();
  else if (step === '2') await runStep2();
  else if (step === '3') await runStep3();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
