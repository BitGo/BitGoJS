/**
 * Send funds from a gas tank to a BitGo wallet's receive address.
 *
 * Copyright 2025, BitGo, Inc.  All Rights Reserved.
 */
import { BitGoAPI } from '@bitgo/sdk-api';
import { Tapt } from '@bitgo/sdk-coin-apt';
import { FundForwarderParams } from '@bitgo/sdk-core';

const bitgo = new BitGoAPI({
  accessToken: '<access token>',
  env: 'test',
});

const coin = 'tapt';
bitgo.register(coin, Tapt.createInstance);

const walletId = '<wallet id>';

async function main() {
  bitgo.unlock({ otp: '000000' });
  const walletInstance = await bitgo.coin(coin).wallets().get({ id: walletId });

  const fundForwarderParams: FundForwarderParams = {
    forwarders: [
      {
        forwarderAddress: '<forwarder address>',
        amount: '<amount>' // optional field
      },
    ],
  }

  const response = await walletInstance.fundForwarders(fundForwarderParams);
  console.log('Response', response);
}

main().catch((e) => console.error(e));
