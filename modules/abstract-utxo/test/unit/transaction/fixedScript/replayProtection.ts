import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor, utxolibCompat } from '@bitgo/wasm-utxo';

import {
  getReplayProtectionAddresses,
  pubkeyProd,
  pubkeyTestnet,
} from '../../../../src/transaction/fixedScript/replayProtection';

function createReplayProtectionOutputScript(pubkey: Buffer): Buffer {
  const descriptor = Descriptor.fromString(`sh(pk(${pubkey.toString('hex')}))`, 'definite');
  return Buffer.from(descriptor.scriptPubkey());
}

describe('replayProtection', function () {
  it('should have scriptPubKeys that match descriptor computation', function () {
    for (const pubkey of [pubkeyProd, pubkeyTestnet]) {
      const network = pubkey === pubkeyProd ? utxolib.networks.bitcoincash : utxolib.networks.bitcoincashTestnet;
      const expectedScript = createReplayProtectionOutputScript(pubkey);
      const actualAddresses = getReplayProtectionAddresses(network);
      assert.equal(actualAddresses.length, 1);
      const actualScript = Buffer.from(utxolibCompat.toOutputScript(actualAddresses[0], network));
      assert.deepStrictEqual(actualScript, expectedScript);
    }
  });
});
