/**
 * Multisig (on-chain 2-of-3) Self-Custody SIGN: OFFLINE Script (No Network)
 *
 * Signs a transaction using the user or backup key from local-encrypted-keys.json.
 * Reads tx-prebuild.json (from online step 0), decrypts the chosen key with WALLET_PASSPHRASE,
 * and calls baseCoin.signTransaction(...). Writes half-signed.json for the online script to submit.
 *
 * No network calls. Raw private key exists only in memory.
 *
 * Usage:
 *   WALLET_PASSPHRASE="..." COIN=tbtc SIGNER=user node multisig-sign-offline.js
 *   WALLET_PASSPHRASE="..." COIN=teth SIGNER=backup node multisig-sign-offline.js
 *
 * Prerequisites:
 *   - tx-prebuild.json in workspace (from online script --step 0)
 *   - local-encrypted-keys.json in workspace (from keygen; same dir when using MULTISIG_WORKSPACE_DIR)
 *   - WALLET_PASSPHRASE, COIN (e.g. tbtc, teth); SIGNER=user (default) or backup
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
  console.log(`[OFFLINE] Wrote ${name}`);
}

async function run() {
  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required');

  const coin = process.env.COIN || 'tbtc';
  const signer = (process.env.SIGNER || 'user').toLowerCase();
  if (signer !== 'user' && signer !== 'backup') {
    throw new Error('SIGNER must be user or backup');
  }

  const BitGo = require('bitgo').BitGo;
  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });
  const baseCoin = bitgo.coin(coin);

  const txPrebuildPayload = readJson(FILES.txPrebuild);
  const { txPrebuild, walletId, pubs } = txPrebuildPayload;
  if (!txPrebuild || !walletId) {
    throw new Error('tx-prebuild.json must contain txPrebuild and walletId');
  }

  const localKeys = readJson(FILES.localEncryptedKeys);
  const encryptedPrv = signer === 'user' ? localKeys.userEncryptedPrv : localKeys.backupEncryptedPrv;
  if (!encryptedPrv) {
    throw new Error(`local-encrypted-keys.json must contain ${signer}EncryptedPrv`);
  }

  const prv = bitgo.decrypt({ input: encryptedPrv, password: passphrase });

  const signParams = {
    txPrebuild: { ...txPrebuild, walletId },
    prv,
    pubs: pubs || undefined,
  };

  const signed = await baseCoin.signTransaction(signParams);
  writeJson(FILES.halfSigned, signed);

  console.log('[OFFLINE] Step 1 done. Copy half-signed.json to online machine and run multisig-sign-online.js --step 1.');
}

async function main() {
  if (process.env.MULTISIG_SIGN_WORKSPACE_DIR || process.env.MULTISIG_WORKSPACE_DIR) {
    console.log('[OFFLINE] Workspace:', WORKSPACE_DIR);
  }
  await run();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
