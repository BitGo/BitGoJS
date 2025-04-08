/**
 * Get a Lightning invoice by its payment hash.
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

// TODO: set the payment hash of the invoice to retrieve
const paymentHash = process.env.PAYMENT_HASH || '';

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * Get a Lightning invoice by its payment hash
 * @returns {Promise<any>} Lightning invoice details
 */
async function main(): Promise<any> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    console.log(`Getting Lightning invoice with payment hash: ${paymentHash}`);

    // Get the wallet
    const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

    // Get the invoice from Lightning wallet
    const lightning = getLightningWallet(wallet);
    const invoice = await lightning.getInvoice(paymentHash);

    // Display invoice details
    console.log('\nInvoice Details:');
    console.log(`Payment Hash: ${invoice.paymentHash}`);
    console.log(`Amount (msat): ${invoice.valueMsat}`);
    console.log(`Status: ${invoice.status}`);
    console.log(`Created At: ${invoice.createdAt}`);

    if (invoice.invoice) {
      console.log(`Invoice: ${invoice.invoice}`);
    }

    if (invoice.expiresAt) {
      console.log(`Expires At: ${invoice.expiresAt}`);
    }
  } catch (e) {
    console.error('Error getting Lightning invoice:', e.message);
    throw e;
  }
}

// Run the example
main()
  .then(() => {
    console.log('Example completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Example failed with error:', e.message);
    process.exit(-1);
  });