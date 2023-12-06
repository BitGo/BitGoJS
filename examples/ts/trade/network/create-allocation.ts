/**
 * Create a network allocation
 *
 * Copyright 2023, BitGo, Inc.  All Rights Reserved.
 */

import { BitGoAPI } from '@bitgo/sdk-api';
import { coins } from '@bitgo/sdk-core';
import { PrepareNetworkAllocationParams } from 'modules/sdk-core/src/bitgo/trading/network';
require('dotenv').config({ path: '../../../.env' });

const OFC_WALLET_ID = process.env.OFC_WALLET_ID;
const OFC_WALLET_PASSPHRASE = process.env.OFC_WALLET_PASSPHRASE as string;

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test',
});

const coin = 'ofc';
bitgo.register(coin, coins.Ofc.createInstance);

async function main() {
  const wallet = await bitgo.coin('ofc').wallets().get({ id: OFC_WALLET_ID });
  const tradingAccount = wallet.toTradingAccount();
  const tradingNetwork = tradingAccount.toNetwork();

  const body: PrepareNetworkAllocationParams = {
    walletPassphrase: OFC_WALLET_PASSPHRASE,
    connectionId: 'connection-id',
    clientExternalId: 'one-time-uuid-v4', // e.g. uuidV4(),
    amount: {
      currency: 'tbtc',
      quantity: '1000000', // in satoshis (base amount)
    },
    notes: 'Private note that you can view and edit',
    nonce: '', // e.g. crypto.randomBytes(32).toString('hex'),
  };

  const submission = await tradingNetwork.prepareAllocation(body);

  // Allocation
  tradingNetwork.createAllocation(submission);

  // Deallocation
  tradingNetwork.createDeallocation(submission);
}

main().catch((e) => console.error(e));
