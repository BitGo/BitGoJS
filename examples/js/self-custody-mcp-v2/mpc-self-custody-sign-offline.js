/**
 * MPCv2 Self-Custody SIGN: OFFLINE Script (No Network)
 *
 * Produces signature shares for MPCv2 ECDSA signing (3-round DSG). Runs on an air-gapped
 * or offline machine. Reads TxRequest and encrypted user key from workspace; writes
 * round payloads and state. Raw key material never leaves this machine.
 *
 * Steps:
 *   1: DSG round 1 — init signer, produce signature share R1, encrypt session + GPG key
 *   2: DSG round 2 — restore session, process BitGo R1 response, produce R2 share
 *   3: DSG round 3 — restore session, process BitGo R2 response, produce R3 share
 *
 * Usage:
 *   WALLET_PASSPHRASE=... COIN=teth node mpc-self-custody-sign-offline.js --step 1
 *   node mpc-self-custody-sign-offline.js --step 2
 *   node mpc-self-custody-sign-offline.js --step 3
 *
 * Prerequisites:
 *   - tx-request.json (from online step 0)
 *   - User encrypted key: keychain-payloads.json (userKeychainParams.encryptedPrv) in workspace, or ENCRYPTED_USER_KEY env
 *   - bitgo-gpg-public-key.json (for steps 2, 3; can reuse from keygen workspace)
 *   - WALLET_PASSPHRASE, COIN (e.g. teth)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./mpc-sign-workspace-schema');

const openpgp = require('openpgp');
openpgp.config.rejectCurves = new Set();

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

function getHashAndDerivationPath(txRequest) {
  if (!txRequest.transactions || txRequest.transactions.length !== 1) {
    throw new Error('TxRequest must have exactly one transaction');
  }
  const signableHex = txRequest.transactions[0].unsignedTx.signableHex;
  const derivationPath = txRequest.transactions[0].unsignedTx.derivationPath;
  let hash;
  try {
    const BitGo = require('bitgo').BitGo;
    const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });
    const coin = bitgo.coin(process.env.COIN || 'teth');
    hash = coin.getHashFunction();
  } catch (err) {
    const createKeccakHash = require('keccak');
    hash = createKeccakHash('keccak256');
  }
  const hashBuffer = hash.update(Buffer.from(signableHex, 'hex')).digest();
  return { hashBuffer, derivationPath };
}

function getEncryptedUserKey() {
  if (process.env.ENCRYPTED_USER_KEY) return process.env.ENCRYPTED_USER_KEY;
  const keychainPayloadsPath = workspacePath(FILES.keychainPayloads);
  if (!fs.existsSync(keychainPayloadsPath)) {
    throw new Error('Missing keychain-payloads.json and ENCRYPTED_USER_KEY not set');
  }
  const payloads = JSON.parse(fs.readFileSync(keychainPayloadsPath, 'utf8'));
  if (!payloads.userKeychainParams || !payloads.userKeychainParams.encryptedPrv) {
    throw new Error('keychain-payloads.json must contain userKeychainParams.encryptedPrv');
  }
  return payloads.userKeychainParams.encryptedPrv;
}

async function runStep1() {
  const { DklsDsg, DklsTypes } = require('@bitgo/sdk-lib-mpc');
  const BitGo = require('bitgo').BitGo;
  const { generateGPGKeyPair, DKLSMethods } = require('@bitgo/sdk-core');
  const { getSignatureShareRoundOne } = DKLSMethods;

  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required');

  const txRequest = readJson(FILES.txRequest);
  const { hashBuffer, derivationPath } = getHashAndDerivationPath(txRequest);
  const adata = `${hashBuffer.toString('hex')}:${derivationPath}`;

  const encryptedPrv = getEncryptedUserKey();
  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });
  const prv = bitgo.decrypt({ input: encryptedPrv, password: passphrase });
  const userKeyShare = Buffer.from(prv, 'base64');

  const userGpgKey = await generateGPGKeyPair('secp256k1');
  const userSigner = new DklsDsg.Dsg(userKeyShare, 0, derivationPath, hashBuffer);
  const userSignerBroadcastMsg1 = await userSigner.init();
  const signatureShareRound1 = await getSignatureShareRoundOne(userSignerBroadcastMsg1, userGpgKey);

  const session = userSigner.getSession();
  const encryptedRound1Session = bitgo.encrypt({ input: session, password: passphrase, adata });
  const encryptedUserGpgPrvKey = bitgo.encrypt({
    input: userGpgKey.privateKey,
    password: passphrase,
    adata,
  });

  writeJson(FILES.signRound1Payload, {
    signatureShareRound1: {
      from: signatureShareRound1.from,
      to: signatureShareRound1.to,
      share: signatureShareRound1.share,
    },
    userGpgPubKey: userGpgKey.publicKey,
  });
  writeJson(FILES.signRound1State, {
    encryptedRound1Session,
    encryptedUserGpgPrvKey,
  });
  console.log('[OFFLINE] Step 1 done. Copy sign-round1-payload.json to online machine, run online step 1.');
}

async function runStep2() {
  const { DklsDsg, DklsTypes } = require('@bitgo/sdk-lib-mpc');
  const BitGo = require('bitgo').BitGo;
  const { DKLSMethods } = require('@bitgo/sdk-core');
  const { getSignatureShareRoundTwo, verifyBitGoMessagesAndSignaturesRoundOne } = DKLSMethods;
  const pgp = require('openpgp');

  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required');

  const txRequest = readJson(FILES.signRound1Response);
  const { hashBuffer, derivationPath } = getHashAndDerivationPath(txRequest);
  const adata = `${hashBuffer.toString('hex')}:${derivationPath}`;

  const config = readJson(FILES.bitgoGpgPublicKey);
  const bitgoPublicGpgKey = config.bitgoGpgPublicKey;
  if (!bitgoPublicGpgKey) throw new Error('bitgo-gpg-public-key.json required');

  const signRound1State = readJson(FILES.signRound1State);
  const { encryptedRound1Session, encryptedUserGpgPrvKey } = signRound1State;

  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });
  const round1Session = bitgo.decrypt({ input: encryptedRound1Session, password: passphrase });
  const cypherJson = JSON.parse(encryptedRound1Session);
  if (decodeURIComponent(cypherJson.adata) !== decodeURIComponent(adata)) {
    throw new Error('Adata does not match encrypted round1 session');
  }

  const bitgoGpgKey = await pgp.readKey({ armoredKey: bitgoPublicGpgKey });
  const userDecryptedKey = await pgp.readKey({
    armoredKey: bitgo.decrypt({ input: encryptedUserGpgPrvKey, password: passphrase }),
  });
  const userGpgKey = {
    privateKey: userDecryptedKey.armor(),
    publicKey: userDecryptedKey.toPublic().armor(),
  };

  const signatureShares = txRequest.transactions?.[0]?.signatureShares;
  if (!signatureShares || signatureShares.length === 0) {
    throw new Error('Missing signature shares in round 1 response');
  }
  const lastShare = signatureShares[signatureShares.length - 1];
  const parsedBitGoRound1 = JSON.parse(lastShare.share);
  if (parsedBitGoRound1.type !== 'round1Output') {
    throw new Error('Unexpected signature share type: ' + (parsedBitGoRound1.type || 'unknown'));
  }
  const serializedBitGoToUserMessagesRound1 = await verifyBitGoMessagesAndSignaturesRoundOne(
    parsedBitGoRound1,
    userGpgKey,
    bitgoGpgKey
  );
  const deserializedMessages = DklsTypes.deserializeMessages(serializedBitGoToUserMessagesRound1);

  const encryptedPrv = getEncryptedUserKey();
  const prv = bitgo.decrypt({ input: encryptedPrv, password: passphrase });
  const userKeyShare = Buffer.from(prv, 'base64');
  const userSigner = new DklsDsg.Dsg(userKeyShare, 0, derivationPath, hashBuffer);
  await userSigner.setSession(round1Session);

  const userToBitGoMessagesRound2 = userSigner.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: deserializedMessages.broadcastMessages,
  });
  const userToBitGoMessagesRound3 = userSigner.handleIncomingMessages({
    p2pMessages: deserializedMessages.p2pMessages,
    broadcastMessages: [],
  });
  const signatureShareRound2 = await getSignatureShareRoundTwo(
    userToBitGoMessagesRound2,
    userToBitGoMessagesRound3,
    userGpgKey,
    bitgoGpgKey
  );

  const session = userSigner.getSession();
  const encryptedRound2Session = bitgo.encrypt({ input: session, password: passphrase, adata });

  writeJson(FILES.signRound2Payload, {
    signatureShareRound2: {
      from: signatureShareRound2.from,
      to: signatureShareRound2.to,
      share: signatureShareRound2.share,
    },
  });
  writeJson(FILES.signRound2State, { encryptedRound2Session });
  console.log('[OFFLINE] Step 2 done. Copy sign-round2-payload.json to online machine, run online step 2.');
}

async function runStep3() {
  const { DklsDsg, DklsTypes } = require('@bitgo/sdk-lib-mpc');
  const BitGo = require('bitgo').BitGo;
  const { DKLSMethods } = require('@bitgo/sdk-core');
  const { getSignatureShareRoundThree, verifyBitGoMessagesAndSignaturesRoundTwo } = DKLSMethods;
  const pgp = require('openpgp');

  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required');

  const txRequest = readJson(FILES.signRound2Response);
  const { hashBuffer, derivationPath } = getHashAndDerivationPath(txRequest);
  const adata = `${hashBuffer.toString('hex')}:${derivationPath}`;

  const config = readJson(FILES.bitgoGpgPublicKey);
  const bitgoPublicGpgKey = config.bitgoGpgPublicKey;
  if (!bitgoPublicGpgKey) throw new Error('bitgo-gpg-public-key.json required');

  const signRound2State = readJson(FILES.signRound2State);
  const { encryptedRound2Session } = signRound2State;
  const signRound1State = readJson(FILES.signRound1State);
  const { encryptedUserGpgPrvKey } = signRound1State;

  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });
  const cypherJson = JSON.parse(encryptedRound2Session);
  if (decodeURIComponent(cypherJson.adata) !== decodeURIComponent(adata)) {
    throw new Error('Adata does not match encrypted round2 session');
  }
  const round2Session = bitgo.decrypt({ input: encryptedRound2Session, password: passphrase });

  const bitgoGpgKey = await pgp.readKey({ armoredKey: bitgoPublicGpgKey });
  const userDecryptedKey = await pgp.readKey({
    armoredKey: bitgo.decrypt({ input: encryptedUserGpgPrvKey, password: passphrase }),
  });
  const userGpgKey = {
    privateKey: userDecryptedKey.armor(),
    publicKey: userDecryptedKey.toPublic().armor(),
  };

  const signatureShares = txRequest.transactions?.[0]?.signatureShares;
  if (!signatureShares || signatureShares.length === 0) {
    throw new Error('Missing signature shares in round 2 response');
  }
  const lastShare = signatureShares[signatureShares.length - 1];
  const parsedBitGoRound2 = JSON.parse(lastShare.share);
  if (parsedBitGoRound2.type !== 'round2Output') {
    throw new Error('Unexpected signature share type: ' + (parsedBitGoRound2.type || 'unknown'));
  }
  const serializedBitGoToUserMessagesRound3 = await verifyBitGoMessagesAndSignaturesRoundTwo(
    parsedBitGoRound2,
    userGpgKey,
    bitgoGpgKey
  );
  const deserializedBitGoToUserMessagesRound3 = DklsTypes.deserializeMessages({
    p2pMessages: serializedBitGoToUserMessagesRound3.p2pMessages,
    broadcastMessages: [],
  });

  const encryptedPrv = getEncryptedUserKey();
  const prv = bitgo.decrypt({ input: encryptedPrv, password: passphrase });
  const userKeyShare = Buffer.from(prv, 'base64');
  const userSigner = new DklsDsg.Dsg(userKeyShare, 0, derivationPath, hashBuffer);
  await userSigner.setSession(round2Session);

  const userToBitGoMessagesRound4 = userSigner.handleIncomingMessages({
    p2pMessages: deserializedBitGoToUserMessagesRound3.p2pMessages,
    broadcastMessages: [],
  });
  const signatureShareRound3 = await getSignatureShareRoundThree(
    userToBitGoMessagesRound4,
    userGpgKey,
    bitgoGpgKey
  );

  writeJson(FILES.signRound3Payload, {
    signatureShareRound3: {
      from: signatureShareRound3.from,
      to: signatureShareRound3.to,
      share: signatureShareRound3.share,
    },
  });
  console.log('[OFFLINE] Step 3 done. Copy sign-round3-payload.json to online machine, run online step 3.');
}

async function main() {
  const step =
    process.argv.find((a) => a.startsWith('--step='))
      ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
      : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['1', '2', '3'].includes(step)) {
    console.error('Usage: node mpc-self-custody-sign-offline.js --step 1|2|3');
    process.exit(1);
  }
  if (process.env.MPC_WORKSPACE_DIR || process.env.MPC_SIGN_WORKSPACE_DIR) {
    console.log('[OFFLINE] Workspace:', WORKSPACE_DIR);
  }
  if (step === '1') await runStep1();
  else if (step === '2') await runStep2();
  else if (step === '3') await runStep3();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
