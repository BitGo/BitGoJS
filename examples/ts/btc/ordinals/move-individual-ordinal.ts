/**
 * Transfer an individual ordinal from one address to another
 *
 * Copyright 2024 BitGo, Inc. All Rights Reserved.
 */

const BitGoJS = require('bitgo');

// change this to env: 'prod' when you are ready for production
const env = 'test';
// change coin to 'btc' when working with production
const coin = env === 'test' ? 'tbtc' : 'btc';

const bitgo = new BitGoJS.BitGo({ env });

// set your access token and walletPassphrase here
const accessToken = '';
const walletPassphrase = '';

// set your wallet ID here
const walletId = '';

// The location of the ordinal you want to send {txid}:{vout}:{offset}
// Background about how ordinals work here: https://docs.ordinals.com/overview.html
const satPoint = '';

// set where you are sending the ordinal
const recipient = '';

// set the fee rate for the transaction in Satoshis per KB
const feeRateSatKb = 1000;

async function transferIndividualOrdinal() {
  // Authenticate and get wallet
  await bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  // Instantiate the transaction builder that will be used to send the particular ordinal
  // We need to use this specific transaction builder so that we are safely extracting the exact ordinal.
  const inscriptionBuilder = bitgo.coin(coin).getInscriptionBuilder(wallet);

  // Build the transaction to send the ordinal
  // Note that you can configure the structure of the transaction by passing in additional parameters
  const buildResult = await inscriptionBuilder.prepareTransfer(satPoint, recipient, feeRateSatKb, {});

  const sent = await inscriptionBuilder.signAndSendTransfer(walletPassphrase, buildResult);
  console.log('sent ' + JSON.stringify(sent, null, 2));
}

transferIndividualOrdinal().catch(console.error);
