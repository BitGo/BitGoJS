/**
 * Multisig (on-chain 2-of-3) SIGN workspace: file names and directory.
 * Used by multisig-sign-offline.js and multisig-sign-online.js.
 * Do NOT commit the workspace directory; it may contain sensitive state.
 *
 * Reuse the same directory as keygen (MULTISIG_WORKSPACE_DIR) when possible so
 * local-encrypted-keys.json is present; or set MULTISIG_SIGN_WORKSPACE_DIR.
 *
 * File schema (all JSON):
 * - tx-prebuild.json: { txPrebuild, walletId, pubs, txParams? }; written by online step 0
 * - half-signed.json: SignedTransaction (halfSigned or txHex per coin); written by offline step 1
 * - sign-result.json: result from submitTransaction; written by online step 1
 * - local-encrypted-keys.json: from keygen workspace; read by offline step 1 (same dir when reusing keygen workspace)
 */

const path = require('path');

const WORKSPACE_DIR =
  process.env.MULTISIG_SIGN_WORKSPACE_DIR ||
  process.env.MULTISIG_WORKSPACE_DIR ||
  path.join(__dirname, 'multisig-workspace');

const FILES = {
  txPrebuild: 'tx-prebuild.json',
  halfSigned: 'half-signed.json',
  signResult: 'sign-result.json',
  localEncryptedKeys: 'local-encrypted-keys.json',
};

function workspacePath(filename) {
  return path.join(WORKSPACE_DIR, filename);
}

module.exports = { WORKSPACE_DIR, FILES, workspacePath };
