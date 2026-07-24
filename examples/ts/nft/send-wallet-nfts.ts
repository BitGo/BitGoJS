/**
 * Send an NFT of a wallet at BitGo.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tapt } from "@bitgo/sdk-coin-apt";
import { TokenType } from "@bitgo/sdk-core";

require('dotenv').config({ path: '../../../.env' });

const bitgo = new BitGoAPI({
  accessToken: '',
  env: 'test',
});

const coin = 'tapt';
bitgo.register(coin, Tapt.createInstance);

const walletId = '';

async function main() {
  bitgo.unlock({ otp: '000000' });
  const wallet = await bitgo.coin(coin).wallets().get({id: walletId, allTokens: true});

  console.log('\nWallet ID:', wallet.id());
  console.log('\nSupported NFTs:', );
  console.log(wallet.nftBalances());

  const resp = await wallet.sendNft({
    walletPassphrase: '',
    type: 'transfer',
  }, {
    type: TokenType.DIGITAL_ASSET,
    tokenId: '',
    tokenContractAddress: '',
    recipientAddress: '',
  });
  console.log('\nSend NFT Response:', resp);
}

main().catch((e) => console.error(e));
