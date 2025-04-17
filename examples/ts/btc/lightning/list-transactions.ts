/**
 * List Lightning transactions for a wallet with optional filtering.
 *
 * IMPORTANT: Your BitGo account must have the "custodyLightningWallet" license
 * enabled to use this functionality. Contact BitGo support if you receive a
 * license-related error.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tlnbtc } from '@bitgo/sdk-coin-lnbtc';
import { getLightningWallet } from '@bitgo/abstract-lightning';

// TODO: set access token for testnet
// Get this from your BitGo account
const accessToken = '';

// TODO: set your Lightning wallet ID here
const walletId = '';

// Optional filter parameters
const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 20; // Number of results to return
const blockHeight = process.env.BLOCK_HEIGHT ? parseInt(process.env.BLOCK_HEIGHT, 10) : undefined;

// Parse date strings if provided
const startDate = process.env.START_DATE ? new Date(process.env.START_DATE) : undefined;
const endDate = process.env.END_DATE ? new Date(process.env.END_DATE) : undefined;

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * List Lightning transactions with optional filtering
 * @returns {Promise<void>} Array of Lightning transactions
 */
async function main(): Promise<void> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    console.log(`Listing Lightning transactions for wallet: ${walletId}`);
    console.log('Filters:');
    console.log(`- Limit: ${limit}`);
    if (blockHeight) console.log(`- Block Height: ${blockHeight}`);
    if (startDate) console.log(`- Start Date: ${startDate.toISOString()}`);
    if (endDate) console.log(`- End Date: ${endDate.toISOString()}`);

    if (!walletId) {
      throw new Error('Wallet ID is required - please set LIGHTNING_WALLET_ID environment variable');
    }

    // Get the wallet
    const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightning = getLightningWallet(wallet);

    // Prepare query parameters
    const queryParams: any = { limit };
    if (blockHeight) queryParams.blockHeight = blockHeight;
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;

    // List transactions with the provided filters
    const transactions = await lightning.listTransactions(queryParams);

    // Display transaction summary
    console.log(`\nFound ${transactions.length} transactions:`);

    // Display detailed information for each transaction
    transactions.forEach((tx, index) => {
      console.log(`\n--- Transaction ${index + 1} ---`);
      console.log(`Transaction ID: ${tx.id}`);
      console.log(`Normalized TX Hash: ${tx.normalizedTxHash}`);
      console.log(`Block Height: ${tx.blockHeight}`);
      console.log(`Date: ${tx.date.toISOString()}`);
      console.log(`Size: ${tx.size} bytes`);
      console.log(`Fee: ${tx.fee} (${tx.feeString})`);
      console.log(`Confirmations: ${tx.confirmations}`);

      if (tx.label) {
        console.log(`Label: ${tx.label}`);
      }

      console.log(`Inputs: ${tx.inputs.length}, Outputs: ${tx.outputs.length}`);

      // Calculate total value
      const totalInputValue = tx.inputs.reduce((sum, input) => sum + input.value, 0);
      const totalOutputValue = tx.outputs.reduce((sum, output) => sum + output.value, 0);

      console.log(`Total Input Value: ${totalInputValue}`);
      console.log(`Total Output Value: ${totalOutputValue}`);
    });
  } catch (e) {
    console.error('Error listing Lightning transactions:', e.message);
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
