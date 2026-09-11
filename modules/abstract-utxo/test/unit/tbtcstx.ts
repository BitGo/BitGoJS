import assert from 'assert';

import { Networks } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

import { Tbtcstx } from '../../src';

import { defaultBitGo, getNetworkForCoinName } from './util';

describe('tbtcstx', function () {
  const coin = Tbtcstx.createInstance(defaultBitGo);

  it('uses the public coin name with the testnet utxolib network', function () {
    assert.strictEqual(coin.getChain(), 'tbtcstx');
    assert.strictEqual(coin.wasmName, 'tbtcreg');
    assert.strictEqual(Networks.test.bitcoinStx.utxolibName, 'testnet');
    assert.strictEqual(getNetworkForCoinName(coin.name), utxolib.networks.testnet);
  });

  it('encodes and decodes private-1 addresses through the tbtcreg codec', function () {
    const script = Buffer.from(`0014${'11'.repeat(20)}`, 'hex');
    const address = coin.addressCodec.encode(script);

    assert.match(address, /^bcrt1q/);
    assert.deepStrictEqual(Buffer.from(coin.addressCodec.decode(address)), script);
    assert.strictEqual(coin.isValidAddress(address), true);
  });
});
