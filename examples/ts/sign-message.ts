/**
 * Sign a Message from an MPC wallet at BitGo.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGo } from 'bitgo';
import { getMidnightGlacierDropMsg, MessageStandardType } from '@bitgo/sdk-core';

const bitgo = new BitGo({ env: 'test' });

const coin = 'hteth';
const basecoin = bitgo.coin(coin);
const accessToken = '';
const walletId = '';
const walletPassphrase = '';

async function signMessage(): Promise<void> {
  await bitgo.authenticateWithAccessToken({ accessToken });
  const walletInstance = await basecoin.wallets().get({ id: walletId });

  const adaTestnetDestinationAddress = 'addr_test1vz7xs7ceu4xx9n5xn57lfe86vrwddqpp77vjwq5ptlkh49cqy3wur';
  const allocationAmt = 12345678;
  const testnetMessageRaw = getMidnightGlacierDropMsg(adaTestnetDestinationAddress, allocationAmt);

  const messageTxn = await walletInstance.signMessage({
    message: {
      messageRaw: testnetMessageRaw,
      messageStandardType: MessageStandardType.EIP191,
    },
    walletPassphrase,
  });

  console.log(messageTxn);
}

signMessage().catch(console.error);
