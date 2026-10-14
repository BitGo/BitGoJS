import assert from 'assert/strict';

import { pox5 } from '@bitgo/utxo-descriptors';

import * as staking from '../../../src/pox5';

describe('PoX-5 spend policy compatibility exports', function () {
  it('re-exports the spend policy from utxo-descriptors', function () {
    assert.equal(staking.POX5_MAX_UNLOCK_HEIGHT, pox5.POX5_MAX_UNLOCK_HEIGHT);
    assert.equal(staking.assertPox5LocktimeSpend, pox5.assertPox5LocktimeSpend);
    assert.equal(staking.assertPox5EarlyExitSpend, pox5.assertPox5EarlyExitSpend);
    assert.equal(staking.classifyPox5Spend, pox5.classifyPox5Spend);
    assert.equal(staking.preparePox5EarlyExit, pox5.preparePox5EarlyExit);
  });
});
