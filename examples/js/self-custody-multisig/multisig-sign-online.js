/**
 * Multisig (on-chain 2-of-3) Self-Custody SIGN: ONLINE Script (Requires Network)
 *
 * Step 0: Get wallet, prebuildTransaction(recipients), getKeysForSigning; optionally verifyTransaction.
 *         Write tx-prebuild.json. Copy to offline machine.
 * Step 1: Read half-signed.json, wallet.submitTransaction(params), write sign-result.json.
 *
 * Usage:
 *   BITGO_ACCESS_TOKEN="..." COIN=tbtc WALLET_ID="..." RECIPIENT_ADDRESS="..." AMOUNT="..." node multisig-sign-online.js --step 0
 *   BITGO_ACCESS_TOKEN="..." COIN=tbtc node multisig-sign-online.js --step 1
 *
 * Environment:
 *   Required: BITGO_ACCESS_TOKEN, COIN, WALLET_ID (step 0); RECIPIENT_ADDRESS, AMOUNT (step 0, or use tx-params.json)
 *   Optional: BITGO_ENV, MULTISIG_SIGN_WORKSPACE_DIR, MULTISIG_WORKSPACE_DIR, TX_PARAMS_FILE
 */
require('dotenv').config();
const fs = require('fs');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./multisig-sign-workspace-schema');

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
  const bitgo = new BitGo(opts);
  bitgo.authenticateWithAccessToken({ accessToken });
  return bitgo;
}

function getRecipients() {
  const txParamsFile = process.env.TX_PARAMS_FILE || 'tx-params.json';
  const txParamsPath = workspacePath(txParamsFile);
  if (fs.existsSync(txParamsPath)) {
    const txParams = JSON.parse(fs.readFileSync(txParamsPath, 'utf8'));
    if (txParams.recipients && Array.isArray(txParams.recipients)) {
      return txParams.recipients;
    }
  }
  const address = process.env.RECIPIENT_ADDRESS || '';
  const amount = process.env.AMOUNT || '0';
  if (!address) throw new Error('RECIPIENT_ADDRESS required for step 0 (or provide tx-params.json with recipients)');
  return [{ address, amount }];
}

async function runStep0() {
  const bitgo = getBitGo();
  const coinId = process.env.COIN || 'tbtc';
  const walletId = process.env.WALLET_ID || '';
  if (!walletId) throw new Error('WALLET_ID required for step 0');

  const baseCoin = bitgo.coin(coinId);
  const wallet = await baseCoin.wallets().get({ id: walletId });

  const recipients = getRecipients();
  const buildParams = { recipients };

  const txPrebuild = await wallet.prebuildTransaction(buildParams);

  const keychains = await baseCoin.keychains().getKeysForSigning({ wallet });
  const pubs = keychains.map((k) => {
    if (!k.pub) throw new Error('Keychain missing pub');
    return k.pub;
  });

  const txParams = { recipients };
  const optionalVerify = process.env.VERIFY_TX !== 'false';
  if (optionalVerify && txPrebuild.txHex && baseCoin.verifyTransaction) {
    await baseCoin.verifyTransaction({
      txPrebuild: { ...txPrebuild, walletId: wallet.id() },
      txParams: { recipients },
      wallet,
    });
  }

  const payload = {
    txPrebuild,
    walletId: wallet.id(),
    pubs,
    txParams,
  };
  writeJson(FILES.txPrebuild, payload);
  console.log('[ONLINE] Step 0 done. Copy tx-prebuild.json to offline machine and run multisig-sign-offline.js.');
}

async function runStep1() {
  const bitgo = getBitGo();
  const coinId = process.env.COIN || 'tbtc';
  const txPrebuildPayload = readJson(FILES.txPrebuild);
  const walletId = txPrebuildPayload.walletId || process.env.WALLET_ID || '';
  if (!walletId) throw new Error('walletId missing in tx-prebuild.json and WALLET_ID not set');

  const baseCoin = bitgo.coin(coinId);
  const wallet = await baseCoin.wallets().get({ id: walletId });

  const halfSignedPayload = readJson(FILES.halfSigned);
  const result = await wallet.submitTransaction(halfSignedPayload);
  writeJson(FILES.signResult, result);
  console.log('[ONLINE] Step 1 done. Sign result written to', FILES.signResult);
}

async function main() {
  const step = process.argv.find((a) => a.startsWith('--step='))
    ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
    : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['0', '1'].includes(step)) {
    console.error('Usage: node multisig-sign-online.js --step 0|1');
    process.exit(1);
  }
  if (process.env.MULTISIG_SIGN_WORKSPACE_DIR || process.env.MULTISIG_WORKSPACE_DIR) {
    console.log('[ONLINE] Workspace:', WORKSPACE_DIR);
  }
  if (step === '0') await runStep0();
  else await runStep1();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
