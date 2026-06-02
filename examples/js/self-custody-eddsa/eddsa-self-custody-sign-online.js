/**
 * EdDSA TSS Self-Custody SIGN: ONLINE Script (Requires Network)
 *
 * Creates TxRequest, exchanges EdDSA commitments with BitGo, submits R/G signature shares,
 * and finalizes the transaction. Never handles raw user signing material.
 *
 * Steps:
 *   0: prebuildTransaction → tx-request.json; fetch BitGo MPCv1 GPG public key
 *   1: POST .../commit (exchange commitments)
 *   2: POST signature share (user R) + fetch BitGo→user R share
 *   3: POST signature share (user G) + fetch finalized TxRequest (EdDSA auto-delivers on G share)
 *
 * Usage:
 *   BITGO_ACCESS_TOKEN=... COIN=tsol WALLET_ID=... node eddsa-self-custody-sign-online.js --step 0
 *   node eddsa-self-custody-sign-online.js --step 1
 *   node eddsa-self-custody-sign-online.js --step 2
 *   node eddsa-self-custody-sign-online.js --step 3
 *
 * Environment (step 0): BITGO_ACCESS_TOKEN, COIN, WALLET_ID, RECIPIENT_ADDRESS, AMOUNT
 *
 * BitGo docs:
 *   https://developers.bitgo.com/docs/withdraw-wallet-type-self-custody-mpc-hot-manual
 *   https://developers.bitgo.com/reference/v2wallettxrequestcreate
 *   https://developers.bitgo.com/reference/v2wallettxrequestsignaturesharecreate
 */
require('dotenv').config();
const fs = require('fs');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./eddsa-sign-workspace-schema');
const { wrapBitGoForV1Auth } = require('../self-custody-mcp-v2/bitgo-auth-utils');

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

function getApiVersion(txRequest) {
  return txRequest.apiVersion === 'full' ? 'full' : 'lite';
}

async function runStep0() {
  const bitgo = getBitGo();
  const coinId = process.env.COIN || 'tsol';
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
    const constants = await bitgo.fetchConstants();
    const bitgoPublicKey = constants.mpc && constants.mpc.bitgoPublicKey;
    if (!bitgoPublicKey) {
      throw new Error('Unable to fetch BitGo MPCv1 GPG public key (constants.mpc.bitgoPublicKey missing)');
    }
    writeJson(FILES.bitgoGpgPublicKey, { bitgoGpgPublicKey: bitgoPublicKey });
  }

  console.log(
    '[ONLINE] Step 0 done. Copy tx-request.json and bitgo-gpg-public-key.json to offline machine, run offline --step 1.'
  );
}

async function runStep1() {
  const bitgo = getBitGo();
  const { commonTssMethods } = require('@bitgo/sdk-core');
  const { exchangeEddsaCommitments } = commonTssMethods;

  const txRequest = readJson(FILES.txRequest);
  const walletId = txRequest.walletId;
  const txRequestId = txRequest.txRequestId;
  const apiVersion = getApiVersion(txRequest);

  const payload = readJson(FILES.signCommitmentPayload);
  const { commitmentShare, encryptedSignerShare } = payload;
  if (!commitmentShare || !encryptedSignerShare) {
    throw new Error('sign-commitment-payload.json must contain commitmentShare and encryptedSignerShare');
  }

  const RequestTracer = require('@bitgo/sdk-core').RequestTracer;
  const response = await exchangeEddsaCommitments(
    bitgo,
    walletId,
    txRequestId,
    commitmentShare,
    encryptedSignerShare,
    apiVersion,
    new RequestTracer()
  );

  writeJson(FILES.signCommitmentResponse, response);
  console.log('[ONLINE] Step 1 done. Copy sign-commitment-response.json to offline machine, run offline --step 2.');
}

async function runStep2() {
  const bitgo = getBitGo();
  const { EDDSAMethods, RequestType } = require('@bitgo/sdk-core');
  const { sendSignatureShare, getBitgoToUserRShare } = EDDSAMethods;

  const txRequest = readJson(FILES.txRequest);
  const walletId = txRequest.walletId;
  const txRequestId = txRequest.txRequestId;
  const apiVersion = getApiVersion(txRequest);

  const payload = readJson(FILES.signRPayload);
  const { userToBitgoRSignatureShare, encryptedSignerShare } = payload;
  if (!userToBitgoRSignatureShare || !encryptedSignerShare) {
    throw new Error('sign-r-payload.json must contain userToBitgoRSignatureShare and encryptedSignerShare');
  }

  const RequestTracer = require('@bitgo/sdk-core').RequestTracer;
  const reqId = new RequestTracer();

  await sendSignatureShare(
    bitgo,
    walletId,
    txRequestId,
    userToBitgoRSignatureShare,
    RequestType.tx,
    encryptedSignerShare.share,
    'eddsa',
    apiVersion,
    undefined,
    reqId
  );

  const bitgoToUserRShare = await getBitgoToUserRShare(bitgo, walletId, txRequestId, reqId, RequestType.tx);

  writeJson(FILES.signRResponse, { bitgoToUserRShare });
  console.log('[ONLINE] Step 2 done. Copy sign-r-response.json to offline machine, run offline --step 3.');
}

async function runStep3() {
  const bitgo = getBitGo();
  const { EDDSAMethods, commonTssMethods, RequestType } = require('@bitgo/sdk-core');
  const { sendUserToBitgoGShare } = EDDSAMethods;
  const { getTxRequest } = commonTssMethods;

  const txRequest = readJson(FILES.txRequest);
  const walletId = txRequest.walletId;
  const txRequestId = txRequest.txRequestId;
  const apiVersion = getApiVersion(txRequest);

  const RequestTracer = require('@bitgo/sdk-core').RequestTracer;
  const reqId = new RequestTracer();

  let currentTxRequest = await getTxRequest(bitgo, walletId, txRequestId, reqId);
  const alreadyDelivered = currentTxRequest.state === 'delivered';

  if (!alreadyDelivered) {
    const payload = readJson(FILES.signGPayload);
    const { gShare } = payload;
    if (!gShare) throw new Error('sign-g-payload.json must contain gShare');

    await sendUserToBitgoGShare(bitgo, walletId, txRequestId, gShare, apiVersion, reqId, RequestType.tx);
    currentTxRequest = await getTxRequest(bitgo, walletId, txRequestId, reqId);
  } else {
    console.log(
      '[ONLINE] TxRequest is already delivered (G share was accepted earlier). Skipping G share submit; fetching final state.'
    );
  }

  // EdDSA TSS: BitGo delivers the tx when the user G share is submitted (see EddsaUtils.signTxRequest).
  // Do not call sendTxRequest here — that endpoint expects pendingDelivery and is used for ECDSA MPCv2.
  writeJson(FILES.signResult, currentTxRequest);

  console.log('[ONLINE] Step 3 done. TxRequest state:', currentTxRequest.state);
  console.log('[ONLINE] Sign result written to sign-result.json');
  const txHash =
    currentTxRequest.transactions?.[0]?.txHash ||
    currentTxRequest.transactions?.[0]?.signedTx?.txHash ||
    currentTxRequest.transactions?.[0]?.signedTx?.id;
  if (txHash) {
    console.log('Tx hash:', txHash);
  }
}

async function main() {
  const step =
    process.argv.find((a) => a.startsWith('--step='))
      ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
      : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['0', '1', '2', '3'].includes(step)) {
    console.error('Usage: node eddsa-self-custody-sign-online.js --step 0|1|2|3');
    process.exit(1);
  }
  if (process.env.EDDSA_SIGN_WORKSPACE_DIR) {
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
