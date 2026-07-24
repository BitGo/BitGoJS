/**
 * Simulate a webhook trigger for a wallet's coin type
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

// The ID of an active webhook for the target coin type
// e.g. 622bdee69c4f7f0007b13bd8fe70d9d8
const webhookId = '';

// A blockId for a wallet's address that has a history of transactions
// e.g. 0000000000004e08de493588ae92d44c64aaf0164ab04325f3ee7e987d8129f1
const blockId = '';

async function main() {
  const coin = bitgo.coin(coin);

  const simulation = await coin.webhooks().simulate({ webhookId, blockId });

  console.log('Webhook simulation triggered successfully');
  console.log(simulation);
}

main().catch((e) => console.error(e));
