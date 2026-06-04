/**
 * EdDSA TSS Self-Custody SIGN: OFFLINE Script (No Network)
 *
 * Produces commitment, R-share, and G-share material for EdDSA MPCv1 TSS signing.
 * Raw signing material (User SignShare / encryptedPrv) never leaves this machine.
 *
 * Steps:
 *   1: Build commitment + encrypted signer share; encrypt User SignShare for later rounds
 *   2: Build user→BitGo R signature share (from decrypted SignShare)
 *   3: Build user→BitGo G share (after BitGo commitment + R shares are available)
 *
 * Usage:
 *   WALLET_PASSPHRASE=... COIN=tsol node eddsa-self-custody-sign-offline.js --step 1
 *   node eddsa-self-custody-sign-offline.js --step 2
 *   node eddsa-self-custody-sign-offline.js --step 3
 *
 * Prerequisites:
 *   - tx-request.json (from online step 0)
 *   - bitgo-gpg-public-key.json (from online step 0)
 *   - user-signing-material.json with encryptedPrv (from create-tss-wallet.js), or ENCRYPTED_USER_KEY
 *   - WALLET_PASSPHRASE, COIN (e.g. tsol, tapt, tsui)
 *
 * BitGo docs:
 *   https://developers.bitgo.com/docs/withdraw-wallet-type-self-custody-mpc-hot-manual
 */
require('dotenv').config();
const fs = require('fs');
const { WORKSPACE_DIR, FILES, workspacePath } = require('./eddsa-sign-workspace-schema');
const {
  getEncryptedUserKey,
  decryptUserSigningMaterial,
  buildCommitmentPayload,
  buildGSharePayload,
} = require('./eddsa-sign-helpers');

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
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required');

  const BitGo = require('bitgo').BitGo;
  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });

  const txRequest = readJson(FILES.txRequest);
  const gpgConfig = readJson(FILES.bitgoGpgPublicKey);
  const bitgoGpgPublicKey = gpgConfig.bitgoGpgPublicKey;
  if (!bitgoGpgPublicKey) throw new Error('bitgo-gpg-public-key.json must contain bitgoGpgPublicKey');

  const encryptedPrv = getEncryptedUserKey(workspacePath, FILES);
  const signingMaterial = decryptUserSigningMaterial(bitgo, encryptedPrv, passphrase);

  const payload = await buildCommitmentPayload(
    txRequest,
    signingMaterial,
    bitgoGpgPublicKey,
    bitgo,
    passphrase
  );

  writeJson(FILES.signCommitmentPayload, {
    commitmentShare: payload.commitmentShare,
    encryptedSignerShare: payload.encryptedSignerShare,
  });

  writeJson(FILES.signEddsaState, {
    encryptedUserToBitgoRShare: payload.encryptedUserToBitgoRShare,
  });

  console.log('[OFFLINE] Step 1 done. Copy sign-commitment-payload.json to online machine, run online --step 1.');
}

async function runStep2() {
  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required');

  const BitGo = require('bitgo').BitGo;
  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });

  const commitmentPayload = readJson(FILES.signCommitmentPayload);
  const state = readJson(FILES.signEddsaState);
  if (!state.encryptedUserToBitgoRShare) {
    throw new Error('sign-eddsa-state.json must contain encryptedUserToBitgoRShare');
  }

  const decrypted = bitgo.decrypt({
    input: state.encryptedUserToBitgoRShare.share,
    password: passphrase,
  });
  const userSignShare = JSON.parse(decrypted);
  const bitgoIndex = 3;
  const rShare = userSignShare.rShares[bitgoIndex];
  if (!rShare) {
    throw new Error('userToBitgo RShare not found in decrypted User SignShare');
  }

  writeJson(FILES.signRPayload, {
    userToBitgoRSignatureShare: {
      from: 'user',
      to: 'bitgo',
      share: rShare.r + rShare.R,
    },
    encryptedSignerShare: commitmentPayload.encryptedSignerShare,
  });

  console.log('[OFFLINE] Step 2 done. Copy sign-r-payload.json to online machine, run online --step 2.');
}

async function runStep3() {
  const passphrase = process.env.WALLET_PASSPHRASE || '';
  if (!passphrase) throw new Error('WALLET_PASSPHRASE required');

  const BitGo = require('bitgo').BitGo;
  const bitgo = new BitGo({ env: process.env.BITGO_ENV || 'test' });

  const txRequest = readJson(FILES.txRequest);
  const commitmentResponse = readJson(FILES.signCommitmentResponse);
  const rResponse = readJson(FILES.signRResponse);
  const state = readJson(FILES.signEddsaState);

  const bitgoToUserCommitment = commitmentResponse.commitmentShare;
  if (!bitgoToUserCommitment) {
    throw new Error('sign-commitment-response.json must contain commitmentShare');
  }

  const bitgoToUserRShare = rResponse.bitgoToUserRShare;
  if (!bitgoToUserRShare) {
    throw new Error('sign-r-response.json must contain bitgoToUserRShare');
  }

  const encryptedPrv = getEncryptedUserKey(workspacePath, FILES);
  const signingMaterial = decryptUserSigningMaterial(bitgo, encryptedPrv, passphrase);

  const { gShare } = await buildGSharePayload(
    txRequest,
    signingMaterial,
    bitgoToUserRShare,
    bitgoToUserCommitment,
    state.encryptedUserToBitgoRShare,
    bitgo,
    passphrase
  );

  writeJson(FILES.signGPayload, { gShare });
  console.log('[OFFLINE] Step 3 done. Copy sign-g-payload.json to online machine, run online --step 3.');
}

async function main() {
  const step =
    process.argv.find((a) => a.startsWith('--step='))
      ? process.argv.find((a) => a.startsWith('--step=')).split('=')[1]
      : process.argv[process.argv.indexOf('--step') + 1];
  if (!step || !['1', '2', '3'].includes(step)) {
    console.error('Usage: node eddsa-self-custody-sign-offline.js --step 1|2|3');
    process.exit(1);
  }
  if (process.env.EDDSA_SIGN_WORKSPACE_DIR || process.env.MPC_SIGN_WORKSPACE_DIR) {
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
