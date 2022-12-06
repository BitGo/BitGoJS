/**
 * Create a velocity limit policy on a multi-sig wallet at BitGo.
 *
 * This tool will help you see how to use the BitGo API to easily
 * create new wallet policies
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 *
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

const walletId = '';

async function main() {
  const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  console.log(`Setting new velocity limit policy on wallet ${wallet.label()}`);

  const policy = {
    action: {
      type: 'getApproval',
    },
    condition: {
      amountString: '100000',
      excludeTags: [],
      groupTags: [':tag'],
      timeWindow: 60 * 60 * 24,
    },
    id: 'test_policy',
    type: 'velocityLimit',
  };

  const result = await wallet.createPolicyRule(policy);
  console.dir(result);
}

main().catch((e) => console.error(e));
