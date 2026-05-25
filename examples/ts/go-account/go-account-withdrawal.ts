/**
 * Go Account withdrawal — complete 3-step flow
 *
 * Demonstrates the full end-to-end withdrawal from a Go Account (OFC wallet):
 *
 *   Step 1: Build  — wallet.prebuildTransaction()              → prebuild
 *   Step 2: Sign   — tradingAccount.signPayload(prebuild.payload) → signature
 *   Step 3: Submit — POST /tx/send { halfSigned: { payload, signature } } → txid
 *
 * All three steps run in sequence in this single script.
 * If you only need the signing step (e.g. the payload was built separately),
 * see sign-transaction.ts instead.
 *
 * The signing step decrypts the user key locally — your passphrase is NEVER
 * sent over the network.
 *
 * Required environment variables (in examples/.env):
 *   TESTNET_ACCESS_TOKEN   - your BitGo access token
 *   OFC_WALLET_ID          - the wallet ID of your Go Account
 *   OFC_WALLET_PASSPHRASE  - the passphrase used when the wallet was created
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet } from '@bitgo/sdk-core';
import { coins } from 'bitgo';
import { tokens as staticTokens, OfcTokenConfig } from '@bitgo/statics';
require('dotenv').config({ path: '../../../.env' });

// Initialize BitGo SDK
const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change to 'production' for mainnet
});

// Go Accounts use the 'ofc' (Off-Chain) coin family.
// When withdrawing a specific token, the coin context must be the token (e.g. 'ofctsol'),
// not the base 'ofc' coin — the BitGo API rejects builds on the base coin directly.
const baseCoin = 'ofc';
bitgo.register(baseCoin, coins.Ofc.createInstance);

// ---------------------------------------------------------------------------
// Configuration — update these values or set them as environment variables
// ---------------------------------------------------------------------------

/** The wallet ID of your Go Account */
const walletId = process.env.OFC_WALLET_ID || 'your_wallet_id';

/** Passphrase used to encrypt the wallet user key when the wallet was created */
const walletPassphrase = process.env.OFC_WALLET_PASSPHRASE || 'your_wallet_passphrase';

/**
 * Withdrawal destination address.
 * For OFC wallets this is typically a BitGo address or counterparty address.
 */
const recipientAddress = process.env.RECIPIENT_ADDRESS || 'your_recipient_address';

/**
 * Amount to withdraw, in the base unit of the token being sent.
 * For USD-pegged stablecoins (e.g. USDC) this is in micro-units: 1 USDC = 1_000_000.
 * For BTC this is satoshis: 1 BTC = 100_000_000.
 */
const withdrawalAmount = process.env.WITHDRAWAL_AMOUNT || '1000000'; // e.g. 1.00 USDC (6 decimals)

/**
 * Token to withdraw. Leave undefined to use the wallet's default token.
 * Examples: 'ofctsol:usdc', 'ofcttrx:usdt', 'ofcbtc', 'ofceth'
 *
 * Note: For OFC wallets, the token name embedded in the recipient address usually
 * determines which token moves — check BitGo docs for your specific flow.
 */
const token: string | undefined = 'ofctsol';

// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Go Account Withdrawal (Build → Sign → Submit) ===\n');

  // When a specific token is given (e.g. 'ofctsol'), the API requires that coin
  // context for building — using the base 'ofc' coin will be rejected.
  // OfcToken.createTokenConstructor() overrides getChain() to return the token
  // type (e.g. 'ofctsol'), which is what the BitGo API URL expects.
  const effectiveCoin = token || baseCoin;
  if (effectiveCoin !== baseCoin) {
    const allOfcTokens: OfcTokenConfig[] = [
      ...staticTokens.bitcoin.ofc.tokens,
      ...staticTokens.testnet.ofc.tokens,
    ];
    const tokenConfig = allOfcTokens.find((t) => t.type === effectiveCoin);
    if (!tokenConfig) {
      throw new Error(`Unknown OFC token: ${effectiveCoin}. Check @bitgo/statics for valid token names.`);
    }
    bitgo.register(effectiveCoin, coins.OfcToken.createTokenConstructor(tokenConfig));
  }

  // -------------------------------------------------------------------------
  // Step 1: Fetch the wallet and build the withdrawal transaction
  //
  // The GET /wallet endpoint only accepts the base 'ofc' coin path.
  // After fetching, we re-wrap the wallet with the token coin so that
  // prebuildTransaction hits the correct path (e.g. /ofctsol/wallet/.../tx/build).
  // -------------------------------------------------------------------------
  console.log(`Fetching wallet ${walletId}...`);
  const rawWallet = await bitgo.coin(baseCoin).wallets().get({ id: walletId });
  const wallet =
    effectiveCoin === baseCoin
      ? rawWallet
      : new Wallet(bitgo, bitgo.coin(effectiveCoin), (rawWallet as Wallet)._wallet);
  console.log(`✓ Wallet: ${wallet.label()} (${wallet.id()}) [coin: ${effectiveCoin}]\n`);

  console.log('Building withdrawal transaction...');
  const buildParams: {
    recipients: { address: string; amount: string; tokenName?: string }[];
  } = {
    recipients: [
      {
        address: recipientAddress,
        amount: withdrawalAmount,
        ...(token ? { tokenName: token } : {}),
      },
    ],
  };

  const prebuild = await wallet.prebuildTransaction(buildParams);
  console.log('✓ Transaction built successfully');
  console.log('\nPrebuild result:');
  console.log(JSON.stringify(prebuild, null, 2));

  // -------------------------------------------------------------------------
  // Step 2: Sign the transaction payload (the core of this script)
  //
  // The trading account's signPayload method:
  //   1. Fetches the encrypted user key from BitGo
  //   2. Decrypts it locally using your walletPassphrase
  //   3. Signs the payload using Bitcoin message signing (secp256k1)
  //   4. Returns a hex-encoded 65-byte recoverable signature
  //
  // Your passphrase is NEVER sent over the network.
  // -------------------------------------------------------------------------
  console.log('\nSigning transaction payload...');
  const tradingAccount = wallet.toTradingAccount();

  // The payload to sign is the inner payload string from the prebuild result,
  // not the whole prebuild object. OfcToken.signTransaction signs txPrebuild.payload.
  const payload = prebuild.payload as string;

  const signature = await tradingAccount.signPayload({
    payload,
    walletPassphrase,
  });

  console.log('✓ Payload signed successfully');
  console.log(`\nSignature (hex): ${signature}`);
  console.log(`Payload: ${payload}`);

  // -------------------------------------------------------------------------
  // Step 3: Submit the half-signed transaction to BitGo
  //
  // The 'halfSigned' object carries the payload + signature.  BitGo will
  // validate the signature against the registered public key and, if valid,
  // co-sign and broadcast the transaction.
  // -------------------------------------------------------------------------
  console.log('\nSubmitting signed transaction to BitGo...');
  // wallet.submitTransaction() runs the body through an io-ts codec (TxSendBody)
  // that strips unknown fields — including `payload` — from halfSigned before
  // sending. For OFC the server needs both fields, so call the endpoint directly.
  const sendUrl = (wallet as Wallet).baseCoin.url('/wallet/' + wallet.id() + '/tx/send');
  const sendResult = await (bitgo as any).post(sendUrl).send({ halfSigned: { payload, signature } }).result();

  console.log('✓ Transaction submitted successfully!');
  console.log('\nTransaction result:');
  console.log(JSON.stringify(sendResult, null, 2));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('WITHDRAWAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Wallet ID   : ${wallet.id()}`);
  console.log(`  Recipient   : ${recipientAddress}`);
  console.log(`  Amount      : ${withdrawalAmount}`);
  if (token) {
    console.log(`  Token       : ${token}`);
  }
  if (sendResult?.txid) {
    console.log(`  Transaction : ${sendResult.txid}`);
  }
  console.log('='.repeat(60));
}

main().catch((e) => {
  console.error('\n❌ Error during Go Account withdrawal:', e);
  process.exit(1);
});
