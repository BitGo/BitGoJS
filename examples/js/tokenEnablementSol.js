/**
 * Enables tokens for a Solana wallet.
 *
 * This will create associated token addresses that belong to your wallet's root address.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = 'v2x877fe3d93cf92b725652b5d674acd6549cae6bf1572a3b678596a5477619cc31';
// const accessToken = 'v2x877fe3d93cf92b725652b5d674acd6549cae6bf1572a3b678596a5477619cc31';

const BitGo = require('bitgo');
const bitgo = new BitGo.BitGo({
  env: 'custom',
  accessToken: accessToken,
  customRootURI: 'https://app.bitgo-test.com',
});

// TODO: set the id of your wallet
const walletId = '6748a099cfb4f59833a6fcc95710493f';
// const walletId = '6748a099cfb4f59833a6fcc95710493f';

// TODO: set your passphrase for your new wallet here
const passphrase = 'Ghghjkg!455544llll';
// const passphrase = 'Ghghjkg!455544llll';

const coin = 'tsol';

// Enable tokens for your root wallet
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const enableTokens = await wallet.sendTokenEnablements({
    enableTokens: [
      // TODO: provide name of tokens you want to enable
      { name: 'txrp:rlusd' },
    ],
    walletPassphrase: passphrase,
  });

  console.log(JSON.stringify(enableTokens, undefined, 2));
}

main().catch((e) => console.error(e));
