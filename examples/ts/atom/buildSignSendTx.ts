/**
 * Create a TSS atom wallet at BitGo.
 * This makes use of the convenience function generateWallet
 *
 * This tool will help you see how to use the BitGo API to easily create a wallet.
 * In this form, it creates 2 keys on the host which runs this example.
 * It is HIGHLY RECOMMENDED that you GENERATE THE KEYS ON SEPARATE MACHINES for real money wallets!
 *
 * To perform more advanced features, such as encrypting keys yourself, please look at createWalletAdvanced.js
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */
const BitGoJS = require('bitgo');
const bitgo = new BitGoJS.BitGo({
  env: 'custom',
  customRootURI: 'https://testnet-16-app.bitgo-dev.com',
});

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = 'v2x04674c296b63dd92e7508f47f098692da3f6d84ac08f1bfac449a76728ed9f4d';

// TODO: get the wallet with this id
const id = '643f8362242e9e00070172edc8ef57c1';

const coin = 'tatom';

const receiveAddress = 'cosmos1smefkq9yaxgw9c9fhym6qsp746q884czeacn32';

const walletPassphrase = '6PZKSm$oIFa%s1fy';

// Create the wallet
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = await bitgo.coin(coin).wallets().get({ id });

  console.log(`Wallet label: ${wallet}`);

  const whitelistedParams = {
    intent: {
      intentType: 'payment',
      recipients: [
        {
          address: {
            address: receiveAddress,
          },
          amount: {
            value: '100000',
            symbol: 'tatom',
          },
        },
      ],
      memo: "12",
    },
    apiVersion: 'full',
    preview: false,
  };

  await bitgo.unlock({ otp: '000000', duration: 3600 });
  const unsignedTx = (await bitgo
    .post(bitgo.url('/wallet/' + id + '/txrequests', 2))
    .send(whitelistedParams)
    .result());

  console.log("Unsigned tx: ");
  console.log(unsignedTx);

  // sign tx
  const keychains = await bitgo.coin(coin).keychains().getKeysForSigning({ wallet: wallet });
  const signedTransaction = await wallet.signTransaction({
    txPrebuild: unsignedTx,
    keychain: keychains[0],
    walletPassphrase: walletPassphrase,
    pubs: keychains.map((k) => k.pub),
    reqId: unsignedTx.txRequestId,
  });

  // submit tx
  const submittedTx = await bitgo
    .post(bitgo.url('/wallet/' + id + '/tx/send'))
    .send({ txRequestId: signedTransaction.txRequestId })
    .result();

  console.log('New Transaction:', JSON.stringify(submittedTx, null, 4));

}

main().catch((e) => console.error(e));
