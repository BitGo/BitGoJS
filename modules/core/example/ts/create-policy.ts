/**
 * Create a velocity limit policy on a multi-sig wallet at BitGo.
 *
 * This tool will help you see how to use the BitGo API to easily
 * create new wallet policies
 *
 * Copyright 2019, BitGo, Inc.  All Rights Reserved.
 *
 */
import { BitGo, Wallet } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

// TODO: set your access token here
const accessToken = '';

// TODO: put the new policy on the wallet with this id
const id = '';

const coin = 'tltc';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet: Wallet = await bitgo.coin(coin).wallets().get({ id });

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
