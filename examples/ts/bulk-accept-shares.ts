/**
 * Accept multiple wallet shares.
 * This makes use of the convenience function wallets().bulkAcceptShare()
 *
 * This tool will help you see how to use the BitGo API to easily list your
 * BitGo wallets.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tltc } from '@bitgo/sdk-coin-ltc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tltc';
bitgo.register(coin, Tltc.createInstance);

const walletShareIds = ['']; // add the shareIds which needs to be accepted
const userLoginPassword = ''; // add the user login password

async function main() {
  const acceptShare = await bitgo.coin(coin).wallets().bulkAcceptShare({
    walletShareIds: walletShareIds,
    userLoginPassword: userLoginPassword,
  });
  console.dir(acceptShare);
}

main().catch((e) => console.error(e));
