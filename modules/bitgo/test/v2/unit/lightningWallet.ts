import { strict as assert } from 'assert';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src';
import { Wallet } from '@bitgo/sdk-core';
import { getLightningWallet } from '@bitgo/abstract-lightning';

describe('LightningV2 Wallet:', function () {
  const bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
  bitgo.initializeTestVars();

  it('should allow lightningV2 wallets to be created for supported coins', function () {
    const lnbtcWallet = new Wallet(bitgo, bitgo.coin('lnbtc'), {
      id: '123',
      coin: 'lnbtc',
      subType: 'lightningCustody',
    });

    const tlntcWallet = new Wallet(bitgo, bitgo.coin('tlnbtc'), {
      id: '123',
      coin: 'tlntc',
      subType: 'lightningCustody',
    });

    assert(getLightningWallet(lnbtcWallet), 'lnbtc wallet should support lightningV2');
    assert(getLightningWallet(tlntcWallet), 'tlnbtc wallet should support lightningV2');
  });

  it('should throw error when creating lightningV2 wallet for unsupported coins', function () {
    const btcWallet = new Wallet(bitgo, bitgo.coin('btc'), {
      id: '123',
      coin: 'btc',
    });

    assert.throws(() => {
      getLightningWallet(btcWallet);
    }, /Error: invalid coin for lightning wallet: btc/);
  });
});
