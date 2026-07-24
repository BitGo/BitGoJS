import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { BIP32 } from '@bitgo/wasm-utxo';
import { BaseCoin } from '@bitgo/sdk-core';

import { deriveKeyWithSeed } from '../../src/deriveKeyWithSeed';

// Deterministic test xprv — derived from a 32-byte all-ones seed.
const XPRV =
  'xprv9s21ZrQH143K2QPmabzR6Q9tkNRfFxy1jy9p1PRctypZJWAjtjWBJAxxvQ3454vPpnUoLfGH8YP5KcHFX4Z5Jh7bYnFuBhxztHRy72yXmnC';

const SEEDS = ['', 'hello', 'some long seed string with spaces', '\u{1F600}'];

describe('deriveKeyWithSeed', function () {
  for (const seed of SEEDS) {
    it(`matches BaseCoin.deriveKeyWithSeedBip32 for seed ${JSON.stringify(seed)}`, function () {
      const wasmKey = BIP32.fromBase58(XPRV);
      const utxolibKey = utxolib.bip32.fromBase58(XPRV);

      const wasmResult = deriveKeyWithSeed(wasmKey, seed);
      const sdkCoreResult = BaseCoin.deriveKeyWithSeedBip32(utxolibKey, seed);

      assert.strictEqual(wasmResult.derivationPath, sdkCoreResult.derivationPath);
      assert.strictEqual(
        Buffer.from(wasmResult.key.publicKey).toString('hex'),
        Buffer.from(sdkCoreResult.key.publicKey).toString('hex')
      );
    });
  }
});
