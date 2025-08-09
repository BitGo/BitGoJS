/**
 * Pre-build a message from the wallet
 *
 * This tool will help you see how to use the BitGo API to easily build
 * a message from a wallet.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */

import {BitGoAPI} from '@bitgo/sdk-api';
import {MessageStandardType, getMidnightGlacierDropClaimMsg} from "@bitgo/sdk-core";
import {Hteth} from "@bitgo/sdk-coin-eth";
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

// Set the coin name to match the blockchain and network
// doge = dogecoin, tdoge = testnet dogecoin
const coin = 'hteth';
bitgo.register(coin, Hteth.createInstance);

const id = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id });
  console.log(`Wallet label: ${wallet.label()}`);

  const adaTestnetDestinationAddress = 'addr_test1vz7xs7ceu4xx9n5xn57lfe86vrwddqpp77vjwq5ptlkh49cqy3wur';
  const allocationAmt = 12345678;
  const testnetMessageRaw = getMidnightGlacierDropClaimMsg(adaTestnetDestinationAddress, allocationAmt);

  const txRequest = await wallet.buildSignMessageRequest({
    message: {
      messageRaw: testnetMessageRaw,
      messageStandardType: MessageStandardType.EIP191,
    },
  });
  console.dir(txRequest);
}

main().catch((e) => console.log(e));
