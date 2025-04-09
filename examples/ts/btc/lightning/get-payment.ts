/**
 * Get a Lightning payment by its payment hash.
 *
 * IMPORTANT: Your BitGo account must have the "custodyLightningWallet" license
 * enabled to use this functionality. Contact BitGo support if you receive a
 * license-related error.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tlnbtc } from '@bitgo/sdk-coin-lnbtc';
require('dotenv').config({ path: '../../.env' });
import { getLightningWallet } from 'modules/abstract-lightning/src';

// TODO: set access token for testnet
// Get this from your BitGo account
const accessToken = process.env.TESTNET_ACCESS_TOKEN || '';

// TODO: set your Lightning wallet ID here
const walletId = process.env.LIGHTNING_WALLET_ID || '';

// TODO: set the payment hash of the payment to retrieve
const paymentHash = process.env.PAYMENT_HASH || '';

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * Get a Lightning payment by its payment hash
 * @returns {Promise<any>} Lightning payment details
 */
async function main(): Promise<any> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    console.log(`Getting Lightning payment with payment hash: ${paymentHash}`);

    if (!walletId) {
      throw new Error('Wallet ID is required - please set LIGHTNING_WALLET_ID environment variable');
    }

    if (!paymentHash) {
      throw new Error('Payment hash is required - please set PAYMENT_HASH environment variable');
    }

    // Get the wallet
    const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

    // Get the payment from Lightning wallet
    const lightning = getLightningWallet(wallet);
    const payment = await lightning.getPayment(paymentHash);

    // Display payment details
    console.log('\nPayment Details:');
    console.log(`Payment Hash: ${payment.paymentHash}`);
    console.log(`Payment Hash: ${payment.invoice}`);
    console.log(`Amount (msat): ${payment.amountMsat}`);

    console.log(`Wallet ID: ${payment.walletId}`);

    return payment;
  } catch (e) {
    console.error('Error getting Lightning payment:', e.message);
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