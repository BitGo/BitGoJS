import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Bsv, Tbsv } from '../../../../../src/impl/bsv';

describe('Bsv', function () {
  const coinName = 'tbsv';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('bsv', Bsv.createInstance);
    bitgo.safeRegister('tbsv', Tbsv.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    assert.ok(bitgo.coin('tbsv') instanceof Tbsv);
    assert.ok(bitgo.coin('bsv') instanceof Bsv);
  });

  it('should return tbsv', function () {
    assert.strictEqual(basecoin.getChain(), 'tbsv');
  });

  it('should return full name', function () {
    assert.strictEqual(basecoin.getFullName(), 'Testnet Bitcoin SV');
  });
});
