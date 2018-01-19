//
// Create a velocity limit policy on a multi-sig wallet at BitGo.
//
// This tool will help you see how to use the BitGo API to easily
// create new wallet policies
//
// Copyright 2018, BitGo, Inc.  All Rights Reserved.
//

const BitGoJS = require('../../src/index.js');
const bitgo = new BitGoJS.BitGo({ env: 'test' });
const Promise = require('bluebird');

// TODO: set your access token here
const accessToken = null;

// TODO: put the new policy on the wallet with this id
const id = null;

const coin = 'tltc';

Promise.coroutine(function *() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet = yield bitgo.coin(coin).wallets().get({ id });

  console.log(`Setting new velocity limit policy on wallet ${wallet.label()}`);

  const policy = {
    action: {
      type: 'getApproval'
    },
    condition: {
      amountString: '100000',
      excludeTags: [],
      groupTags: [':tag'],
      timeWindow: 60 * 60 * 24
    },
    id: 'test_policy',
    type: 'velocityLimit'
  };

  const result = yield wallet.createPolicyRule(policy);
  console.dir(result);
})();
