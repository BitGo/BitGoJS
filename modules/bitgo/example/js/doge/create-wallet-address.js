/**
 * Create a new receive address on an existing multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
const BitGoJS = require('bitgo');

// change this to env: 'production' when you are ready for production
const bitgo = new BitGoJS.BitGo({ env: 'test' });

const coin = 'tdoge';
// TODO: set your access token here
const accessToken = '';

// set your wallet from the YYYYY parameter here in the URL on app.bitgo-test.com
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
const walletId = '';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const newReceiveAddress = await wallet.createAddress();

  console.log('Wallet ID:', wallet.id());
  console.log('First Receive Address:', wallet.receiveAddress());
  console.log('Second Receive Address:', newReceiveAddress);
}
main().catch((e) => console.error(e));
