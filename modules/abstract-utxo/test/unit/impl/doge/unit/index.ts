import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Doge, Tdoge } from '../../../../../src/impl/doge';

describe('Doge', function () {
  const coinName = 'tdoge';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('doge', Doge.createInstance);
    bitgo.safeRegister('tdoge', Tdoge.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    assert.ok(bitgo.coin('tdoge') instanceof Tdoge);
    assert.ok(bitgo.coin('doge') instanceof Doge);
  });

  it('should return tdoge', function () {
    assert.strictEqual(basecoin.getChain(), 'tdoge');
  });

  it('should return full name', function () {
    assert.strictEqual(basecoin.getFullName(), 'Testnet Dogecoin');
  });
});
