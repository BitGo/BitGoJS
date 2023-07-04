/**
 * List deployed receive addresses of an eth wallet and balances of the given token.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'gteth';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = '';
const walletId = '';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await basecoin.wallets().get({ id: walletId });
  const addresses = await walletInstance.addresses({
    includeBalances: true,
    returnBalancesForToken: 'gterc6dp',
    pendingDeployment: false,
  });

  console.log('Wallet ID:', walletInstance.id());
  for (const address of addresses.addresses) {
    console.log(`Address id: ${address.id}`);
    console.log(`Address: ${address.address}`);
    console.log(`Balance: ${address.balance.balance}`);
  }
}

main().catch((e) => console.error(e));
