/**
 * Sign a pre-built Go Account transaction payload (Step 2 of 3)
 *
 * Use this script when the transaction payload has already been built (Step 1)
 * and you only need to produce a signature to send back in Step 3.
 *
 * This is useful when the build step happens in a separate process or service
 * (e.g. your backend calls the BitGo build API, then forwards the payload here
 * for local signing in a secure environment).
 *
 *   Step 1: Build  — done externally, paste the payload string below
 *   Step 2: Sign   — this script → outputs a hex-encoded signature
 *   Step 3: Submit — use the signature + payload to call submitTransaction()
 *
 * The user key is decrypted locally — your passphrase is NEVER sent over
 * the network.
 *
 * For a single script that runs all three steps, see go-account-withdrawal.ts.
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN   - your BitGo access token
 *   OFC_WALLET_ID          - the wallet ID of your Go Account
 *   OFC_WALLET_PASSPHRASE  - the passphrase used when the wallet was created
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from 'bitgo';
require('dotenv').config({ path: '../../../.env' });

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change to 'production' for mainnet
});

// Go Accounts use the 'ofc' (Off-Chain) coin
const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

// ---------------------------------------------------------------------------
// Configuration — update these values or set them as environment variables
// ---------------------------------------------------------------------------

/** The wallet ID of your Go Account */
const walletId = process.env.OFC_WALLET_ID || 'your_wallet_id';

/** Passphrase used to encrypt the wallet user key when the wallet was created */
const walletPassphrase = process.env.OFC_WALLET_PASSPHRASE || 'your_wallet_passphrase';

/**
 * The payload string returned by Step 1 (prebuildTransaction or the build API).
 */
const prebuildPayload = process.env.OFC_PREBUILD_PAYLOAD || 'your_payload';

// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Go Account: Sign Transaction Payload (Step 2 of 3) ===\n');

  // Validate the payload is present and is parseable JSON.
  // JSON.parse + JSON.stringify normalizes escaping so the string sent to the
  // finalize endpoint is guaranteed to be valid JSON.
  if (!prebuildPayload) {
    throw new Error(
      'OFC_PREBUILD_PAYLOAD environment variable is required.\n' +
        'Set it to the JSON string returned by the prebuild step (Step 1).\n' +
        'Tip: run go-account-withdrawal.ts to see the prebuild result.'
    );
  }
  let normalizedPayload: string;
  try {
    normalizedPayload = JSON.stringify(JSON.parse(prebuildPayload));
  } catch {
    throw new Error(
      'OFC_PREBUILD_PAYLOAD is not valid JSON.\n' +
        'Do not hardcode it as a JS string literal — pass it via the environment variable\n' +
        'using the raw JSON string from the prebuild API response.'
    );
  }

  console.log(`Fetching wallet ${walletId}...`);
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
  console.log(`✓ Wallet: ${wallet.label()} (${wallet.id()})\n`);

  // -------------------------------------------------------------------------
  // Sign the payload
  //
  // tradingAccount.signPayload:
  //   1. Fetches the encrypted user key from BitGo
  //   2. Decrypts it locally using walletPassphrase
  //   3. Signs the payload using Bitcoin message signing (secp256k1)
  //   4. Returns a hex-encoded 65-byte recoverable signature
  //
  // Your passphrase is NEVER sent over the network.
  // -------------------------------------------------------------------------
  console.log('Signing payload...');
  const tradingAccount = wallet.toTradingAccount();

  const signature = await tradingAccount.signPayload({
    payload: normalizedPayload,
    walletPassphrase,
  });

  console.log('✓ Payload signed successfully\n');
  console.log('='.repeat(60));
  console.log('Payload (pass to Step 3):');
  console.log(normalizedPayload);
  console.log('\nSignature (hex, pass to Step 3):');
  console.log(signature);
  console.log('='.repeat(60));

  console.log('\nNext step — submit the signed transaction:');
  console.log('  await wallet.submitTransaction({');
  console.log('    halfSigned: { payload, txHex: signature },');
  console.log('  });');
}

main().catch((e) => {
  console.error('\n❌ Error signing transaction payload:', e);
  process.exit(1);
});
