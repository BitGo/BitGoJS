/**
 * Pay a Lightning invoice from a BitGo Lightning wallet.
 *
 * IMPORTANT: Your BitGo account must have the "custodyLightningWallet" license
 * enabled to use this functionality.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { Tlnbtc } from '@bitgo/sdk-coin-lnbtc';
import { getLightningWallet, SubmitPaymentParams } from '@bitgo/abstract-lightning';

// Set access token for testnet
const accessToken = '';

// Set your lightning wallet ID
const walletId = '';

// Set your wallet passphrase - needed for signing
const passphrase = '';

// Use tlnbtc for testnet, lnbtc for mainnet
const coin = '';

// The invoice you want to pay
const invoiceToPay = ''; // BOLT11 encoded invoice string

/**
 * Pay a Lightning invoice
 * @returns {Promise<void>} Payment result
 */
async function main(): Promise<void> {
  try {
    const bitgo = new BitGoAPI({
      accessToken,
      env: 'test',
    });

    // Register Lightning Bitcoin coin
    bitgo.register(coin, Tlnbtc.createInstance);

    //get the wallet
    console.log(`Getting Lightning wallet with ID: ${walletId}`);

    const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
    const lightning = getLightningWallet(wallet);

    // Set up payment parameters
    const paymentParams: SubmitPaymentParams = {
      invoice: invoiceToPay,
      // If the invoice has an amount, this is optional
      amountMsat: BigInt(50000), // 50,000 millisatoshis = 50 satoshis
      passphrase: passphrase,
      // Optional parameters
      feeLimitMsat: BigInt(5000), // 5,000 millisatoshis = 5 satoshis maximum fee
      comment: 'Payment for services',
      sequenceId: `payment-${Date.now()}`, // Optional unique identifier
    };

    console.log('Paying Lightning invoice...');
    const paymentResult = await lightning.payInvoice(paymentParams);

    // Display payment information
    console.log('\nPayment completed:');
    console.log(`Transaction Request ID: ${paymentResult.txRequestId}`);
    console.log(`Transaction Request State: ${paymentResult.txRequestState}`);

    if (paymentResult.paymentStatus) {
      console.log('\nPayment Status:');
      console.log(`Status: ${paymentResult.paymentStatus.status}`);
      console.log(`Payment Hash: ${paymentResult.paymentStatus.paymentHash}`);

      if (paymentResult.paymentStatus.amountMsat) {
        console.log(`Amount Paid: ${paymentResult.paymentStatus.amountMsat} msat`);
      }

      if (paymentResult.paymentStatus.feeMsat) {
        console.log(`Fee Paid: ${paymentResult.paymentStatus.feeMsat} msat`);
      }
    }

    // If payment requires approval
    if (paymentResult.pendingApproval) {
      console.log('\nPayment requires approval:');
      console.log(`Pending Approval ID: ${paymentResult.pendingApproval.id}`);
      console.log('Please approve the payment in the BitGo dashboard or via the API');
    }
  } catch (e) {
    // Handle expected errors specifically
    if (e.message && e.message.includes('invalid invoice')) {
      console.error('\nINVALID INVOICE: The provided invoice string is not valid.');
    } else if (e.message && e.message.includes('unauthorized')) {
      console.error('\nAUTHENTICATION ERROR: Your access token is invalid or expired.');
    }

    throw e;
  }
}

// Run the example
main()
  .then((result) => {
    console.log('\nExample completed successfully.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Example failed with error:', e.message);
    process.exit(-1);
  });
