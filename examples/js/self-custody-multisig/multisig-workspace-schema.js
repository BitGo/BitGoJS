/**
 * Multisig (on-chain 2-of-3) two-script workspace: file names and directory.
 * Used by multisig-self-custody-offline.js and multisig-self-custody-online.js.
 * Do NOT commit the workspace directory; it may contain sensitive state.
 *
 * File schema (all JSON):
 * - bitgo-keychain.json: { id, pub } — BitGo keychain (written by online step 0, read by offline step 1)
 * - user-keychain-params.json: { pub, source: 'user' } — params for keychains().add (written by offline; no encryptedPrv)
 * - backup-keychain-params.json: { pub, source: 'backup' } — params for keychains().add (written by offline; no encryptedPrv)
 * - key-signatures.json: { backup, bitgo } — hex signatures (user signs backup.pub and bitgo.pub; written by offline)
 * - local-encrypted-keys.json: { userEncryptedPrv, backupEncryptedPrv } — OFFLINE ONLY; do not copy to online; use for local signing.
 * - wallet-result.json: { walletId, receiveAddress, userKeychainId, backupKeychainId, bitgoKeychainId } (written by online step 1)
 */

const path = require('path');

const WORKSPACE_DIR =
  process.env.MULTISIG_WORKSPACE_DIR ||
  process.env.MPC_WORKSPACE_DIR ||
  path.join(__dirname, 'multisig-workspace');

const FILES = {
  bitgoKeychain: 'bitgo-keychain.json',
  userKeychainParams: 'user-keychain-params.json',
  backupKeychainParams: 'backup-keychain-params.json',
  keySignatures: 'key-signatures.json',
  walletResult: 'wallet-result.json',
};

function workspacePath(filename) {
  return path.join(WORKSPACE_DIR, filename);
}

module.exports = { WORKSPACE_DIR, FILES, workspacePath };
