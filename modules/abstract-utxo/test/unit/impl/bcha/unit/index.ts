import assert from 'node:assert/strict';

import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';

import { Bcha, Tbcha } from '../../../../../src/impl/bcha';

describe('Bcha', function () {
  const coinName = 'tbcha';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('bcha', Bcha.createInstance);
    bitgo.safeRegister('tbcha', Tbcha.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    assert.ok(bitgo.coin('tbcha') instanceof Tbcha);
    assert.ok(bitgo.coin('bcha') instanceof Bcha);
  });

  it('should return tbcha', function () {
    assert.strictEqual(basecoin.getChain(), 'tbcha');
  });

  it('should return full name', function () {
    assert.strictEqual(basecoin.getFullName(), 'Testnet Bitcoin ABC');
  });

  it('should convert addresses', function () {
    const mainnetBasecoin = bitgo.coin('bcha');

    assert.strictEqual(
      mainnetBasecoin.canonicalAddress('38oymyUayu35QoLLKmc8CozbcHynH6Btkn', 'cashaddr'),
      'ecash:pp8pnl7k6y8g073cggczfh22xrprxut5hymhjkq3er'
    );
    assert.strictEqual(
      mainnetBasecoin.canonicalAddress('ecash:pp8pnl7k6y8g073cggczfh22xrprxut5hymhjkq3er'),
      '38oymyUayu35QoLLKmc8CozbcHynH6Btkn'
    );
    assert.strictEqual(
      basecoin.canonicalAddress('mzopZJiBCjeAHXkShhgxfRsALgrYt3kxNP', 'cashaddr'),
      'ectest:qrfekq9s0c8tcuh75wpcxqnyl5e7dhqk4gq6pjct44'
    );
    assert.strictEqual(
      basecoin.canonicalAddress('ectest:qrfekq9s0c8tcuh75wpcxqnyl5e7dhqk4gq6pjct44'),
      'mzopZJiBCjeAHXkShhgxfRsALgrYt3kxNP'
    );
  });
});
