/**
 * Resend the invitation email for sharing a BitGo wallet
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tbtc } from '@bitgo/sdk-coin-btc';
require('dotenv').config({ path: '../../.env' });

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'tbtc';
bitgo.register(coin, Tbtc.createInstance);

// TODO: set your wallet share ID here
// you can get this using the listShares() convienence method
const walletShareId = null;

async function main() {
  const shareResult = await bitgo.coin(coin).wallets().resendShareInvite({ walletShareId });

  console.log('Share invite resent successfully');
  console.dir(shareResult);
}

main().catch((e) => console.error(e));
