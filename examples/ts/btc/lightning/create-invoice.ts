/**
 * Create a Lightning invoice in an existing BitGo wallet.
 *
 * IMPORTANT: Your BitGo account must have the "custodyLightningWallet" license
 * enabled to use this functionality. Contact BitGo support if you receive a
 * license-related error.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tlnbtc } from '@bitgo/sdk-coin-lnbtc';
import { CreateInvoiceBody, getLightningWallet, Invoice } from '@bitgo/abstract-lightning';

// TODO: set access token for testnet
// Get this from your BitGo account
const accessToken = '';

// TODO: set your lightning wallet ID
const walletId = '';

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * Create a Lightning invoice
 * This function creates an invoice in an existing Lightning wallet
 * @returns {Promise<Invoice>} Invoice object
 */
async function main(): Promise<Invoice> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    // Validate input
    if (!walletId) {
      throw new Error('Lightning wallet ID is required');
    }

    console.log(`Getting Lightning wallet with ID: ${walletId}`);
    const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightning = getLightningWallet(wallet);

    // Set up invoice parameters - note that amounts need to be provided as BigInt
    const invoiceParams: CreateInvoiceBody = {
      valueMsat: BigInt(50000), // 50,000 millisatoshis = 50 satoshis
      memo: `Test invoice created at ${new Date().toISOString()}`,
      expiry: 3600, // 1 hour expiry
    };

    console.log('Creating Lightning invoice...');
    const invoice = await lightning.createInvoice(invoiceParams);

    // Display invoice information
    console.log('\nInvoice created successfully:');
    console.log(`Payment Hash: ${invoice.paymentHash}`);
    console.log(`Invoice Amount: ${invoice.valueMsat.toString()} msat`);
    console.log(`Status: ${invoice.status}`);
    console.log(`Expires At: ${invoice.expiresAt.toISOString()}`);

    // Display invoice string (this is what recipients need to pay)
    console.log('\nFull Invoice String (share with payer):');
    console.log(invoice.invoice);

    console.log('\nTo check invoice status later, use the payment hash.');

    return invoice;
  } catch (e) {
    throw e;
  }
}

// Run the example
main()
  .then((invoice) => {
    console.log('Example completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Example failed with error:', e.message);
    process.exit(-1);
  });
