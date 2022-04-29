/**
 * Build, sign, and submit a token transaction to the BitGo network.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

import { BitGo } from 'bitgo';

// authentication fixtures
const env = 'test'; // test or prod
const accessToken = ''; // your API access token
const walletPassphrase = ''; // wallet passphrase
const otp = ''; // create an OTP, 000000 for test environment

// transaction fixtures
const walletId = ''; // sender wallet ID
const tokenTicker = ''; // token name, for example tavaxc:link
const baseUnitAmount = ''; // base unit amount, for example 1000000000000000000 if sending 1 WETH
const recipientAddress = ''; // recipient address


async function sendTokens(walletId: string, tokenTicker: string, baseUnitAmount: string, recipientAddress: string) {
  const bitgo = new BitGo({
    env,
  });

  await bitgo.authenticateWithAccessToken({ accessToken });
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    console.log('We did not unlock.');
    throw new Error();
  }
  const wallet = await bitgo.coin(tokenTicker).wallets().getWallet({ id: walletId, allTokens: true });

  const halfSignedTransaction = await wallet.prebuildAndSignTransaction({
    recipients: [
      {
        amount: baseUnitAmount,
        address: recipientAddress,
      },
    ],
    walletPassphrase,
  });

  const rawHalfSignedTransaction: string = (halfSignedTransaction as any).halfSigned.txHex;
  console.log('Received raw half signed transaction');
  
  const response = await wallet.submitTransaction({
    halfSigned: {
      txHex: rawHalfSignedTransaction,
    },
  });

  console.log('Submitted transaction. TxID: ' + response.txid);
}

sendTokens(walletId, tokenTicker, baseUnitAmount, recipientAddress).catch((e) => console.error(e));
