/**
 * List Lightning payments for a wallet with optional filtering.
 *
 * IMPORTANT: Your BitGo account must have the "custodyLightningWallet" license
 * enabled to use this functionality. Contact BitGo support if you receive a
 * license-related error.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tlnbtc } from '@bitgo/sdk-coin-lnbtc';
import { getLightningWallet } from 'modules/abstract-lightning/src';

// TODO: set access token for testnet
// Get this from your BitGo account
const accessToken = process.env.TESTNET_ACCESS_TOKEN || '';

// TODO: set your Lightning wallet ID here
const walletId = process.env.LIGHTNING_WALLET_ID || '';

// Optional filter parameters
const status = process.env.PAYMENT_STATUS || undefined; // Can be 'in_flight', 'settled', 'failed'
const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 20; // Number of results to return

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * List Lightning payments with optional filtering
 * @returns {Promise<any>} Array of Lightning payments
 */
async function main(): Promise<void> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    console.log(`Listing Lightning payments for wallet: ${walletId}`);
    console.log(`Filters - Status: ${status || 'Any'}, Limit: ${limit}`);

    // Get the wallet
    const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightning = getLightningWallet(wallet);

    // Prepare query parameters
    const queryParams: any = { limit };
    if (status) {
      queryParams.status = status;
    }

    // List payments with the provided filters
    const payments = await lightning.listPayments(queryParams);

    // Display payment summary
    console.log(`\nFound ${payments.length} payments:`);

    // Display detailed information for each payment
    payments.forEach((payment, index) => {
      console.log(`\n--- Payment ${index + 1} ---`);
      console.log(`Payment Hash: ${payment.paymentHash}`);
      console.log(`Amount (msat): ${payment.amountMsat}`);
      console.log(`Status: ${payment.status}`);
      console.log(`Created At: ${payment.createdAt}`);
      console.log(`Updated At: ${payment.updatedAt}`);
      console.log(`Destination: ${payment.destination}`);
      console.log(`TX Request ID: ${payment.txRequestId}`);

      if (payment.feeMsat) {
        console.log(`Fee (msat): ${payment.feeMsat}`);
      }

      if (payment.paymentPreimage) {
        console.log(`Payment Preimage: ${payment.paymentPreimage}`);
      }

      if (payment.failureReason) {
        console.log(`Failure Reason: ${payment.failureReason}`);
      }
    });
  } catch (e) {
    console.error('Error listing Lightning payments:', e.message);
    throw e;
  }
}

// Run the example
main()
  .then(() => {
    console.log('\nExample completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Example failed with error:', e.message);
    process.exit(-1);
  });
