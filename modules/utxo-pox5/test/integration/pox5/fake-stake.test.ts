import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';

import { derivePox5FakeStakeMaterials } from './fake-stake';

describe('PoX-5 fake-stake test key derivation', function () {
  it('derives reproducible, purpose- and network-separated materials from the wallet passphrase', function () {
    const network = utxolib.networks.testnet;
    const first = derivePox5FakeStakeMaterials('test-only-wallet-passphrase', 'staging', 'tbtcstx', network);
    const repeated = derivePox5FakeStakeMaterials('test-only-wallet-passphrase', 'staging', 'tbtcstx', network);
    const otherNetwork = derivePox5FakeStakeMaterials(
      'test-only-wallet-passphrase',
      'staging',
      'tbtcstxprivate1',
      network
    );

    assert.deepEqual(repeated.principalPreimage, first.principalPreimage);
    assert.deepEqual(repeated.earlyExitKey.publicKey, first.earlyExitKey.publicKey);
    assert.notDeepEqual(otherNetwork.principalPreimage, first.principalPreimage);
    assert.notDeepEqual(otherNetwork.earlyExitKey.publicKey, first.earlyExitKey.publicKey);
  });
});
