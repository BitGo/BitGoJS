/**
 * Get the balance of a multi-sig wallet at BitGo.
 * This makes use of the convenience function wallets().get()
 *
 * This tool will help you see how to use the BitGo API to easily get
 * information about a wallet.
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'custom', customRootURI: 'https://testnet-03-app.bitgo-dev.com' });

// TODO: set your access token here
const accessToken = 'v2x767398174e675ed05a243696942e467b5b3385ecbf0d2324fc23eef61fdc5958';

const coin = 'tavaxp';

const basecoin = bitgo.coin(coin);

const walletId = '634d72a3d62c5300077f5f9374f14efa';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const walletInstance = await basecoin.wallets().get({ id: walletId });

  console.log('Wallet ID:', walletInstance.id());
  console.log('Current Receive Address:', walletInstance.receiveAddress());
  console.log('Balance:', walletInstance.balanceString());
  console.log('Confirmed Balance:', walletInstance.confirmedBalanceString());
  console.log('Spendable Balance:', walletInstance.spendableBalanceString());
}

main().catch((e) => console.error(e));
