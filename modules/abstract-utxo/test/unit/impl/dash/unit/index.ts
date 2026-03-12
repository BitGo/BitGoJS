import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Dash, Tdash } from '../../../../../src/impl/dash';

describe('Dash', function () {
  const coinName = 'tdash';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('dash', Dash.createInstance);
    bitgo.safeRegister('tdash', Tdash.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    assert.ok(bitgo.coin('tdash') instanceof Tdash);
    assert.ok(bitgo.coin('dash') instanceof Dash);
  });

  it('should return tdash', function () {
    assert.strictEqual(basecoin.getChain(), 'tdash');
  });

  it('should return full name', function () {
    assert.strictEqual(basecoin.getFullName(), 'Testnet Dash');
  });
});
