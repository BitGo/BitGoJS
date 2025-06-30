/**
 * Sign a Message from an MPC wallet at BitGo.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
import { MessageStandardType } from '@bitgo/sdk-core';

const bitgo = new BitGo({ env: 'test' });

const coin = 'hteth';
const basecoin = bitgo.coin(coin);
const accessToken = '';
const walletId = '';
const walletPassphrase = '';

async function signMessage(): Promise<void> {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const walletInstance = await basecoin.wallets().get({ id: walletId });

  const messageTxn = await walletInstance.signMessage({
    message: {
      messageRaw: 'Hello BitGo!',
      messageStandardType: MessageStandardType.EIP191,
    },
    walletPassphrase,
  });

  console.log(messageTxn);
}

signMessage().catch(console.error);
