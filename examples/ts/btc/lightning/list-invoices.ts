/**
 * List Lightning invoices for a wallet with optional filtering.
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
const status = process.env.INVOICE_STATUS as 'open' | 'settled' | 'canceled' | undefined; // Can be 'open', 'settled', or 'canceled'
const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 20; // Number of results to return

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * List Lightning invoices with optional filtering
 * @returns {Promise<any>} Array of Lightning invoices
 */
async function main(): Promise<any> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    console.log(`Listing Lightning invoices for wallet: ${walletId}`);
    console.log(`Filters - Status: ${status || 'Any'}, Limit: ${limit}`);

    if (!walletId) {
      throw new Error('Wallet ID is required - please set LIGHTNING_WALLET_ID environment variable');
    }

    // Get the wallet
    const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

    // Get the invoice from Lightning wallet
    const lightning = getLightningWallet(wallet);

    // List invoices with the provided filters
    const query = {
      status,
      limit: limit ? BigInt(limit) : undefined,
    };
    const invoices = await lightning.listInvoices(query);

    // Display invoice summary
    console.log(`\nFound ${invoices.length} invoices:`);

    // Display detailed information for each invoice
    invoices.forEach((invoice, index) => {
      console.log(`\n--- Invoice ${index + 1} ---`);
      console.log(`Payment Hash: ${invoice.paymentHash}`);
      console.log(`Amount (msat): ${invoice.valueMsat}`);
      console.log(`Status: ${invoice.status}`);
      console.log(`Created At: ${invoice.createdAt}`);
      if (invoice.invoice) {
        console.log(`Invoice: ${invoice.invoice}`);
      }
    });

    return invoices;
  } catch (e) {
    console.error('Error listing Lightning invoices:', e.message);
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
