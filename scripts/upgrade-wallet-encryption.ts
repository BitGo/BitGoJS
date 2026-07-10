/**
 * Upgrade a wallet's keychain encryption from v1 (SJCL/PBKDF2-SHA256 + AES-256-CCM) to
 * v2 (Argon2id + AES-256-GCM) and regenerate the keycard PDF.
 *
 * Usage:
 *   npx ts-node scripts/upgrade-wallet-encryption.ts \
 *     --env test \
 *     --coin tbtc \
 *     --walletId <walletId> \
 *     --passphrase <walletPassphrase> \
 *     --accessToken <bearerToken> \
 *     [--otp <code>] \
 *     [--boxD <ciphertext>] \
 *     [--boxA <ciphertext>] \
 *     [--boxB <ciphertext>] \
 *     [--passcodeEncryptionCode <code>] \
 *     [--dry-run]
 *
 * --accessToken: Short-lived BitGo access token. Generate this using the following guide
 *                https://developers.bitgo.com/docs/get-started-access-tokens#1-create-short-lived-access-token
 * --boxD: Box D from the original keycard. Required if the wallet passphrase has been changed since the
 *         wallet was created (i.e. the current passphrase is not the original one used at creation time).
 * --boxA: Box A from the original keycard. Required for MPCv2 wallets — reducedEncryptedPrv is never stored
 *         server-side. Encrypted with the original passphrase, so --boxD is also required if the passphrase
 *         has been changed since wallet creation.
 * --boxB: Box B from the original keycard. Required for MPCv2 wallets (reducedEncryptedPrv is never stored
 *         server-side) and older wallets where encryptedPrv was not stored server-side. Like --boxA, encrypted
 *         with the original passphrase — also requires --boxD if the passphrase has changed.
 * --passcodeEncryptionCode: Fetched automatically from BitGo if not provided. Required to produce Box D in the new keycard.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as yargsLib from 'yargs';
import { coins } from '@bitgo/statics';
import { Environments, EnvironmentName } from '../modules/sdk-core/src/bitgo/environments';
import { Keychain } from '../modules/sdk-core/src/bitgo/keychain';
import { generateQrData } from '../modules/key-card/src/generateQrData';
import { generateFaq } from '../modules/key-card/src/faq';
import { drawKeycard } from '../modules/key-card/src/drawKeycard';
import { BitGo } from '../modules/bitgo/dist/src/bitgo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the encryption version of a ciphertext by inspecting the "v" field.
 * v1 = SJCL (PBKDF2-SHA256 + AES-256-CCM), no "v" field or v=1
 * v2 = Argon2id + AES-256-GCM, v=2
 */
function getEncryptionVersion(ciphertext: string): 1 | 2 {
  try {
    const envelope = JSON.parse(ciphertext);
    if (envelope.v === 2) {
      return 2;
    }
    // SJCL envelopes have no "v" field or v=1
    if (!envelope.v || envelope.v === 1) {
      return 1;
    }
    throw new Error(`Unrecognized encryption version: ${envelope.v}`);
  } catch (e) {
    throw new Error(`Failed to parse ciphertext envelope: ${e.message}`);
  }
}

/**
 * Decrypt a v1 ciphertext and re-encrypt it as v2.
 * Tries `passphrase` first; falls back to `originalPassphrase` if provided and decryption fails.
 */
async function reencryptAsV2(
  bitgo: BitGo,
  encryptedPrv: string,
  passphrase: string,
  originalPassphrase: string | undefined
): Promise<string> {
  let prv: string;
  try {
    prv = await bitgo.decrypt({ input: encryptedPrv, password: passphrase });
  } catch {
    if (originalPassphrase) {
      prv = await bitgo.decrypt({ input: encryptedPrv, password: originalPassphrase });
    } else {
      throw new Error(
        'Failed to decrypt with the provided passphrase. ' +
          'If the wallet password was changed after creation, provide --boxD so the original passphrase can be recovered.'
      );
    }
  }
  // Always re-encrypt with the current passphrase, regardless of which passphrase decrypted it.
  return bitgo.encrypt({ input: prv, password: passphrase, encryptionVersion: 2 });
}

/**
 * Fetch the passcodeEncryptionCode for a wallet from the BitGo passcoderecovery endpoint.
 * This is the symmetric key used to encrypt the wallet passphrase into Box D on the keycard.
 * It is required to produce a Box D entry in the regenerated keycard.
 */
async function getPasscodeEncryptionCode(bitgo: BitGo, coin: string, walletId: string): Promise<string> {
  const { recoveryInfo } = await bitgo
    .post(bitgo.microservicesUrl(`/api/v2/${coin}/wallet/${walletId}/passcoderecovery`))
    .result();
  if (!recoveryInfo || typeof recoveryInfo.passcodeEncryptionCode !== 'string') {
    throw new Error(
      'passcoderecovery endpoint did not return a passcodeEncryptionCode — pass --passcodeEncryptionCode manually'
    );
  }
  return recoveryInfo.passcodeEncryptionCode;
}

/**
 * Fetch the coin logo image and return a duck-typed HTMLImageElement-compatible object.
 * jsPDF reads `.src` in Node.js; computeKeyCardImageDimensions reads `.width`/`.height`.
 * This replicates what the BitGo UI does before calling drawKeycard.
 */
async function loadKeycardImage(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          console.warn(`Warning: coin logo not loaded (HTTP ${res.statusCode}) — keycard will be generated without it`);
          resolve(undefined);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const contentType = res.headers['content-type'] ?? 'image/png';
          const dataUrl = `data:${contentType};base64,${Buffer.concat(chunks).toString('base64')}`;
          // jsPDF reads .src; computeKeyCardImageDimensions reads .width / .height
          const img = { src: dataUrl, width: 303, height: 40 } as unknown as HTMLImageElement;
          resolve(img);
        });
        res.on('error', (err) => {
          console.warn(`Warning: coin logo not loaded (${err.message}) — keycard will be generated without it`);
          resolve(undefined);
        });
      })
      .on('error', (err) => {
        console.warn(`Warning: coin logo not loaded (${err.message}) — keycard will be generated without it`);
        resolve(undefined);
      });
  });
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const argv = yargsLib
    .option('env', { type: 'string', default: 'test', description: 'BitGo environment (test, prod, …)' })
    .option('coin', { type: 'string', demandOption: true, description: 'Coin ticker (e.g. tbtc, teth)' })
    .option('walletId', { type: 'string', demandOption: true, description: 'Wallet ID' })
    .option('passphrase', { type: 'string', demandOption: true, description: 'Current wallet passphrase' })
    .option('accessToken', { type: 'string', demandOption: true, description: 'Short-lived BitGo access token' })
    .option('otp', { type: 'string', description: 'OTP for session unlock' })
    .option('boxD', { type: 'string', description: 'Box D ciphertext from the original keycard' })
    .option('boxA', { type: 'string', description: 'Box A ciphertext from the original keycard (MPCv2)' })
    .option('boxB', { type: 'string', description: 'Box B ciphertext from the original keycard' })
    .option('passcodeEncryptionCode', {
      type: 'string',
      description: 'Passcode encryption code (fetched automatically if omitted)',
    })
    .option('dry-run', { type: 'boolean', default: false, description: 'Validate without persisting changes' })
    .parseSync();

  return {
    env: argv.env as EnvironmentName,
    coin: argv.coin,
    walletId: argv.walletId,
    passphrase: argv.passphrase,
    accessToken: argv.accessToken,
    otp: argv.otp,
    boxD: argv.boxD,
    boxA: argv.boxA,
    boxB: argv.boxB,
    passcodeEncryptionCode: argv.passcodeEncryptionCode,
    dryRun: argv['dry-run'],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const {
    env,
    coin,
    walletId,
    passphrase,
    accessToken,
    otp,
    boxD,
    boxA,
    boxB,
    passcodeEncryptionCode: pecArg,
    dryRun,
  } = parseArgs();

  if (dryRun) console.log('[dry-run] No changes will be persisted.');

  const bitgo = new BitGo({ env });
  bitgo.authenticateWithAccessToken({ accessToken });

  if (!dryRun) {
    await bitgo.unlock({ otp: otp ?? '0000000', duration: 600 });
    console.log('Session unlocked.');
  }

  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  console.log(`Wallet: ${wallet.label()} (${walletId})`);

  // Fetch passcodeEncryptionCode — needed to decrypt Box D (when provided) and to generate Box D
  // in the new keycard. Always fetched when boxD is provided; otherwise skipped in dry-run.
  const needsPec = boxD || !dryRun;
  const passcodeEncryptionCode: string | undefined =
    pecArg ?? (needsPec ? await getPasscodeEncryptionCode(bitgo, coin, walletId) : undefined);

  if (!passcodeEncryptionCode && !dryRun) {
    throw new Error(
      'passcodeEncryptionCode is required — pass --passcodeEncryptionCode or ensure the endpoint is accessible'
    );
  }

  // If the wallet password was changed after creation, Box D from the original keycard contains
  // the original passphrase encrypted with the passcodeEncryptionCode. Decrypt it to recover the
  // passphrase that was used to encrypt the backup key at wallet creation time.
  let originalPassphrase: string | undefined;
  if (boxD && passcodeEncryptionCode) {
    originalPassphrase = await bitgo.decrypt({
      input: boxD.replace(/\s/g, ''),
      password: passcodeEncryptionCode,
    });
    console.log('Recovered original passphrase from Box D.');
  }

  // Fetch all three keychains
  const keyIds = wallet.keyIds();
  const [userKeychain, backupKeychain, bitgoKeychain] = (await Promise.all([
    bitgo.coin(coin).keychains().get({ id: keyIds[0] }),
    bitgo.coin(coin).keychains().get({ id: keyIds[1] }),
    bitgo.coin(coin).keychains().get({ id: keyIds[2] }),
  ])) as [Keychain, Keychain, Keychain];

  const updated: Array<{ type: string; id: string }> = [];
  const skipped: Array<{ type: string; reason: string }> = [];

  // ------------------------------------------------------------------
  // Re-encrypt user key
  // The user key is always encrypted with the current passphrase.
  // We also set originalEncryptedPrv = encryptedPrv so that BitGo's
  // server-side password-change flow remains consistent after this upgrade.
  // ------------------------------------------------------------------
  if (userKeychain.encryptedPrv) {
    if (getEncryptionVersion(userKeychain.encryptedPrv) === 2) {
      skipped.push({ type: 'user', reason: 'already v2' });
    } else {
      const userPrv = await bitgo.decrypt({ input: userKeychain.encryptedPrv, password: passphrase });
      const newEncryptedPrv = await bitgo.encrypt({ input: userPrv, password: passphrase, encryptionVersion: 2 });
      userKeychain.encryptedPrv = newEncryptedPrv;

      if (!dryRun) {
        await bitgo
          .put(bitgo.coin(coin).url(`/key/${encodeURIComponent(userKeychain.id)}`))
          .send({ encryptedPrv: newEncryptedPrv, originalEncryptedPrv: newEncryptedPrv })
          .result();
      }
      updated.push({ type: 'user', id: userKeychain.id });
    }
  } else {
    skipped.push({ type: 'user', reason: 'no encryptedPrv' });
  }

  // ------------------------------------------------------------------
  // Re-encrypt backup key
  // The backup key may be encrypted under the original passphrase if the
  // wallet password was changed after creation (see design notes above).
  // If decryption with the current passphrase fails and --boxD was provided,
  // we retry with the recovered original passphrase.
  // ------------------------------------------------------------------
  // Source of truth for the backup key ciphertext: server-stored encryptedPrv, or --boxB for older wallets
  const serverStored = !!backupKeychain.encryptedPrv;
  const backupSource = backupKeychain.encryptedPrv ?? boxB;
  if (backupSource) {
    if (getEncryptionVersion(backupSource) === 2) {
      skipped.push({ type: 'backup', reason: 'already v2' });
    } else {
      const newEncryptedPrv = await reencryptAsV2(bitgo, backupSource, passphrase, originalPassphrase);
      backupKeychain.encryptedPrv = newEncryptedPrv;

      if (!dryRun && serverStored) {
        // Only PUT if the key was server-stored (boxB-only keys have no server record to update)
        await bitgo
          .put(bitgo.coin(coin).url(`/key/${encodeURIComponent(backupKeychain.id)}`))
          .send({ encryptedPrv: newEncryptedPrv })
          .result();
      }
      updated.push({ type: serverStored ? 'backup' : 'backup (keycard only)', id: backupKeychain.id });
    }
  } else {
    skipped.push({ type: 'backup', reason: 'no encryptedPrv' });
  }

  if (dryRun) {
    console.log('Skipped (dry-run):');
    skipped.forEach((s) => console.log(`  ${s.type}: ${s.reason}`));
    console.log('Would re-encrypt:');
    updated.forEach((u) => console.log(`  ${u.type} key ${u.id}`));
    console.log('[dry-run] Done — no changes persisted.');
    return;
  }

  if (updated.length > 0) {
    console.log('Re-encrypted:');
    updated.forEach((u) => console.log(`  ${u.type} key ${u.id}`));
  }
  if (skipped.length > 0) {
    console.log('Skipped:');
    skipped.forEach((s) => console.log(`  ${s.type}: ${s.reason}`));
  }

  // ------------------------------------------------------------------
  // Re-encrypt boxA (MPCv2 reducedEncryptedPrv — keycard-only)
  // ------------------------------------------------------------------
  if (boxA) {
    userKeychain.reducedEncryptedPrv = await reencryptAsV2(bitgo, boxA, passphrase, originalPassphrase);
    updated.push({ type: 'user reducedEncryptedPrv (keycard only)', id: userKeychain.id });
  }

  if (boxB && backupKeychain.encryptedPrv) {
    // MPCv2: encryptedPrv exists server-side but reducedEncryptedPrv does not.
    // Re-encrypt boxB and set it so generateQrData uses it instead of the full encryptedPrv blob.
    backupKeychain.reducedEncryptedPrv = await reencryptAsV2(bitgo, boxB, passphrase, originalPassphrase);
    updated.push({ type: 'backup reducedEncryptedPrv (keycard only)', id: backupKeychain.id });
  }

  // ------------------------------------------------------------------
  // Regenerate keycard PDF
  // Mirrors the UI flow: generateQrData → generateFaq → drawKeycard → save PDF.
  // The coin logo is fetched from the BitGo web app and passed to drawKeycard
  // as a duck-typed HTMLImageElement (jsPDF reads .src; drawKeycard reads .width/.height).
  // ------------------------------------------------------------------
  if (!passcodeEncryptionCode) {
    console.warn('Skipping keycard generation — passcodeEncryptionCode not available.');
    console.log('Done.');
    return;
  }

  const staticsCoin = coins.get(coin);
  const walletLabel = wallet.label();
  // The keycard image asset uses the coin family name (e.g. "sol" for both sol and tsol)
  const baseUrl = Environments[env].uri;
  const keyCardImage = await loadKeycardImage(`${baseUrl}/web/assets/keycards/${staticsCoin.family.toLowerCase()}.png`);

  const qrData = await generateQrData({
    coin: staticsCoin,
    userKeychain,
    backupKeychain,
    bitgoKeychain,
    passphrase,
    passcodeEncryptionCode,
    encryptionVersion: 2,
  });

  const questions = generateFaq(staticsCoin.fullName);
  const doc = await drawKeycard({ qrData, questions, walletLabel, keyCardImage });

  const outputPath = path.resolve(process.cwd(), `BitGo Keycard for ${walletLabel}.pdf`);
  fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
  console.log(`Keycard PDF saved to: ${outputPath}`);

  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal:', err.message ?? err);
  process.exit(1);
});
