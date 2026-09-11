import assert from 'assert';

import { Networks } from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

import { Tbtcstxprivate1 } from '../../src';

import { defaultBitGo, getNetworkForCoinName } from './util';

describe('tbtcstxprivate1', function () {
  const coin = Tbtcstxprivate1.createInstance(defaultBitGo);

  it('uses the private-1 public coin name with the testnet utxolib network', function () {
    assert.strictEqual(coin.getChain(), 'tbtcstxprivate1');
    assert.strictEqual(coin.getFullName(), 'Stacks Bitcoin (Private-1 Regtest)');
    assert.strictEqual(coin.wasmName, 'tbtcreg');
    assert.strictEqual(Networks.test.bitcoinStxPrivate1.utxolibName, 'testnet');
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
