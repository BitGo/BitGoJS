/**
 * List deployed receive addresses of a eth wallet and their given token balances.
 *
 * This tool will help you see how to use the BitGo API to easily list your
 * BitGo wallets.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'teth';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = '';
const walletId = '';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await basecoin.wallets().get({ id: walletId });
  const addresses = await walletInstance.addresses({ includeBalances: true, returnBalancesForToken: 'gterc6dp', pendingDeployment: false });

  console.log('Wallet ID:', walletInstance.id());
  for (const address of addresses.addresses) {
    console.log(`Address id: ${address.id}`);
    console.log(`Address: ${address.address}`);
    console.log(`Balance: ${address.balance.balance}`);
  }
}

main().catch((e) => console.error(e));
