/**
 * Sign a Message from an MPC wallet at BitGo.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { MessageStandardType } from "@bitgo/sdk-core";
import { MIDNIGHT_TNC_HASH } from "@bitgo/account-lib";
import {Hteth} from "@bitgo/sdk-coin-eth";
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

const coin = 'hteth';
bitgo.register(coin, Hteth.createInstance);

const id = '688a21570ca9c4f504ff0795d0873c9f';

async function signMessage() {
  const wallet = await bitgo.coin(coin).wallets().get({ id });
  console.log(`Wallet label: ${wallet.label()}`);

  const adaTestnetDestinationAddress = 'addr_test1qqkr5y3sj2206k69e2xhj8r85tgwjr65yu2gw27yspzvg6ev8gfrpy55l4d5tj5d0ywx0gksay84gfc5su4ufqzyc34sxkpdpl';
  const testnetMessageRaw = `STAR 10 to ${adaTestnetDestinationAddress} ${MIDNIGHT_TNC_HASH}`;

  const walletPassphrase = process.env.TEST_PASS;
  const txRequest = await wallet.signMessage({
    message: {
      messageRaw: testnetMessageRaw,
      messageStandardType: MessageStandardType.EIP191,
    },
    walletPassphrase,
  });
  console.dir(txRequest);
}

signMessage().catch(console.error);
