import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';

import { Zec, Tzec } from '../../../../../src/impl/zec';

describe('Zec', function () {
  const coinName = 'tzec';
  let bitgo: BitGoAPI;
  let basecoin;

  before(function () {
    bitgo = new BitGoAPI({ env: 'mock' });
    bitgo.register('zec', Zec.createInstance);
    bitgo.register('tzec', Tzec.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    assert.ok(bitgo.coin('tzec') instanceof Tzec);
    assert.ok(bitgo.coin('zec') instanceof Zec);
  });

  it('should return tzec', function () {
    assert.strictEqual(basecoin.getChain(), 'tzec');
  });

  it('should return full name', function () {
    assert.strictEqual(basecoin.getFullName(), 'Testnet ZCash');
  });
});
