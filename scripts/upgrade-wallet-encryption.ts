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
 *     --accessToken <sessionToken> \
 *     [--otp <code>] \
 *     [--boxD <ciphertext>] \
 *     [--boxA <ciphertext>] \
 *     [--boxB <ciphertext>] \
 *     [--passcodeEncryptionCode <code>] \
 *     [--dry-run]
 *
 * OFC wallets (--coin ofc):
 *   Only --passphrase is required. --boxD / --boxA / --boxB do not apply.
 *   No keycard PDF is produced. The script iterates all key IDs on the wallet
 *   and re-encrypts any that still use v1 (SJCL) encryption.
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
import * as yargsLib from 'yargs';
import { Environments, EnvironmentName } from '../modules/sdk-core/src/bitgo/environments';
import { createKeycardPdfGenerator } from '../modules/key-card/src/upgradeWalletEncryption';
import { BitGo } from '../modules/bitgo/dist/src/bitgo';

function parseArgs() {
  const argv = yargsLib
    .option('env', { type: 'string', default: 'test', description: 'BitGo environment (test, prod, …)' })
    .option('coin', { type: 'string', demandOption: true, description: 'Coin ticker (e.g. tbtc, teth)' })
    .option('walletId', { type: 'string', demandOption: true, description: 'Wallet ID' })
    .option('passphrase', { type: 'string', description: 'Current wallet passphrase. Omit when --boxD is provided and the passphrase has never been changed — it will be derived from Box D.' })
    .option('accessToken', { type: 'string', demandOption: true, description: 'Short-lived BitGo access token' })
    .option('otp', { type: 'string', description: 'OTP for session unlock' })
    .option('boxD', { type: 'string', description: 'Box D ciphertext from the original keycard', coerce: (v: string) => v?.replace(/\s/g, '') })
    .option('boxA', { type: 'string', description: 'Box A ciphertext from the original keycard (MPCv2)', coerce: (v: string) => v?.replace(/\s/g, '') })
    .option('boxB', { type: 'string', description: 'Box B ciphertext from the original keycard', coerce: (v: string) => v?.replace(/\s/g, '') })
    .option('passcodeEncryptionCode', { type: 'string', description: 'Passcode encryption code (fetched automatically if omitted)' })
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

async function main() {
  const { env, coin, walletId, passphrase, accessToken, otp, boxD, boxA, boxB, passcodeEncryptionCode, dryRun } =
    parseArgs();

  const bitgo = new BitGo({ env });
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  const result = await wallet.upgradeEncryption({
    passphrase,
    otp,
    boxD,
    boxA,
    boxB,
    passcodeEncryptionCode,
    dryRun,
    generatePdf: createKeycardPdfGenerator({ imageBaseUrl: Environments[env].uri }),
  });

  if (result?.doc) {
    const outputPath = path.resolve(process.cwd(), `BitGo Keycard for ${result.walletLabel}.pdf`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fs.writeFileSync(outputPath, Buffer.from((result.doc as any).output('arraybuffer')));
    console.log(`Keycard PDF saved to: ${outputPath}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message ?? err);
  process.exit(1);
});
