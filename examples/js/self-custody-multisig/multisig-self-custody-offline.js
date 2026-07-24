/**
 * Multisig (on-chain 2-of-3) Self-Custody Wallet: OFFLINE Script (No Network)
 *
 * This script implements the OFFLINE portion of creating an on-chain multisig self-custody wallet.
 * It generates user and backup keypairs locally and produces keychain params and key signatures.
 * encryptedPrv is never sent to BitGo: only pub + source are written to the params files copied to online.
 * Encrypted keys are written to local-encrypted-keys.json (KEEP OFFLINE — use for local signing only).
 *
 * What this script does (step 1 only):
 * - Reads bitgo-keychain.json (BitGo key id and pub)
 * - Creates user keypair: baseCoin.keychains().create() -> userPub, userPrv
 * - Creates backup keypair: baseCoin.keychains().create() -> backupPub, backupPrv
 * - Encrypts userPrv and backupPrv with WALLET_PASSPHRASE (bitgo.encrypt)
 * - Computes key signatures: user signs backup.pub and bitgo.pub (hex)
 * - Writes: user-keychain-params.json, backup-keychain-params.json (pub + source only), key-signatures.json,
 *   and local-encrypted-keys.json (encrypted keys for local signing — do not copy to online).
 *
 * Security:
 * - No network calls. Raw private keys never written to disk; only encrypted keys in local-encrypted-keys.json.
 * - BitGo never receives encryptedPrv; you must sign from a local signer for spends.
 *
 * Usage:
 *   WALLET_PASSPHRASE="your-passphrase" COIN=tbtc node multisig-self-custody-offline.js --step 1
 *
 * Prerequisites:
 *   - bitgo-keychain.json in workspace (from online script --step 0)
 *   - WALLET_PASSPHRASE, COIN environment variables
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
  console.log(`[OFFLINE] Wrote ${name}`);
}

async function runStep1() {
  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required for step 1');

  const coin = process.env.COIN || 'tbtc';
  const BitGo = require('bitgo').BitGo;
  // No access token - we only use coin(), keychains().create(), encrypt(), signMessage()
  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });
  const baseCoin = bitgo.coin(coin);

  const bitgoKeychain = readJson(FILES.bitgoKeychain);
  const bitgoPub = bitgoKeychain.pub;
  if (!bitgoPub) throw new Error('bitgo-keychain.json must contain pub');

  const keychains = baseCoin.keychains();
  const userKeypair = keychains.create();
  const backupKeypair = keychains.create();

  const userPrv = userKeypair.prv;
  const backupPrv = backupKeypair.prv;
  if (!userPrv || !backupPrv) throw new Error('keychains.create() must return prv');

  const userEncryptedPrv = bitgo.encrypt({ input: userPrv, password: passphrase });
  const backupEncryptedPrv = bitgo.encrypt({ input: backupPrv, password: passphrase });

  const keySignatures = {
    backup: (await baseCoin.signMessage({ prv: userPrv }, backupKeypair.pub)).toString('hex'),
    bitgo: (await baseCoin.signMessage({ prv: userPrv }, bitgoPub)).toString('hex'),
  };

  const userKeychainParams = { pub: userKeypair.pub, source: 'user' };
  const backupKeychainParams = { pub: backupKeypair.pub, source: 'backup' };

  writeJson(FILES.userKeychainParams, userKeychainParams);
  writeJson(FILES.backupKeychainParams, backupKeychainParams);
  writeJson(FILES.keySignatures, keySignatures);

  const localEncryptedKeysPath = workspacePath('local-encrypted-keys.json');
  fs.writeFileSync(
    localEncryptedKeysPath,
    JSON.stringify({ userEncryptedPrv, backupEncryptedPrv }, null, 0),
    { mode: 0o600 }
  );
  console.log('[OFFLINE] Wrote local-encrypted-keys.json (KEEP OFFLINE — do not copy to online; use for local signing).');

  console.log('[OFFLINE] Step 1 done. Copy user-keychain-params.json, backup-keychain-params.json, key-signatures.json to online machine and run multisig-self-custody-online.js --step 1.');
}

async function main() {
  const step = process.argv.find((a) => a.startsWith('--step='))
    ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
    : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || step !== '1') {
    console.error('Usage: node multisig-self-custody-offline.js --step 1');
    process.exit(1);
  }
  if (process.env.MULTISIG_WORKSPACE_DIR) {
    console.log('[OFFLINE] Workspace:', process.env.MULTISIG_WORKSPACE_DIR);
  }
  await runStep1();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
