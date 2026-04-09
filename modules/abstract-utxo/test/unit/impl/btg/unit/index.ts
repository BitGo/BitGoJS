import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Btg } from '../../../../../src/impl/btg';

describe('Btg', function () {
  const coinName = 'btg';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('btg', Btg.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    basecoin = bitgo.coin('btg');
    assert.ok(basecoin instanceof Btg);
  });

  it('should return btg', function () {
    assert.strictEqual(basecoin.getChain(), 'btg');
  });

  it('should return full name', function () {
    assert.strictEqual(basecoin.getFullName(), 'Bitcoin Gold');
  });
});
