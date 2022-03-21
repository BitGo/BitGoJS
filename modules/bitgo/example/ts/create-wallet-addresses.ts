/**
 * Create a new receive address on a multi-sig wallet at BitGo.
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const coin = 'tltc';
const basecoin = bitgo.coin(coin);
// TODO: set your access token here
const accessToken = '';
// TODO: set your passphrase here
const walletPassphrase = '';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const { wallet } = await basecoin.wallets()
    .generateWallet({
      label: `Test Wallet Example`,
      passphrase: walletPassphrase,
      backupXpubProvider: 'keyternal',
    });

  const newReceiveAddress = await wallet.createAddress();

  console.log('Wallet ID:', wallet.id());
  console.log('First Receive Address:', wallet.receiveAddress());
  console.log('Second Receive Address:', newReceiveAddress.address);
}

main().catch((e) => console.error(e));
