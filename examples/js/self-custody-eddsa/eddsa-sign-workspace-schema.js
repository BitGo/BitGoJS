/**
 * EdDSA TSS self-custody SIGNING workspace: file names and directory.
 * Used by eddsa-self-custody-sign-offline.js and eddsa-self-custody-sign-online.js.
 * Do NOT commit the workspace directory; it may contain sensitive state.
 *
 * Flow (commitment → R share → G share), aligned with BitGo EdDSA MPCv1 TSS signing:
 * - tx-request.json: TxRequest from online step 0
 * - bitgo-gpg-public-key.json: BitGo MPCv1 GPG public key (armored)
 * - sign-commitment-payload.json: user commitment + encrypted signer share + encrypted R-share state
 * - sign-commitment-response.json: BitGo commitment from POST .../commit
 * - sign-eddsa-state.json: encrypted User SignShare (sensitive; offline only)
 * - sign-r-payload.json: user→BitGo R signature share + encryptedSignerShare reference
 * - sign-r-response.json: BitGo→user R share (from refreshed TxRequest)
 * - sign-g-payload.json: user→BitGo G share fields for sendUserToBitgoGShare
 * - sign-result.json: finalized TxRequest
 *
 * User signing material: user-signing-material.json { encryptedPrv } or ENCRYPTED_USER_KEY env.
 * (From create-tss-wallet.js: wallet.userKeychain.encryptedPrv)
 */

const path = require('path');

const WORKSPACE_DIR =
  process.env.EDDSA_SIGN_WORKSPACE_DIR ||
  process.env.MPC_SIGN_WORKSPACE_DIR ||
  process.env.MPC_WORKSPACE_DIR ||
  path.join(__dirname, 'eddsa-sign-workspace');

const FILES = {
  txRequest: 'tx-request.json',
  bitgoGpgPublicKey: 'bitgo-gpg-public-key.json',
  userSigningMaterial: 'user-signing-material.json',
  signCommitmentPayload: 'sign-commitment-payload.json',
  signCommitmentResponse: 'sign-commitment-response.json',
  signEddsaState: 'sign-eddsa-state.json',
  signRPayload: 'sign-r-payload.json',
  signRResponse: 'sign-r-response.json',
  signGPayload: 'sign-g-payload.json',
  signResult: 'sign-result.json',
};

function workspacePath(filename) {
  return path.join(WORKSPACE_DIR, filename);
}

module.exports = { WORKSPACE_DIR, FILES, workspacePath };
