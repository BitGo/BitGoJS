/**
 * Get the NFT balance of a wallet at BitGo.
 * This makes use of the convenience function wallets().get()
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import {Tapt} from "@bitgo/sdk-coin-apt";
require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: 'v2x280d4aeb94f6971cae261b86041f2289fee01ccf7ea7187fc36e9e6b65783972',
  env: 'test',
});

const coin = 'tapt';
bitgo.register(coin, Tapt.createInstance);

const walletId = '67ab1a85f51f11a09f9e919e4cbcd11c';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({id: walletId, allTokens: true});

  console.log('\nWallet ID:', wallet.id());
  console.log('\nSupported NFTs:', );
  console.log(wallet.nftBalances());

  const resp = await wallet.sendNft({
    walletPassphrase: 'Ghghjkg!455544llll',
    otp: '000000',
  }, {
    entries: [
      {
        tokenId: '0x39f154ec595d28f3037596c98c0f3219c2dc5132afc0d3527286f791df9eb5c8',
        amount: 1,
      },
    ],
    type: 'Digital Asset',
    tokenContractAddress: '0xbbc561fbfa5d105efd8dfb06ae3e7e5be46331165b99d518f094c701e40603b5',
    recipientAddress: '0xc15acc27ee41f266877c8f0c61df5bcbc7997df6',
  });
}

main().catch((e) => console.error(e));
