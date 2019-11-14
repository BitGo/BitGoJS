/**
 * Resend the invitation email for sharing a BitGo wallet
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

// TODO: set your access token here
const accessToken = '';

// TODO: set your wallet share ID here
// you can get this using the listShares() convienence method
const walletShareId = null;

const coin = 'tltc';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const shareResult = await bitgo.coin(coin).wallets().resendShareInvite({ walletShareId });

  console.log('Share invite resent successfully');
  console.dir(shareResult);
}

main().catch((e) => console.error(e));
