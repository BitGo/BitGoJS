/* eslint-disable no-console */
/* eslint-disable no-sync */
/**
 * MPCv2 Self-Custody Wallet: OFFLINE Script (No Network)
 *
 * This script implements the LOCAL/OFFLINE portions of creating an MPC self-custody wallet using
 * the TSS (Threshold Signature Scheme) flow. It generates and manages your p-shares (private shares)
 * locally - they NEVER leave your machine. Only encrypted n-shares (to other participants) are sent
 * to BitGo via the online script.
 *
 * What this script does:
 * - Generates user and backup key shares (p-shares + n-shares) using DKG (Distributed Key Generation)
 * - Generates GPG key pairs for encrypting n-shares between participants
 * - Performs multi-round DKG protocol (MPCv2: 4 rounds) to establish key shares
 * - Runs key combine (p-share + n-shares from others) to produce signing material
 * - Encrypts signing material with your passphrase before sending to BitGo for registration
 *
 * Security model:
 * - Your p-shares (private shares) stay on this offline machine
 * - Only encrypted n-shares and passphrase-encrypted signing material are sent via online script
 * - BitGo never receives your p-shares or full private keys
 * - 2-of-3 threshold: transactions require 2 of 3 key shares to sign
 *
 * ===========================================================================================
 * STEP-BY-STEP FLOW (corresponds to create-wallet.md sections 2.3-2.8):
 * ===========================================================================================
 *
 * STEP 1 (Offline, local only):
 *   What: Generate user & backup key shares (index 1 & 2); generate GPG key pairs
 *   Maps to doc: 2.3 (Generate user key share), 2.4 (Generate backup key share),
 *                2.5 (Generate GPG key pairs)
 *   Operations:
 *     - Create DKG sessions for user (index 1) and backup (index 2) with n=3, m=2
 *     - Call initDkg() to generate round 1 broadcast messages (containing commitments)
 *     - Generate secp256k1 GPG key pairs for user and backup (for encrypting n-shares)
 *     - Encrypt round 1 messages with BitGo's GPG public key
 *   Output: round1-payload.json (encrypted messages for BitGo), round1-state.json (session state)
 *   Next: Run online script --step 1 to send round1-payload.json to BitGo
 *
 * STEP 2 (Offline, local only):
 *   What: Process BitGo's round 1 response and generate round 2 P2P messages
 *   Maps to doc: Part of 2.6 (Create BitGo keychain - DKG continues)
 *   Operations:
 *     - Restore user and backup DKG sessions from round1-state.json
 *     - Decrypt and verify BitGo's round 1 broadcast message
 *     - Call handleIncomingMessages() with all round 1 broadcasts to generate round 2 P2P messages
 *     - Round 2 messages are P2P (point-to-point) between each pair of participants
 *     - Encrypt round 2 messages with BitGo's GPG public key
 *   Input: round1-response.json (from online script, containing BitGo's round 1 message)
 *   Output: round2-payload.json (encrypted P2P messages to BitGo), round2-state.json
 *   Next: Run online script --step 2 to send round2-payload.json to BitGo
 *
 * STEP 3 (Offline, local only):
 *   What: Process BitGo's round 2 & 3 responses and generate round 3 & 4 messages
 *   Maps to doc: Part of 2.6 (Create BitGo keychain - DKG continues)
 *   Operations:
 *     - Restore sessions from round2-state.json
 *     - Decrypt BitGo's round 2 P2P messages (bitgoToUser, bitgoToBackup)
 *     - Process round 2 P2P messages to generate round 3 P2P messages
 *     - Decrypt BitGo's round 3 P2P messages (BitGo is one step ahead in MPCv2)
 *     - Process round 3 P2P messages to generate round 4 broadcast messages (final commitments)
 *     - Encrypt and authenticate all messages for BitGo
 *   Input: round2-response.json (from online script, containing BitGo's round 2 & 3 messages)
 *   Output: round3-payload.json (round 3 P2P + round 4 broadcasts), round3-state.json
 *   Next: Run online script --step 3 to send round3-payload.json to BitGo
 *
 * STEP 4 (Offline, local only - requires WALLET_PASSPHRASE):
 *   What: Finalize DKG, extract key shares, perform key combine, encrypt signing material
 *   Maps to doc: 2.6 (finalize BitGo keychain), 2.7 (Create user keychain),
 *                2.8 (Create backup keychain - key combine + encrypt)
 *   Operations:
 *     - Restore sessions from round3-state.json
 *     - Decrypt and verify BitGo's round 4 broadcast message
 *     - Process all round 4 broadcasts to finalize DKG
 *     - Extract key shares (getKeyShare() - this is your p-share + received n-shares)
 *     - Verify common keychain matches across all participants
 *     - Perform key combine: combine p-share with n-shares to produce signing material
 *     - Encrypt signing material with your WALLET_PASSPHRASE (AES encryption)
 *     - Prepare keychain params with encrypted signing material (NOT raw p-shares)
 *   Input: round3-response.json (from online script, containing BitGo's round 4 message + commonKeychain)
 *   Output: keychain-payloads.json (passphrase-encrypted signing material for user/backup keychains)
 *   Next: Run online script --step 4 to register keychains and create wallet
 *
 * ===========================================================================================
 *
 * Usage:
 *   node mpc-self-custody-offline.js --step 1
 *   (Then run: node mpc-self-custody-online.js --step 1)
 *   node mpc-self-custody-offline.js --step 2
 *   (Then run: node mpc-self-custody-online.js --step 2)
 *   node mpc-self-custody-offline.js --step 3
 *   (Then run: node mpc-self-custody-online.js --step 3)
 *   WALLET_PASSPHRASE="your-secure-passphrase" node mpc-self-custody-offline.js --step 4
 *   (Then run: node mpc-self-custody-online.js --step 4)
 *
 * Prerequisites:
 *   - bitgo-gpg-public-key.json (from online script --step 0)
 *   - WALLET_PASSPHRASE environment variable (for step 4)
 *   - Workspace directory for storing state files (default: ./mpc-workspace/)
 *
 * Important security notes:
 *   - Your p-shares (private key shares) never leave this machine
 *   - Only encrypted n-shares and passphrase-encrypted signing material are written to workspace files
 *   - Protect your passphrase - it's needed to decrypt signing material for transactions
 *   - Keep workspace files secure - they contain your encrypted key material
 *   - Back up your encrypted key shares to a secure location
 */
require('dotenv').config();
const fs = require('fs');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./mpc-workspace-schema');

// Configure OpenPGP to accept all curves (required for secp256k1 GPG keys)
const openpgp = require('openpgp');
openpgp.config.rejectCurves = new Set();

const MPCv2PartiesEnum = { USER: 0, BACKUP: 1, BITGO: 2 };

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

function sessionDataToJson(sessionData) {
  const o = {
    dkgSessionBytes: Buffer.from(sessionData.dkgSessionBytes).toString('base64'),
    dkgState: sessionData.dkgState,
  };
  if (sessionData.chainCodeCommitment) {
    o.chainCodeCommitment = Buffer.from(sessionData.chainCodeCommitment).toString('base64');
  }
  if (sessionData.keyShareBuff) {
    o.keyShareBuff = Buffer.from(sessionData.keyShareBuff).toString('base64');
  }
  return o;
}

function sessionDataFromJson(o) {
  const sessionData = {
    dkgSessionBytes: new Uint8Array(Buffer.from(o.dkgSessionBytes, 'base64')),
    dkgState: o.dkgState,
  };
  if (o.chainCodeCommitment) {
    sessionData.chainCodeCommitment = new Uint8Array(Buffer.from(o.chainCodeCommitment, 'base64'));
  }
  if (o.keyShareBuff) {
    sessionData.keyShareBuff = Buffer.from(o.keyShareBuff, 'base64');
  }
  return sessionData;
}

function formatBitgoBroadcastMessage(broadcastMessage) {
  // Ensure from is always a number (BITGO = 2)
  const from =
    typeof broadcastMessage.from === 'number'
      ? broadcastMessage.from
      : typeof broadcastMessage.from === 'string'
      ? parseInt(broadcastMessage.from, 10)
      : MPCv2PartiesEnum.BITGO;

  // Handle different possible formats from API response
  // Case 1: Already formatted with payload: { from: 2, payload: { message, signature } }
  if (broadcastMessage.payload && broadcastMessage.payload.message && broadcastMessage.payload.signature) {
    return {
      from: from,
      payload: {
        message: String(broadcastMessage.payload.message),
        signature: String(broadcastMessage.payload.signature),
      },
    };
  }
  // Case 2: Flat structure: { from: 2, message: "...", signature: "..." }
  // This is the format returned by BitGo API (spreading bitgoMsg1.payload)
  if (broadcastMessage.message && broadcastMessage.signature) {
    return {
      from: from,
      payload: {
        message: String(broadcastMessage.message),
        signature: String(broadcastMessage.signature),
      },
    };
  }
  throw new Error(
    `Invalid bitgoMsg1 format. Expected { from, payload: { message, signature } } or { from, message, signature }, got: ${JSON.stringify(
      broadcastMessage
    )}`
  );
}

function formatP2PMessage(p2pMessage, commitment) {
  const payload = p2pMessage.payload || {
    encryptedMessage: p2pMessage.encryptedMessage,
    signature: p2pMessage.signature,
  };
  return { payload, from: p2pMessage.from, to: p2pMessage.to, commitment: commitment || p2pMessage.commitment };
}

async function runStep1() {
  const { DklsDkg, DklsComms, DklsTypes } = require('@bitgo/sdk-lib-mpc');
  const { generateGPGKeyPair } = require('@bitgo/sdk-core');

  const config = readJson(FILES.bitgoGpgPublicKey);
  const bitgoPublicGpgKey = config.bitgoGpgPublicKey;
  if (!bitgoPublicGpgKey) throw new Error('bitgoGpgPublicKey required in bitgo-gpg-public-key.json');

  const n = 3;
  const m = 2;
  const userSession = new DklsDkg.Dkg(n, m, MPCv2PartiesEnum.USER);
  const backupSession = new DklsDkg.Dkg(n, m, MPCv2PartiesEnum.BACKUP);
  const userGpgKey = await generateGPGKeyPair('secp256k1');
  const backupGpgKey = await generateGPGKeyPair('secp256k1');

  const userRound1BroadcastMsg = await userSession.initDkg();
  const backupRound1BroadcastMsg = await backupSession.initDkg();

  const bitgoGpgPubKey = { partyId: MPCv2PartiesEnum.BITGO, gpgKey: bitgoPublicGpgKey };
  const userGpgPrvKey = { partyId: MPCv2PartiesEnum.USER, gpgKey: userGpgKey.privateKey };
  const backupGpgPrvKey = { partyId: MPCv2PartiesEnum.BACKUP, gpgKey: backupGpgKey.privateKey };

  const round1SerializedMessages = DklsTypes.serializeMessages({
    broadcastMessages: [userRound1BroadcastMsg, backupRound1BroadcastMsg],
    p2pMessages: [],
  });
  const round1Messages = await DklsComms.encryptAndAuthOutgoingMessages(
    round1SerializedMessages,
    [bitgoGpgPubKey],
    [userGpgPrvKey, backupGpgPrvKey]
  );

  const userMsg1Payload = round1Messages.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER)?.payload;
  const backupMsg1Payload = round1Messages.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BACKUP)?.payload;
  if (!userMsg1Payload || !backupMsg1Payload) throw new Error('Round 1 broadcast messages not found');

  const round1Payload = {
    userGpgPublicKey: userGpgKey.publicKey,
    backupGpgPublicKey: backupGpgKey.publicKey,
    userMsg1: { from: 0, ...userMsg1Payload },
    backupMsg1: { from: 1, ...backupMsg1Payload },
  };
  writeJson(FILES.round1Payload, round1Payload);

  const round1State = {
    userSessionData: sessionDataToJson(userSession.getSessionData()),
    backupSessionData: sessionDataToJson(backupSession.getSessionData()),
    userGpgPublicKey: userGpgKey.publicKey,
    userGpgPrivateKey: userGpgKey.privateKey,
    backupGpgPublicKey: backupGpgKey.publicKey,
    backupGpgPrivateKey: backupGpgKey.privateKey,
    userRound1BroadcastMsg: DklsTypes.serializeBroadcastMessage(userRound1BroadcastMsg),
    backupRound1BroadcastMsg: DklsTypes.serializeBroadcastMessage(backupRound1BroadcastMsg),
  };
  writeJson(FILES.round1State, round1State);
  console.log('[OFFLINE] Step 1 done. Run online script for round 1, then run --step 2.');
}

async function runStep2() {
  const { DklsDkg, DklsComms, DklsTypes } = require('@bitgo/sdk-lib-mpc');

  const config = readJson(FILES.bitgoGpgPublicKey);
  const bitgoPublicGpgKey = config.bitgoGpgPublicKey;
  const round1State = readJson(FILES.round1State);
  const round1Response = readJson(FILES.round1Response);

  const n = 3;
  const m = 2;
  const userSession = await DklsDkg.Dkg.restoreSession(
    n,
    m,
    MPCv2PartiesEnum.USER,
    sessionDataFromJson(round1State.userSessionData)
  );
  const backupSession = await DklsDkg.Dkg.restoreSession(
    n,
    m,
    MPCv2PartiesEnum.BACKUP,
    sessionDataFromJson(round1State.backupSessionData)
  );

  const bitgoGpgPubKey = { partyId: MPCv2PartiesEnum.BITGO, gpgKey: bitgoPublicGpgKey };
  const userGpgPrvKey = { partyId: MPCv2PartiesEnum.USER, gpgKey: round1State.userGpgPrivateKey };
  const backupGpgPrvKey = { partyId: MPCv2PartiesEnum.BACKUP, gpgKey: round1State.backupGpgPrivateKey };

  // Format the BitGo message for verification
  const formattedBitgoMsg1 = formatBitgoBroadcastMessage(round1Response.bitgoMsg1);

  // Verify the structure is correct before passing to verification
  if (!formattedBitgoMsg1.payload || !formattedBitgoMsg1.payload.message || !formattedBitgoMsg1.payload.signature) {
    throw new Error(`Invalid formatted bitgoMsg1 structure: ${JSON.stringify(formattedBitgoMsg1)}`);
  }
  if (formattedBitgoMsg1.from !== MPCv2PartiesEnum.BITGO) {
    throw new Error(
      `Invalid from field in bitgoMsg1: expected ${MPCv2PartiesEnum.BITGO}, got ${formattedBitgoMsg1.from}`
    );
  }

  const bitgoRound1BroadcastMessages = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [],
      broadcastMessages: [formattedBitgoMsg1],
    },
    [bitgoGpgPubKey],
    [userGpgPrvKey, backupGpgPrvKey]
  );
  const bitgoRound1BroadcastMsg = bitgoRound1BroadcastMessages.broadcastMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BITGO
  );
  if (!bitgoRound1BroadcastMsg) throw new Error('BitGo message 1 not found');

  const userRound1BroadcastMsg = DklsTypes.deserializeBroadcastMessage(round1State.userRound1BroadcastMsg);
  const backupRound1BroadcastMsg = DklsTypes.deserializeBroadcastMessage(round1State.backupRound1BroadcastMsg);
  const userRound2P2PMessages = userSession.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [DklsTypes.deserializeBroadcastMessage(bitgoRound1BroadcastMsg), backupRound1BroadcastMsg],
  });

  const backupRound2P2PMessages = backupSession.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [userRound1BroadcastMsg, DklsTypes.deserializeBroadcastMessage(bitgoRound1BroadcastMsg)],
  });

  const userToBitgoMsg2 = userRound2P2PMessages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
  );
  const serializedBackupToBitgoMsg2 = DklsTypes.serializeMessages(backupRound2P2PMessages).p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
  );
  if (!userToBitgoMsg2 || !serializedBackupToBitgoMsg2) throw new Error('Round 2 P2P messages not found');

  const round2Messages = await DklsComms.encryptAndAuthOutgoingMessages(
    {
      p2pMessages: [DklsTypes.serializeP2PMessage(userToBitgoMsg2), serializedBackupToBitgoMsg2],
      broadcastMessages: [],
    },
    [bitgoGpgPubKey],
    [userGpgPrvKey, backupGpgPrvKey]
  );

  const userMsg2 = round2Messages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
  );
  const backupMsg2 = round2Messages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
  );
  if (!userMsg2?.commitment || !backupMsg2?.commitment) throw new Error('Round 2 commitments not found');

  const round2Payload = {
    sessionId: round1Response.sessionId,
    userMsg2: {
      from: MPCv2PartiesEnum.USER,
      to: MPCv2PartiesEnum.BITGO,
      signature: userMsg2.payload.signature,
      encryptedMessage: userMsg2.payload.encryptedMessage,
    },
    userCommitment2: userMsg2.commitment,
    backupMsg2: {
      from: MPCv2PartiesEnum.BACKUP,
      to: MPCv2PartiesEnum.BITGO,
      signature: backupMsg2.payload.signature,
      encryptedMessage: backupMsg2.payload.encryptedMessage,
    },
    backupCommitment2: backupMsg2.commitment,
  };
  writeJson(FILES.round2Payload, round2Payload);

  const userToBackupMsg2 = userRound2P2PMessages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BACKUP
  );
  const backupToUserMsg2 = backupRound2P2PMessages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.USER
  );
  const backupToBitgoMsg2Ser = backupRound2P2PMessages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
  );

  const round2State = {
    userSessionData: sessionDataToJson(userSession.getSessionData()),
    backupSessionData: sessionDataToJson(backupSession.getSessionData()),
    userGpgPublicKey: round1State.userGpgPublicKey,
    userGpgPrivateKey: round1State.userGpgPrivateKey,
    backupGpgPublicKey: round1State.backupGpgPublicKey,
    backupGpgPrivateKey: round1State.backupGpgPrivateKey,
    sessionId: round1Response.sessionId,
    bitgoToUserMsg2: round1Response.bitgoToUserMsg2,
    bitgoToBackupMsg2: round1Response.bitgoToBackupMsg2,
    backupToUserMsg2: backupToUserMsg2 ? DklsTypes.serializeP2PMessage(backupToUserMsg2) : undefined,
    userToBackupMsg2: userToBackupMsg2 ? DklsTypes.serializeP2PMessage(userToBackupMsg2) : undefined,
    backupToBitgoMsg2: backupToBitgoMsg2Ser ? DklsTypes.serializeP2PMessage(backupToBitgoMsg2Ser) : undefined,
  };
  writeJson(FILES.round2State, round2State);
  console.log('[OFFLINE] Step 2 done. Run online script for round 2, then run --step 3.');
}

async function runStep3() {
  const { DklsDkg, DklsComms, DklsTypes } = require('@bitgo/sdk-lib-mpc');

  const config = readJson(FILES.bitgoGpgPublicKey);
  const bitgoPublicGpgKey = config.bitgoGpgPublicKey;
  const round2State = readJson(FILES.round2State);
  const round2Response = readJson(FILES.round2Response);

  const n = 3;
  const m = 2;
  const userSession = await DklsDkg.Dkg.restoreSession(
    n,
    m,
    MPCv2PartiesEnum.USER,
    sessionDataFromJson(round2State.userSessionData)
  );
  const backupSession = await DklsDkg.Dkg.restoreSession(
    n,
    m,
    MPCv2PartiesEnum.BACKUP,
    sessionDataFromJson(round2State.backupSessionData)
  );

  const bitgoGpgPubKey = { partyId: MPCv2PartiesEnum.BITGO, gpgKey: bitgoPublicGpgKey };
  const userGpgPrvKey = { partyId: MPCv2PartiesEnum.USER, gpgKey: round2State.userGpgPrivateKey };
  const backupGpgPrvKey = { partyId: MPCv2PartiesEnum.BACKUP, gpgKey: round2State.backupGpgPrivateKey };

  // Decrypt BitGo's round 2 P2P messages (for generating round 3 messages)
  const decryptedBitgoToUserRound2Msgs = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [formatP2PMessage(round2State.bitgoToUserMsg2, round2Response.bitgoCommitment2)],
      broadcastMessages: [],
    },
    [bitgoGpgPubKey],
    [userGpgPrvKey]
  );
  const bitgoToUserRound2Msg = DklsTypes.deserializeP2PMessage(
    decryptedBitgoToUserRound2Msgs.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO && m.to === MPCv2PartiesEnum.USER
    )
  );

  const decryptedBitgoToBackupRound2Msg = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [formatP2PMessage(round2State.bitgoToBackupMsg2, round2Response.bitgoCommitment2)],
      broadcastMessages: [],
    },
    [bitgoGpgPubKey],
    [backupGpgPrvKey]
  );
  const bitgoToBackupRound2Msg = DklsTypes.deserializeP2PMessage(
    decryptedBitgoToBackupRound2Msg.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO && m.to === MPCv2PartiesEnum.BACKUP
    )
  );

  const backupToUserMsg2 = round2State.backupToUserMsg2
    ? DklsTypes.deserializeP2PMessage(round2State.backupToUserMsg2)
    : null;
  const userToBackupMsg2 = round2State.userToBackupMsg2
    ? DklsTypes.deserializeP2PMessage(round2State.userToBackupMsg2)
    : null;

  // Round 3 sub-round 1: Process round 2 P2P messages, generate round 3 P2P messages
  const userRound3Messages = userSession.handleIncomingMessages({
    broadcastMessages: [],
    p2pMessages: [bitgoToUserRound2Msg, backupToUserMsg2].filter(Boolean),
  });
  const backupRound3Messages = backupSession.handleIncomingMessages({
    broadcastMessages: [],
    p2pMessages: [bitgoToBackupRound2Msg, userToBackupMsg2].filter(Boolean),
  });

  // Extract round 3 P2P messages
  const userToBitgoMsg3 = userRound3Messages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
  );
  const backupToBitgoMsg3 = backupRound3Messages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
  );
  const userToBackupMsg3 = userRound3Messages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BACKUP
  );
  const backupToUserMsg3 = backupRound3Messages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.USER
  );

  if (!userToBitgoMsg3 || !backupToBitgoMsg3) {
    throw new Error('Round 3 P2P messages not found');
  }

  // Decrypt BitGo's round 3 P2P messages from round2Response (BitGo is one step ahead!)
  // Note: Round 3 messages use the commitment calculated at end of Round 2
  const decryptedBitgoToUserRound3Msgs = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [formatP2PMessage(round2Response.bitgoToUserMsg3, round2Response.bitgoCommitment2)],
      broadcastMessages: [],
    },
    [bitgoGpgPubKey],
    [userGpgPrvKey]
  );
  const bitgoToUserRound3Msg = DklsTypes.deserializeP2PMessage(
    decryptedBitgoToUserRound3Msgs.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO && m.to === MPCv2PartiesEnum.USER
    )
  );

  const decryptedBitgoToBackupRound3Msgs = await DklsComms.decryptAndVerifyIncomingMessages(
    {
      p2pMessages: [formatP2PMessage(round2Response.bitgoToBackupMsg3, round2Response.bitgoCommitment2)],
      broadcastMessages: [],
    },
    [bitgoGpgPubKey],
    [backupGpgPrvKey]
  );
  const bitgoToBackupRound3Msg = DklsTypes.deserializeP2PMessage(
    decryptedBitgoToBackupRound3Msgs.p2pMessages.find(
      (m) => m.from === MPCv2PartiesEnum.BITGO && m.to === MPCv2PartiesEnum.BACKUP
    )
  );

  // Round 3 sub-round 2: Process all round 3 P2P messages to generate round 4 broadcast messages
  const userRound4Messages = userSession.handleIncomingMessages({
    broadcastMessages: [],
    p2pMessages: [bitgoToUserRound3Msg, backupToUserMsg3].filter(Boolean),
  });
  const backupRound4Messages = backupSession.handleIncomingMessages({
    broadcastMessages: [],
    p2pMessages: [bitgoToBackupRound3Msg, userToBackupMsg3].filter(Boolean),
  });

  const userRound4BroadcastMsg = userRound4Messages.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER);
  const backupRound4BroadcastMsg = backupRound4Messages.broadcastMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BACKUP
  );

  if (!userRound4BroadcastMsg || !backupRound4BroadcastMsg) {
    throw new Error('Failed to generate round 4 broadcast messages');
  }

  // Encrypt and authenticate messages for BitGo
  const round3Messages = await DklsComms.encryptAndAuthOutgoingMessages(
    {
      p2pMessages: [DklsTypes.serializeP2PMessage(userToBitgoMsg3), DklsTypes.serializeP2PMessage(backupToBitgoMsg3)],
      broadcastMessages: [],
    },
    [bitgoGpgPubKey],
    [userGpgPrvKey, backupGpgPrvKey]
  );

  const round4Messages = await DklsComms.encryptAndAuthOutgoingMessages(
    {
      p2pMessages: [],
      broadcastMessages: [
        DklsTypes.serializeBroadcastMessage(userRound4BroadcastMsg),
        DklsTypes.serializeBroadcastMessage(backupRound4BroadcastMsg),
      ],
    },
    [bitgoGpgPubKey],
    [userGpgPrvKey, backupGpgPrvKey]
  );

  const userMsg3 = round3Messages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.USER && m.to === MPCv2PartiesEnum.BITGO
  )?.payload;
  const backupMsg3 = round3Messages.p2pMessages.find(
    (m) => m.from === MPCv2PartiesEnum.BACKUP && m.to === MPCv2PartiesEnum.BITGO
  )?.payload;
  const userMsg4 = round4Messages.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.USER)?.payload;
  const backupMsg4 = round4Messages.broadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BACKUP)?.payload;

  const round3Payload = {
    sessionId: round2State.sessionId,
    userMsg3: { from: 0, to: 2, ...userMsg3 },
    backupMsg3: { from: 1, to: 2, ...backupMsg3 },
    userMsg4: { from: 0, ...userMsg4 },
    backupMsg4: { from: 1, ...backupMsg4 },
  };
  writeJson(FILES.round3Payload, round3Payload);

  // Save session state and round 4 broadcast messages for step 4
  const round3State = {
    userSessionData: sessionDataToJson(userSession.getSessionData()),
    backupSessionData: sessionDataToJson(backupSession.getSessionData()),
    userGpgPublicKey: round2State.userGpgPublicKey,
    userGpgPrivateKey: round2State.userGpgPrivateKey,
    backupGpgPublicKey: round2State.backupGpgPublicKey,
    backupGpgPrivateKey: round2State.backupGpgPrivateKey,
    sessionId: round2State.sessionId,
    userRound4BroadcastMsg: DklsTypes.serializeBroadcastMessage(userRound4BroadcastMsg),
    backupRound4BroadcastMsg: DklsTypes.serializeBroadcastMessage(backupRound4BroadcastMsg),
  };
  writeJson(FILES.round3State, round3State);
  console.log('[OFFLINE] Step 3 done. Run online script for round 3, then run --step 4.');
}

async function runStep4() {
  const { DklsDkg, DklsComms, DklsTypes } = require('@bitgo/sdk-lib-mpc');
  const BitGo = require('bitgo').BitGo;

  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required for step 4');

  const config = readJson(FILES.bitgoGpgPublicKey);
  const bitgoPublicGpgKey = config.bitgoGpgPublicKey;
  const round3State = readJson(FILES.round3State);
  const round3Response = readJson(FILES.round3Response);

  const n = 3;
  const m = 2;
  const userSession = await DklsDkg.Dkg.restoreSession(
    n,
    m,
    MPCv2PartiesEnum.USER,
    sessionDataFromJson(round3State.userSessionData)
  );
  const backupSession = await DklsDkg.Dkg.restoreSession(
    n,
    m,
    MPCv2PartiesEnum.BACKUP,
    sessionDataFromJson(round3State.backupSessionData)
  );

  const bitgoGpgPubKey = { partyId: MPCv2PartiesEnum.BITGO, gpgKey: bitgoPublicGpgKey };

  // Round 4: Process BitGo's round 4 broadcast message to finalize key shares
  // Load the round 4 broadcast messages generated in step 3
  const userRound4BroadcastMsg = DklsTypes.deserializeBroadcastMessage(round3State.userRound4BroadcastMsg);
  const backupRound4BroadcastMsg = DklsTypes.deserializeBroadcastMessage(round3State.backupRound4BroadcastMsg);

  // Decrypt and verify BitGo's round 4 broadcast message
  const bitgoRound4BroadcastMessages = DklsTypes.deserializeMessages(
    await DklsComms.decryptAndVerifyIncomingMessages(
      {
        p2pMessages: [],
        broadcastMessages: [formatBitgoBroadcastMessage(round3Response.bitgoMsg4)],
      },
      [bitgoGpgPubKey],
      []
    )
  ).broadcastMessages;
  const bitgoRound4BroadcastMsg = bitgoRound4BroadcastMessages.find((m) => m.from === MPCv2PartiesEnum.BITGO);
  if (!bitgoRound4BroadcastMsg) throw new Error('BitGo message 4 not found');

  // Process all round 4 broadcast messages to finalize the DKG
  userSession.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [bitgoRound4BroadcastMsg, backupRound4BroadcastMsg],
  });
  backupSession.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [bitgoRound4BroadcastMsg, userRound4BroadcastMsg],
  });

  const userPrivateMaterial = userSession.getKeyShare();
  const backupPrivateMaterial = backupSession.getKeyShare();
  const userReducedPrivateMaterial = userSession.getReducedKeyShare();
  const backupReducedPrivateMaterial = backupSession.getReducedKeyShare();

  const commonKeychain = DklsTypes.getCommonKeychain(userPrivateMaterial);
  const commonKeychainBackup = DklsTypes.getCommonKeychain(backupPrivateMaterial);
  if (commonKeychain !== round3Response.commonKeychain || commonKeychain !== commonKeychainBackup) {
    throw new Error('Common keychain mismatch');
  }

  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });
  const encryptedPrvUser = bitgo.encrypt({
    input: userPrivateMaterial.toString('base64'),
    password: passphrase,
  });
  const reducedEncryptedPrvUser = bitgo.encrypt({
    input: Buffer.from(userReducedPrivateMaterial).toString('base64'),
    password: passphrase,
  });
  const encryptedPrvBackup = bitgo.encrypt({
    input: backupPrivateMaterial.toString('base64'),
    password: passphrase,
  });
  const reducedEncryptedPrvBackup = bitgo.encrypt({
    input: Buffer.from(backupReducedPrivateMaterial).toString('base64'),
    password: passphrase,
  });

  const userKeychainParams = {
    source: 'user',
    keyType: 'tss',
    commonKeychain,
    encryptedPrv: encryptedPrvUser,
    originalPasscodeEncryptionCode: process.env.ORIGINAL_PASSCODE_ENCRYPTION_CODE,
    isMPCv2: true,
  };
  const backupKeychainParams = {
    source: 'backup',
    keyType: 'tss',
    commonKeychain,
    encryptedPrv: encryptedPrvBackup,
    originalPasscodeEncryptionCode: process.env.ORIGINAL_PASSCODE_ENCRYPTION_CODE,
    isMPCv2: true,
  };
  const bitgoKeychainParams = {
    source: 'bitgo',
    keyType: 'tss',
    commonKeychain,
    isMPCv2: true,
  };

  writeJson(FILES.keychainPayloads, {
    userKeychainParams,
    backupKeychainParams,
    bitgoKeychainParams,
    commonKeychain,
    reducedEncryptedPrvUser,
    reducedEncryptedPrvBackup,
  });
  console.log('[OFFLINE] Step 4 done. Run online script to register keychains and create wallet.');
}

async function main() {
  const step = process.argv.find((a) => a.startsWith('--step='))
    ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
    : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['1', '2', '3', '4'].includes(step)) {
    console.error('Usage: node mpc-self-custody-offline.js --step 1|2|3|4');
    process.exit(1);
  }
  if (process.env.MPC_WORKSPACE_DIR) {
    console.log('[OFFLINE] Workspace:', process.env.MPC_WORKSPACE_DIR);
  }
  if (step === '1') await runStep1();
  else if (step === '2') await runStep2();
  else if (step === '3') await runStep3();
  else if (step === '4') await runStep4();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
