/**
 * EdDSA TSS Self-Custody Wallet: OFFLINE Script (No Network)
 *
 * Generates user/backup TSS key shares and GPG keys locally; prepares BitGo keychain payload.
 * After BitGo returns key shares, combines keys and encrypts signing material for registration.
 *
 * Steps:
 *   1: Generate key shares + GPG keys; write bitgo-keychain-payload.json + encrypted offline state
 *   2: Read bitgo-keychain-response.json; build user/backup keychain params + user-signing-material.json
 *
 * Usage:
 *   WALLET_PASSPHRASE=... node eddsa-self-custody-offline.js --step 1
 *   WALLET_PASSPHRASE=... node eddsa-self-custody-offline.js --step 2
 *
 * BitGo docs: https://developers.bitgo.com/docs/wallets-create-mpc-keys
 */
require('dotenv').config();
const fs = require('fs');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./eddsa-keygen-workspace-schema');
const {
  generateLocalKeyMaterial,
  buildBitgoKeychainPayload,
  buildUserAndBackupKeychainParams,
} = require('./eddsa-keygen-helpers');

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

  const gpgConfig = readJson(FILES.bitgoGpgPublicKey);
  const bitgoGpgPublicKey = gpgConfig.bitgoGpgPublicKey;
  if (!bitgoGpgPublicKey) {
    throw new Error('Missing bitgo-gpg-public-key.json — run online script --step 0 first');
  }

  const BitGo = require('bitgo').BitGo;
  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });

  const { userKeyShare, backupKeyShare, userGpgKey, backupGpgKey } = await generateLocalKeyMaterial();

  const bitgoPayload = await buildBitgoKeychainPayload(
    userKeyShare,
    backupKeyShare,
    userGpgKey,
    backupGpgKey,
    bitgoGpgPublicKey
  );

  const encryptedState = bitgo.encrypt({
    input: JSON.stringify({ userKeyShare, backupKeyShare, userGpgKey, backupGpgKey }),
    password: passphrase,
  });

  writeJson(FILES.bitgoKeychainPayload, bitgoPayload);
  writeJson(FILES.eddsaOfflineState, { encryptedState });

  console.log('[OFFLINE] Step 1 done. Copy bitgo-keychain-payload.json to online machine, run online --step 1.');
}

async function runStep2() {
  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required for step 2');

  const BitGo = require('bitgo').BitGo;
  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });

  const bitgoKeychain = readJson(FILES.bitgoKeychainResponse);
  const offlineState = readJson(FILES.eddsaOfflineState);

  const { userKeychainParams, backupKeychainParams, userSigningMaterial } =
    await buildUserAndBackupKeychainParams(bitgoKeychain, offlineState, passphrase, bitgo);

  writeJson(FILES.userKeychainParams, userKeychainParams);
  writeJson(FILES.backupKeychainParams, backupKeychainParams);
  writeJson(FILES.userSigningMaterial, userSigningMaterial);

  console.log(
    '[OFFLINE] Step 2 done. Copy user-keychain-params.json and backup-keychain-params.json to online machine, run online --step 2.'
  );
  console.log('[OFFLINE] user-signing-material.json is for local signing — keep on offline machine.');
}

async function main() {
  const step =
    process.argv.find((a) => a.startsWith('--step='))
      ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
      : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['1', '2'].includes(step)) {
    console.error('Usage: node eddsa-self-custody-offline.js --step 1|2');
    process.exit(1);
  }
  if (process.env.EDDSA_KEYGEN_WORKSPACE_DIR) {
    console.log('[OFFLINE] Workspace:', WORKSPACE_DIR);
  }
  if (step === '1') await runStep1();
  else await runStep2();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
