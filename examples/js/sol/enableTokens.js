/**
 * Enables tokens for a Solana wallet.
 *
 * This will create associated token addresses that belong to your wallet's root address.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
const BitGo = require('bitgo');
const bitgo = new BitGo.BitGo({
  env: 'custom',
  customRootURI: '',
});

// TODO: set your access token here
// You can get this from User Settings > Developer Options > Add Access Token
const accessToken = '';

// TODO: set the id of your wallet
const walletId = '';

// TODO: set your passphrase for your new wallet here
const passphrase = 'test_wallet_passphrase';

const coin = 'tsol';

// Enable tokens for your root wallet
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  const enableTokens = await wallet.sendTokenEnablements({
    enableTokens: [
      // TODO: provide name of tokens you want to enable
      { name: 'tsol:usdc' },
      { name: 'tsol:usdt' },
    ],
    walletPassphrase: passphrase,
  });

  console.log(JSON.stringify(enableTokens, undefined, 2));
}

main().catch((e) => console.error(e));
