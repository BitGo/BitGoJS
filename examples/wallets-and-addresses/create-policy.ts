/**
 * Create a velocity limit policy on a multi-sig wallet at BitGo.
 *
 * This tool will help you see how to use the BitGo API to easily
 * create new wallet policies
 *
 * Copyright 2022, BitGo, Inc.  All Rights Reserved.
 *
 */
import { BitGoAPI, Wallet } from 'bitgo';
import { Tltc } from '@bitgo/sdk-coin-ltc';

// STEP 1: Register coin used in your bitgo instance
const bitgo = new BitGoAPI({ env: 'test' });
bitgo.register('tltc', Tltc.createInstance);

// STEP 2: Define values used for actions
const ACCESS_TOKEN = 'ACCESS_TOKEN';
const WALLET_ID = 'WALLET_ID';
const COIN = 'tltc';
const POLICY = {
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

// STEP 3: Execute actions
async function main() {
  bitgo.authenticateWithAccessToken({ accessToken: ACCESS_TOKEN });

  const wallet: Wallet = await bitgo.coin(COIN).wallets().get({ id: WALLET_ID });

  console.log(`Setting new velocity limit policy on wallet ${wallet.label()}`);

  const result = await wallet.createPolicyRule(POLICY);
  console.dir(result);
}

main().catch((e) => console.error(e));
