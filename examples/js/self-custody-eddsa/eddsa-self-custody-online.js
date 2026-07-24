/**
 * EdDSA TSS Self-Custody Wallet: ONLINE Script (Requires Network)
 *
 * Fetches BitGo GPG key, creates BitGo TSS keychain from offline payload, registers user/backup
 * keychains, and creates the wallet.
 *
 * Steps:
 *   0: Fetch BitGo MPCv1 GPG public key → bitgo-gpg-public-key.json
 *   1: POST /key (BitGo keychain) from bitgo-keychain-payload.json → bitgo-keychain-response.json
 *   2: POST user + backup keychains, POST /wallet/add → wallet-result.json
 *
 * Usage:
 *   BITGO_ACCESS_TOKEN=... COIN=tsol node eddsa-self-custody-online.js --step 0
 *   node eddsa-self-custody-online.js --step 1
 *   WALLET_LABEL="My EdDSA Wallet" node eddsa-self-custody-online.js --step 2
 *
 * BitGo docs: https://developers.bitgo.com/docs/wallets-create-mpc-keys
 */
require('dotenv').config();
const fs = require('fs');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./eddsa-keygen-workspace-schema');
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

async function runStep0() {
  const bitgo = getBitGo();

  const constants = await bitgo.fetchConstants();
  const bitgoPublicKey = constants.mpc && constants.mpc.bitgoPublicKey;
  if (!bitgoPublicKey) {
    throw new Error('Unable to fetch BitGo MPCv1 GPG public key (constants.mpc.bitgoPublicKey missing)');
  }

  writeJson(FILES.bitgoGpgPublicKey, { bitgoGpgPublicKey: bitgoPublicKey });
  console.log('[ONLINE] Step 0 done. Copy bitgo-gpg-public-key.json to offline machine, run offline --step 1.');
}

async function runStep1() {
  const bitgo = getBitGo();
  const coinId = process.env.COIN || 'tsol';
  const enterprise = process.env.ENTERPRISE || '';

  const payload = readJson(FILES.bitgoKeychainPayload);
  const baseCoin = bitgo.coin(coinId);
  const keychains = baseCoin.keychains();

  const bitgoKeychain = await keychains.add({
    ...payload,
    enterprise: enterprise || undefined,
  });

  writeJson(FILES.bitgoKeychainResponse, bitgoKeychain);
  console.log('[ONLINE] Step 1 done. Copy bitgo-keychain-response.json to offline machine, run offline --step 2.');
}

async function runStep2() {
  const bitgo = getBitGo();
  const coinId = process.env.COIN || 'tsol';
  const label = process.env.WALLET_LABEL || 'EdDSA Self-Custody Wallet (two-script)';
  const enterprise = process.env.ENTERPRISE || '';

  const userKeychainParams = readJson(FILES.userKeychainParams);
  const backupKeychainParams = readJson(FILES.backupKeychainParams);
  const bitgoKeychain = readJson(FILES.bitgoKeychainResponse);

  const baseCoin = bitgo.coin(coinId);
  const keychains = baseCoin.keychains();

  const userKeychain = await keychains.add({ ...userKeychainParams, enterprise: enterprise || undefined });
  const backupKeychain = await keychains.createBackup({
    ...backupKeychainParams,
    enterprise: enterprise || undefined,
  });

  const walletParams = {
    label,
    m: 2,
    n: 3,
    keys: [userKeychain.id, backupKeychain.id, bitgoKeychain.id],
    type: 'hot',
    multisigType: 'tss',
    enterprise: enterprise || undefined,
  };

  const keychainsTriplet = { userKeychain, backupKeychain, bitgoKeychain };
  const finalWalletParams = await baseCoin.supplementGenerateWallet(walletParams, keychainsTriplet);
  const newWallet = await bitgo.post(baseCoin.url('/wallet/add')).send(finalWalletParams).result();

  const walletResult = {
    walletId: newWallet.id,
    receiveAddress: newWallet.receiveAddress,
    userKeychainId: userKeychain.id,
    backupKeychainId: backupKeychain.id,
    bitgoKeychainId: bitgoKeychain.id,
  };
  writeJson(FILES.walletResult, walletResult);

  console.log('\n[ONLINE] Wallet created (EdDSA TSS two-script).');
  console.log('Wallet ID:', walletResult.walletId);
  console.log('Receive address:', walletResult.receiveAddress);
}

async function main() {
  const step =
    process.argv.find((a) => a.startsWith('--step='))
      ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
      : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['0', '1', '2'].includes(step)) {
    console.error('Usage: node eddsa-self-custody-online.js --step 0|1|2');
    process.exit(1);
  }
  if (process.env.EDDSA_KEYGEN_WORKSPACE_DIR) {
    console.log('[ONLINE] Workspace:', WORKSPACE_DIR);
  }
  if (step === '0') await runStep0();
  else if (step === '1') await runStep1();
  else if (step === '2') await runStep2();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
