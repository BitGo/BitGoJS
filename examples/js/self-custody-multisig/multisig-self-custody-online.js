/**
 * Multisig (on-chain 2-of-3) Self-Custody Wallet: ONLINE Script (Requires Network)
 *
 * This script implements the ONLINE portions of creating an on-chain multisig self-custody wallet.
 * It creates the BitGo keychain, adds user and backup keychains, and creates the wallet.
 *
 * Step 0: Create BitGo keychain (keychains().createBitGo({ enterprise })), write bitgo-keychain.json.
 * Step 1: Read user/backup keychain params and key-signatures; add user and backup keychains;
 *         build wallet params (keys, keySignatures, label, m: 2, n: 3); supplementGenerateWallet
 *         if needed; POST /wallet/add; write wallet-result.json.
 *
 * Usage:
 *   BITGO_ACCESS_TOKEN="..." COIN=tbtc node multisig-self-custody-online.js --step 0
 *   (Copy bitgo-keychain.json to offline machine)
 *   BITGO_ACCESS_TOKEN="..." COIN=tbtc WALLET_LABEL="My Wallet" node multisig-self-custody-online.js --step 1
 *
 * Environment:
 *   Required: BITGO_ACCESS_TOKEN, COIN (e.g. tbtc, teth)
 *   Optional: WALLET_LABEL, ENTERPRISE, BITGO_ENV, MULTISIG_WORKSPACE_DIR
 */
require('dotenv').config();
const fs = require('fs');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./multisig-workspace-schema');

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

async function runStep0() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');

  const bitgoOptions = {
    env: process.env.BITGO_ENV || 'test',
    accessToken,
  };
  if (process.env.BITGO_CUSTOM_ROOT_URI) {
    bitgoOptions.customRootURI = process.env.BITGO_CUSTOM_ROOT_URI;
  }

  const bitgo = new BitGo(bitgoOptions);
  bitgo.authenticateWithAccessToken({ accessToken });

  const coin = process.env.COIN || 'tbtc';
  const enterprise = process.env.ENTERPRISE || '';
  const baseCoin = bitgo.coin(coin);
  const keychains = baseCoin.keychains();

  const bitgoKeychain = await keychains.createBitGo({ enterprise });
  const bitgoKeychainFile = {
    id: bitgoKeychain.id,
    pub: bitgoKeychain.pub,
  };
  writeJson(FILES.bitgoKeychain, bitgoKeychainFile);
  console.log('[ONLINE] Step 0 done. Copy bitgo-keychain.json to offline machine and run multisig-self-custody-offline.js --step 1.');
}

async function runStep1() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');

  const bitgoOptions = {
    env: process.env.BITGO_ENV || 'test',
    accessToken,
  };
  if (process.env.BITGO_CUSTOM_ROOT_URI) {
    bitgoOptions.customRootURI = process.env.BITGO_CUSTOM_ROOT_URI;
  }

  const bitgo = new BitGo(bitgoOptions);
  bitgo.authenticateWithAccessToken({ accessToken });

  const coin = process.env.COIN || 'tbtc';
  const label = process.env.WALLET_LABEL || 'Multisig Self-Custody Wallet (two-script)';
  const enterprise = process.env.ENTERPRISE || '';

  const baseCoin = bitgo.coin(coin);
  const keychains = baseCoin.keychains();

  const userKeychainParams = readJson(FILES.userKeychainParams);
  const backupKeychainParams = readJson(FILES.backupKeychainParams);
  const keySignatures = readJson(FILES.keySignatures);
  const bitgoKeychainFile = readJson(FILES.bitgoKeychain);

  const userKeychain = await keychains.add({ ...userKeychainParams, enterprise });
  const backupKeychain = await keychains.add({ ...backupKeychainParams, enterprise });

  const walletParams = {
    label,
    m: 2,
    n: 3,
    keys: [userKeychain.id, backupKeychain.id, bitgoKeychainFile.id],
    keySignatures,
  };
  if (enterprise) {
    walletParams.enterprise = enterprise;
  }

  const keychainsTriplet = {
    userKeychain,
    backupKeychain,
    bitgoKeychain: { id: bitgoKeychainFile.id, pub: bitgoKeychainFile.pub },
  };
  const finalWalletParams = await baseCoin.supplementGenerateWallet(walletParams, keychainsTriplet);

  const newWallet = await bitgo.post(baseCoin.url('/wallet/add')).send(finalWalletParams).result();

  const walletResult = {
    walletId: newWallet.id,
    receiveAddress: newWallet.receiveAddress,
    userKeychainId: userKeychain.id,
    backupKeychainId: backupKeychain.id,
    bitgoKeychainId: bitgoKeychainFile.id,
  };
  writeJson(FILES.walletResult, walletResult);

  console.log('\n[ONLINE] Wallet created (on-chain multisig two-script).');
  console.log('Wallet ID:', walletResult.walletId);
  console.log('Receive address:', walletResult.receiveAddress);
  console.log('Result written to', FILES.walletResult);
}

async function main() {
  const step = process.argv.find((a) => a.startsWith('--step='))
    ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
    : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['0', '1'].includes(step)) {
    console.error('Usage: node multisig-self-custody-online.js --step 0|1');
    process.exit(1);
  }
  if (process.env.MULTISIG_WORKSPACE_DIR) {
    console.log('[ONLINE] Workspace:', process.env.MULTISIG_WORKSPACE_DIR);
  }
  if (step === '0') await runStep0();
  else if (step === '1') await runStep1();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
