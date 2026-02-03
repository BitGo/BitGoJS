/**
 * MPCv2 two-script SIGNING workspace: file names and directory.
 * Used by mpc-self-custody-sign-offline.js and mpc-self-custody-sign-online.js.
 * Do NOT commit the workspace directory; it may contain sensitive state.
 *
 * File schema (all JSON):
 * - tx-request.json: full TxRequest (txRequestId, walletId, unsignedTx with signableHex, derivationPath); written by online step 0
 * - bitgo-gpg-public-key.json: { bitgoGpgPublicKey: string } (armored; can reuse from keygen workspace)
 * - sign-round1-payload.json: { signatureShareRound1, userGpgPubKey }; written by offline step 1
 * - sign-round1-response.json: TxRequest after R1 (from BitGo); written by online step 1
 * - sign-round1-state.json: { encryptedRound1Session, encryptedUserGpgPrvKey } (sensitive; offline only)
 * - sign-round2-payload.json: { signatureShareRound2 }; written by offline step 2
 * - sign-round2-response.json: TxRequest after R2; written by online step 2
 * - sign-round2-state.json: { encryptedRound2Session } (sensitive; offline only)
 * - sign-round3-payload.json: { signatureShareRound3 }; written by offline step 3
 * - sign-result.json: final TxRequest or signed tx result; written by online step 3
 *
 * Optional: use same directory as keygen (MPC_WORKSPACE_DIR) so keychain-payloads.json is available for user encrypted key.
 */

const path = require('path');

const WORKSPACE_DIR =
  process.env.MPC_SIGN_WORKSPACE_DIR ||
  process.env.MPC_WORKSPACE_DIR ||
  path.join(__dirname, 'mpc-sign-workspace');

const FILES = {
  txRequest: 'tx-request.json',
  bitgoGpgPublicKey: 'bitgo-gpg-public-key.json',
  keychainPayloads: 'keychain-payloads.json',
  signRound1Payload: 'sign-round1-payload.json',
  signRound1Response: 'sign-round1-response.json',
  signRound1State: 'sign-round1-state.json',
  signRound2Payload: 'sign-round2-payload.json',
  signRound2Response: 'sign-round2-response.json',
  signRound2State: 'sign-round2-state.json',
  signRound3Payload: 'sign-round3-payload.json',
  signResult: 'sign-result.json',
};

function workspacePath(filename) {
  return path.join(WORKSPACE_DIR, filename);
}

module.exports = { WORKSPACE_DIR, FILES, workspacePath };
