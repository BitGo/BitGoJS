/**
 * Get a Lightning transaction by its transaction ID.
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

// TODO: set the transaction ID to retrieve
const txId = '';

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = 'tlnbtc';

/**
 * Get a Lightning transaction by its ID
 * @returns {Promise<void>} Lightning transaction details
 */
async function main(): Promise<void> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    console.log(`Getting Lightning transaction with ID: ${txId}`);

    if (!walletId) {
      throw new Error('Wallet ID is required - please set LIGHTNING_WALLET_ID environment variable');
    }

    if (!txId) {
      throw new Error('Transaction ID is required - please set TRANSACTION_ID environment variable');
    }

    // Get the wallet
    const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightning = getLightningWallet(wallet);

    // Get the transaction from Lightning wallet
    const transaction = await lightning.getTransaction(txId);

    // Display transaction details
    console.log('\nTransaction Details:');
    console.log(`Transaction ID: ${transaction.id}`);
    console.log(`Normalized TX Hash: ${transaction.normalizedTxHash}`);
    console.log(`Block Height: ${transaction.blockHeight}`);
    console.log(`Block Hash: ${transaction.blockHash}`);
    console.log(`Block Position: ${transaction.blockPosition}`);
    console.log(`Date: ${transaction.date.toISOString()}`);
    console.log(`Size: ${transaction.size} bytes`);
    console.log(`Fee: ${transaction.fee} (${transaction.feeString})`);
    console.log(`Confirmations: ${transaction.confirmations}`);

    if (transaction.label) {
      console.log(`Label: ${transaction.label}`);
    }

    console.log(`\nInputs (${transaction.inputs.length}):`);
    transaction.inputs.forEach((input, index) => {
      console.log(`  Input #${index + 1}:`);
      console.log(`    ID: ${input.id}`);
      console.log(`    Value: ${input.value} (${input.valueString})`);
      if (input.address) {
        console.log(`    Address: ${input.address}`);
      }
      if (input.wallet) {
        console.log(`    Wallet: ${input.wallet}`);
      }
    });

    console.log(`\nOutputs (${transaction.outputs.length}):`);
    transaction.outputs.forEach((output, index) => {
      console.log(`  Output #${index + 1}:`);
      console.log(`    ID: ${output.id}`);
      console.log(`    Value: ${output.value} (${output.valueString})`);
      if (output.address) {
        console.log(`    Address: ${output.address}`);
      }
      if (output.wallet) {
        console.log(`    Wallet: ${output.wallet}`);
      }
    });

    console.log(`\nTransaction Entries (${transaction.entries.length}):`);
    transaction.entries.forEach((entry, index) => {
      console.log(`  Entry #${index + 1}:`);
      console.log(`    Address: ${entry.address}`);
      console.log(`    Value: ${entry.value} (${entry.valueString})`);
      console.log(`    Inputs: ${entry.inputs}, Outputs: ${entry.outputs}`);
      if (entry.wallet) {
        console.log(`    Wallet: ${entry.wallet}`);
      }
    });
  } catch (e) {
    console.error('Error getting Lightning transaction:', e.message);
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
