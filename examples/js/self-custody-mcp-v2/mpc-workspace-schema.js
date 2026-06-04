/**
 * MPCv2 two-script workspace: file names and directory.
 * Used by mpc-self-custody-offline.js and mpc-self-custody-online.js.
 * Do NOT commit the workspace directory; it may contain sensitive state.
 *
 * File schema (all JSON):
 * - bitgo-gpg-public-key.json: { bitgoGpgPublicKey: string }  (armored; written by online, read by offline)
 * - round1-payload.json: payload for POST /mpc/generatekey R1 (userGpgPublicKey, backupGpgPublicKey, userMsg1, backupMsg1)
 * - round1-response.json: BitGo R1 response (sessionId, bitgoMsg1, bitgoToUserMsg2, bitgoToBackupMsg2)
 * - round1-state.json: { userSessionData, backupSessionData, userGpgKey, backupGpgKey, round1BroadcastMessages } (sensitive; offline only)
 * - round2-payload.json, round2-response.json, round2-state.json: same pattern
 * - round3-payload.json, round3-response.json, round3-state.json: same pattern
 * - keychain-payloads.json: { userKeychainParams, backupKeychainParams, bitgoKeychainParams, commonKeychain } (encryptedPrv only, no raw private)
 * - wallet-result.json: { walletId, receiveAddress, userKeychainId, backupKeychainId, bitgoKeychainId } (written by online)
 */

const path = require('path');

const WORKSPACE_DIR = process.env.MPC_WORKSPACE_DIR || path.join(__dirname, 'mpc-keygen-workspace');

const FILES = {
  bitgoGpgPublicKey: 'bitgo-gpg-public-key.json',
  round1Payload: 'round1-payload.json',
  round1Response: 'round1-response.json',
  round1State: 'round1-state.json',
  round2Payload: 'round2-payload.json',
  round2Response: 'round2-response.json',
  round2State: 'round2-state.json',
  round3Payload: 'round3-payload.json',
  round3Response: 'round3-response.json',
  round3State: 'round3-state.json',
  keychainPayloads: 'keychain-payloads.json',
  walletResult: 'wallet-result.json',
};

function workspacePath(filename) {
  return path.join(WORKSPACE_DIR, filename);
}

module.exports = { WORKSPACE_DIR, FILES, workspacePath };
