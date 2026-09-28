import assert from 'assert';

import { Networks } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

import { Tbtcstxsignet } from '../../src';

import { defaultBitGo, getNetworkForCoinName } from './util';

describe('tbtcstxsignet', function () {
  const coin = Tbtcstxsignet.createInstance(defaultBitGo);

  it('uses the public coin name with the public signet utxolib network', function () {
    assert.strictEqual(coin.getChain(), 'tbtcstxsignet');
    assert.strictEqual(coin.getFullName(), 'Stacks Bitcoin (Signet)');
    assert.strictEqual(coin.wasmName, 'tbtcsig');
    assert.strictEqual(Networks.test.bitcoinStxSignet.utxolibName, 'bitcoinPublicSignet');
    assert.strictEqual(getNetworkForCoinName(coin.name), utxolib.networks.bitcoinPublicSignet);
  });

  it('encodes and decodes signet addresses through the tbtcsig codec', function () {
    const script = Buffer.from(`0014${'11'.repeat(20)}`, 'hex');
    const address = coin.addressCodec.encode(script);

    assert.match(address, /^tb1q/);
    assert.deepStrictEqual(Buffer.from(coin.addressCodec.decode(address)), script);
    assert.strictEqual(coin.isValidAddress(address), true);
  });
});
