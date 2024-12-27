/**
 * Send a transaction from a multi-sig wallet at BitGo.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

const coin = 'tarbeth';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = 'v2xb1352916e70070bb5f809466b0608b7654d6bb09daf768795de7f9e89c7cc0c0';
const walletId = '65ddac24416d28ae75acedd9c8623bb3';
// TODO: set your passphrase here
const walletPassphrase = '#Bondiola1234';

Promise.coroutine(function* () {
  bitgo.authenticateWithAccessToken({ accessToken: accessToken });

  const walletInstance = yield basecoin.wallets().get({ id: walletId });

  // const newReceiveAddress1 = yield walletInstance.createAddress();
  const transaction = yield walletInstance.sendMany({
    recipients: [
      {
        amount: '1',
        address: '0x6f7a949969f0d7e81e1707ae52ab164387ce5ab6',
        tokenName: 'tarbeth:link',
        tokenData: {
          tokenName: 'd6a8869d-3da4-4b95-a9af-f2a059ca651f',
          tokenContractAddress: '0x143e1dae4f018ff86051a01d44a1b49b13704056',
          decimalPlaces: 18,
          tokenType: 'ERC20',
          tokenId: 'string',
          tokenQuantity: 'string',
        },
      },
    ],
    walletPassphrase: walletPassphrase,
  });
  // const explanation = yield basecoin.explainTransaction({ txHex: transaction.tx });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('New Transaction:', JSON.stringify(transaction, null, 4));
  // console.log('Transaction Explanation:', JSON.stringify(explanation, null, 4));
})();
