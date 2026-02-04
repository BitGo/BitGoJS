/**
 * MPCv2 Self-Custody Wallet: ONLINE Script (Requires Network)
 *
 * This script implements the ONLINE/NETWORK portions of creating an MPC self-custody wallet using
 * the TSS (Threshold Signature Scheme) flow. It communicates with BitGo's APIs to:
 * - Fetch BitGo's configuration (TSS settings, GPG public key)
 * - Execute the multi-round DKG (Distributed Key Generation) protocol with BitGo
 * - Register keychains (with passphrase-encrypted signing material from offline script)
 * - Create the wallet linking all three keychains
 *
 * This script NEVER receives or handles raw p-shares (private shares). It only transmits:
 * - Encrypted n-shares (to BitGo) during DKG rounds
 * - Passphrase-encrypted signing material (from offline script) during keychain registration
 *
 * ===========================================================================================
 * STEP-BY-STEP FLOW (corresponds to create-wallet.md sections 2.1-2.2 and 2.6-2.9):
 * ===========================================================================================
 *
 * STEP 0 (Online - requires network):
 *   What: Fetch BitGo's TSS settings and GPG public key
 *   Maps to doc: 2.1 (Fetch BitGo TSS settings), 2.2 (Fetch BitGo public GPG key)
 *   API Endpoints:
 *     - GET {microservicesUrl}/api/v2/tss/settings
 *       Purpose: Determine MPC version (MPCv1 vs MPCv2) for the coin family
 *     - GET {baseApiUrl}/api/v1/client/constants
 *       Purpose: Obtain BitGo's GPG public key for encrypting n-shares sent to BitGo
 *   Operations:
 *     - Verify the coin supports MPCv2 (multisigTypeVersion === 'MPCv2')
 *     - Fetch BitGo's GPG public key (secp256k1) for encrypting n-shares
 *   Output: bitgo-gpg-public-key.json (BitGo's public GPG key)
 *   Next: Copy workspace to offline machine and run offline script --step 1
 *
 * STEP 1 (Online - requires network):
 *   What: Send round 1 DKG messages to BitGo and receive BitGo's round 1 response
 *   Maps to doc: Part of 2.6 (Create BitGo keychain - DKG round 1)
 *   API Endpoint:
 *     - POST {baseApiUrl}/api/v2/mpc/generatekey
 *       Payload: { enterprise, type: 'MPCv2', round: 'MPCv2-R1', payload: round1Payload }
 *   Operations:
 *     - Send encrypted round 1 broadcast messages (user & backup commitments) to BitGo
 *     - Send user & backup GPG public keys to BitGo
 *     - Receive BitGo's round 1 broadcast message and round 2 P2P messages
 *     - Receive sessionId for tracking this DKG session
 *   Input: round1-payload.json (from offline script --step 1)
 *   Output: round1-response.json (BitGo's round 1 broadcast + round 2 P2P messages)
 *   Next: Copy response to offline machine and run offline script --step 2
 *
 * STEP 2 (Online - requires network):
 *   What: Send round 2 DKG P2P messages to BitGo and receive BitGo's round 2 & 3 responses
 *   Maps to doc: Part of 2.6 (Create BitGo keychain - DKG round 2)
 *   API Endpoint:
 *     - POST {baseApiUrl}/api/v2/mpc/generatekey
 *       Payload: { enterprise, type: 'MPCv2', round: 'MPCv2-R2', payload: round2Payload }
 *   Operations:
 *     - Send sessionId (from round 1 response)
 *     - Send encrypted round 2 P2P messages (user→BitGo, backup→BitGo)
 *     - Send commitments for round 2 messages
 *     - Receive BitGo's round 2 P2P messages (BitGo→user, BitGo→backup)
 *     - Receive BitGo's round 3 P2P messages (BitGo is one step ahead in MPCv2)
 *     - Receive BitGo's commitment for round 2
 *   Input: round2-payload.json (from offline script --step 2)
 *   Output: round2-response.json (BitGo's round 2 & 3 P2P messages + commitment)
 *   Next: Copy response to offline machine and run offline script --step 3
 *
 * STEP 3 (Online - requires network):
 *   What: Send round 3 & 4 DKG messages to BitGo and receive BitGo's final round 4 response
 *   Maps to doc: Part of 2.6 (Create BitGo keychain - DKG rounds 3 & 4, finalize)
 *   API Endpoint:
 *     - POST {baseApiUrl}/api/v2/mpc/generatekey
 *       Payload: { enterprise, type: 'MPCv2', round: 'MPCv2-R3', payload: round3Payload }
 *   Operations:
 *     - Send sessionId (from previous rounds)
 *     - Send encrypted round 3 P2P messages (user→BitGo, backup→BitGo)
 *     - Send encrypted round 4 broadcast messages (user & backup final commitments)
 *     - Receive BitGo's round 4 broadcast message (final commitment)
 *     - Receive commonKeychain (the public keychain identifier - NOT a private key)
 *   Input: round3-payload.json (from offline script --step 3)
 *   Output: round3-response.json (BitGo's round 4 broadcast + commonKeychain)
 *   Next: Copy response to offline machine and run offline script --step 4
 *   Note: At this point, all three participants have completed DKG and possess their key shares
 *
 * STEP 4 (Online - requires network):
 *   What: Register keychains and create wallet
 *   Maps to doc: 2.7 (Create user keychain), 2.8 (Create backup keychain), 2.9 (Create wallet)
 *   API Endpoints:
 *     - POST {baseApiUrl}/api/v2/{coin}/key (called 3 times - user, backup, BitGo)
 *       Purpose: Register each keychain with passphrase-encrypted signing material
 *     - POST {baseApiUrl}/api/v2/{coin}/wallet
 *       Purpose: Create wallet linking the three keychains by their IDs
 *   Operations:
 *     - Read keychain-payloads.json (contains passphrase-encrypted signing material from offline script)
 *     - Register user keychain (source: 'user', encrypted signing material)
 *     - Register backup keychain (source: 'backup', encrypted signing material)
 *     - Register BitGo keychain (source: 'bitgo', no encrypted material - BitGo has its own p-share)
 *     - Determine wallet version based on coin type (e.g. walletVersion: 5 for EVM MPCv2)
 *     - Create wallet with m=2, n=3, multisigType='tss', linking all three keychain IDs
 *   Input: keychain-payloads.json (from offline script --step 4)
 *   Output: wallet-result.json (wallet ID, receive address, keychain IDs)
 *   Result: Fully operational self-custody MPC wallet
 *
 * ===========================================================================================
 *
 * Usage:
 *   BITGO_ACCESS_TOKEN="your-token" COIN="teth" node mpc-self-custody-online.js --step 0
 *   (Then copy workspace to offline machine and run offline --step 1)
 *   node mpc-self-custody-online.js --step 1
 *   (Then copy round1-response.json to offline machine and run offline --step 2)
 *   node mpc-self-custody-online.js --step 2
 *   (Then copy round2-response.json to offline machine and run offline --step 3)
 *   node mpc-self-custody-online.js --step 3
 *   (Then copy round3-response.json to offline machine and run offline --step 4)
 *   WALLET_LABEL="My Wallet" node mpc-self-custody-online.js --step 4
 *
 * Environment Variables:
 *   Required:
 *     - BITGO_ACCESS_TOKEN: Your BitGo API access token
 *     - COIN: Coin identifier (e.g., 'teth' for testnet ETH, 'tsol' for testnet SOL)
 *   Optional:
 *     - WALLET_LABEL: Wallet display name (default: 'MPCv2 Self-Custody Wallet (two-script)')
 *     - ENTERPRISE: Enterprise ID (for enterprise accounts)
 *     - BITGO_ENV: BitGo environment - 'test' or 'prod' (default: 'test')
 *     - BITGO_CUSTOM_ROOT_URI: Custom BitGo API URL (e.g., for BitGo Express proxy)
 *     - MPC_WORKSPACE_DIR: Workspace directory path (default: './mpc-workspace/')
 *
 * Important notes:
 *   - This script never handles raw p-shares - only encrypted n-shares and signing material
 *   - All cryptographic operations on p-shares happen in the offline script
 *   - The workspace files transferred between online/offline contain only encrypted data
 *   - Use BitGo Express (local signing server) for additional security layer if desired
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./mpc-workspace-schema');

const ROUNDS = { 1: 'MPCv2-R1', 2: 'MPCv2-R2', 3: 'MPCv2-R3' };
const KEYGEN_TYPE = 'MPCv2';

const { wrapBitGoForV1Auth } = require('./bitgo-auth-utils');

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
  console.log(`[ONLINE] Wrote ${name}`);
}

async function runStep0() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');

  const bitgoOptions = {
    env: process.env.BITGO_ENV || 'test',
    accessToken: accessToken,
    useProduction: false,
  };

  // Explicitly pass customRootURI if BITGO_CUSTOM_ROOT_URI is set
  if (process.env.BITGO_CUSTOM_ROOT_URI) {
    bitgoOptions.customRootURI = process.env.BITGO_CUSTOM_ROOT_URI;
  }

  let bitgo = new BitGo(bitgoOptions);
  bitgo = wrapBitGoForV1Auth(bitgo);

  // Authenticate with access token (required when using Express server)
  bitgo.authenticateWithAccessToken({ accessToken });

  const coin = process.env.COIN || 'hteth';
  const baseCoin = bitgo.coin(coin);
  const enterprise = process.env.ENTERPRISE || '';

  const tssSettings = await bitgo.get(bitgo.url('/tss/settings', 2)).result();
  const multisigTypeVersion =
    tssSettings.coinSettings?.[baseCoin.getFamily()]?.walletCreationSettings?.multiSigTypeVersion;
  if (multisigTypeVersion !== 'MPCv2') {
    throw new Error(`Coin ${coin} does not use MPCv2 (got ${multisigTypeVersion}). Use a coin that supports MPCv2.`);
  }

  const EcdsaMPCv2Utils = require('@bitgo/sdk-core').EcdsaMPCv2Utils;
  const mpcUtils = new EcdsaMPCv2Utils(bitgo, baseCoin);
  const bitgoPublicGpgKey = (
    (await mpcUtils.getBitgoGpgPubkeyBasedOnFeatureFlags(enterprise, true)) ?? mpcUtils.bitgoMPCv2PublicGpgKey
  ).armor();

  writeJson(FILES.bitgoGpgPublicKey, { bitgoGpgPublicKey: bitgoPublicGpgKey });
  console.log('[ONLINE] Step 0 done. Copy workspace to offline machine and run offline --step 1.');
}

async function runStep1() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');

  let bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test', customRootURI: process.env.BITGO_CUSTOM_ROOT_URI });
  bitgo = wrapBitGoForV1Auth(bitgo);
  bitgo.authenticateWithAccessToken({ accessToken });

  const enterprise = process.env.ENTERPRISE || '';
  const payload = readJson(FILES.round1Payload);

  const result = await bitgo
    .post(bitgo.url('/mpc/generatekey', 2))
    .send({ enterprise, type: KEYGEN_TYPE, round: ROUNDS[1], payload })
    .result();

  writeJson(FILES.round1Response, result);
  console.log('[ONLINE] Step 1 done. Copy round1-response.json to offline machine and run offline --step 2.');
}

async function runStep2() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');

  let bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test', customRootURI: process.env.BITGO_CUSTOM_ROOT_URI });
  bitgo = wrapBitGoForV1Auth(bitgo);
  bitgo.authenticateWithAccessToken({ accessToken });

  const enterprise = process.env.ENTERPRISE || '';
  const payload = readJson(FILES.round2Payload);

  const result = await bitgo
    .post(bitgo.url('/mpc/generatekey', 2))
    .send({ enterprise, type: KEYGEN_TYPE, round: ROUNDS[2], payload })
    .result();

  writeJson(FILES.round2Response, result);
  console.log('[ONLINE] Step 2 done. Copy round2-response.json to offline machine and run offline --step 3.');
}

async function runStep3() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');

  let bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test', customRootURI: process.env.BITGO_CUSTOM_ROOT_URI });
  bitgo = wrapBitGoForV1Auth(bitgo);
  bitgo.authenticateWithAccessToken({ accessToken });

  const enterprise = process.env.ENTERPRISE || '';
  const payload = readJson(FILES.round3Payload);

  const result = await bitgo
    .post(bitgo.url('/mpc/generatekey', 2))
    .send({ enterprise, type: KEYGEN_TYPE, round: ROUNDS[3], payload })
    .result();

  writeJson(FILES.round3Response, result);
  console.log('[ONLINE] Step 3 done. Copy round3-response.json to offline machine and run offline --step 4.');
}

async function runStep4() {
  const BitGo = require('bitgo').BitGo;
  const accessToken = process.env.BITGO_ACCESS_TOKEN || '';
  if (!accessToken) throw new Error('BITGO_ACCESS_TOKEN required');

  let bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test', customRootURI: process.env.BITGO_CUSTOM_ROOT_URI });
  bitgo = wrapBitGoForV1Auth(bitgo);
  bitgo.authenticateWithAccessToken({ accessToken });

  const coin = process.env.COIN || 'teth';
  const label = process.env.WALLET_LABEL || 'MPCv2 Self-Custody Wallet (two-script)';
  const enterprise = process.env.ENTERPRISE || '';

  const keychainPayloads = readJson(FILES.keychainPayloads);
  const { userKeychainParams, backupKeychainParams, bitgoKeychainParams } = keychainPayloads;

  const baseCoin = bitgo.coin(coin);
  const keychains = baseCoin.keychains();

  const userKeychain = await keychains.add({ ...userKeychainParams, enterprise });
  const backupKeychain = await keychains.add({ ...backupKeychainParams, enterprise });
  const bitgoKeychain = await keychains.add({ ...bitgoKeychainParams, enterprise });

  const walletParams = {
    label,
    m: 2,
    n: 3,
    keys: [userKeychain.id, backupKeychain.id, bitgoKeychain.id],
    type: 'hot',
    multisigType: 'tss',
    enterprise: enterprise || undefined,
  };

  const tssSettings = await bitgo.get(bitgo.microservicesUrl('/api/v2/tss/settings')).result();
  const multisigTypeVersion =
    tssSettings.coinSettings?.[baseCoin.getFamily()]?.walletCreationSettings?.multiSigTypeVersion;
  let walletVersion;
  if (typeof baseCoin.isEVM === 'function' && baseCoin.isEVM() && multisigTypeVersion === 'MPCv2') {
    walletVersion = 5;
  }
  if (walletVersion) walletParams.walletVersion = walletVersion;

  const finalWalletParams = await baseCoin.supplementGenerateWallet(walletParams, {
    userKeychain,
    backupKeychain,
    bitgoKeychain,
  });
  const newWallet = await bitgo.post(baseCoin.url('/wallet/add')).send(finalWalletParams).result();

  const walletResult = {
    walletId: newWallet.id,
    receiveAddress: newWallet.receiveAddress,
    userKeychainId: userKeychain.id,
    backupKeychainId: backupKeychain.id,
    bitgoKeychainId: bitgoKeychain.id,
  };
  writeJson(FILES.walletResult, walletResult);

  console.log('\n[ONLINE] Wallet created (MPCv2 two-script).');
  console.log('Wallet ID:', walletResult.walletId);
  console.log('Receive address:', walletResult.receiveAddress);
  console.log('Result written to', FILES.walletResult);
}

async function main() {
  const step = process.argv.find((a) => a.startsWith('--step='))
    ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
    : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['0', '1', '2', '3', '4'].includes(step)) {
    console.error('Usage: node mpc-self-custody-online.js --step 0|1|2|3|4');
    process.exit(1);
  }
  if (process.env.MPC_WORKSPACE_DIR) {
    console.log('[ONLINE] Workspace:', process.env.MPC_WORKSPACE_DIR);
  }
  if (step === '0') await runStep0();
  else if (step === '1') await runStep1();
  else if (step === '2') await runStep2();
  else if (step === '3') await runStep3();
  else if (step === '4') await runStep4();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
