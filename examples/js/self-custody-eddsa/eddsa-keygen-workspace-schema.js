/**
 * EdDSA TSS self-custody KEYGEN workspace file names.
 * Used by eddsa-self-custody-offline.js and eddsa-self-custody-online.js.
 * Do NOT commit the workspace directory.
 */

const path = require('path');

const WORKSPACE_DIR =
  process.env.EDDSA_KEYGEN_WORKSPACE_DIR ||
  process.env.MPC_WORKSPACE_DIR ||
  path.join(__dirname, 'eddsa-keygen-workspace');

const FILES = {
  bitgoGpgPublicKey: 'bitgo-gpg-public-key.json',
  bitgoKeychainPayload: 'bitgo-keychain-payload.json',
  bitgoKeychainResponse: 'bitgo-keychain-response.json',
  eddsaOfflineState: 'eddsa-offline-state.json',
  userKeychainParams: 'user-keychain-params.json',
  backupKeychainParams: 'backup-keychain-params.json',
  userSigningMaterial: 'user-signing-material.json',
  walletResult: 'wallet-result.json',
};

function workspacePath(filename) {
  return path.join(WORKSPACE_DIR, filename);
}

module.exports = { WORKSPACE_DIR, FILES, workspacePath };
