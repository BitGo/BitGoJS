import assert from 'node:assert/strict';

import * as utxolib from '@bitgo/utxo-lib';

import {
  getReplayProtectionPubkeys,
  getReplayProtectionAddresses,
} from '../../../../src/transaction/fixedScript/replayProtection';

describe('replayProtection', function () {
  for (const network of utxolib.getNetworkList()) {
    const networkName = utxolib.getNetworkName(network);
    assert(networkName, 'network name is required');

    describe(`${networkName}`, function () {
      if (
        utxolib.getMainnet(network) === utxolib.networks.bitcoincash ||
        utxolib.getMainnet(network) === utxolib.networks.bitcoinsv
      ) {
        it('should have keys that correspond to addresses via p2shP2pk', function () {
          const actualAddressesDefault = getReplayProtectionAddresses(network, 'default');

          switch (network) {
            case utxolib.networks.bitcoincash:
            case utxolib.networks.bitcoinsv:
              assert.deepStrictEqual(actualAddressesDefault, ['33p1q7mTGyeM5UnZERGiMcVUkY12SCsatA']);
              break;
            case utxolib.networks.bitcoincashTestnet:
            case utxolib.networks.bitcoinsvTestnet:
              assert.deepStrictEqual(actualAddressesDefault, ['2MuMnPoSDgWEpNWH28X2nLtYMXQJCyT61eY']);
              break;
            default:
              throw new Error(`illegal state`);
          }

          if (utxolib.getMainnet(network) !== utxolib.networks.bitcoincash) {
            return;
          }

          const actualAddressesCashaddr = getReplayProtectionAddresses(network, 'cashaddr');
          switch (network) {
            case utxolib.networks.bitcoincash:
              assert.deepStrictEqual(actualAddressesCashaddr, [
                'bitcoincash:pqt5x9w0m6z0f3znjkkx79wl3l7ywrszesemp8xgpf',
              ]);
              break;
            case utxolib.networks.bitcoincashTestnet:
              assert.deepStrictEqual(actualAddressesCashaddr, ['bchtest:pqtjmnzwqffkrk2349g3cecfwwjwxusvnq87n07cal']);
              break;
            default:
              throw new Error(`illegal state`);
          }
        });
      } else {
        it('should have no replay protection', function () {
          assert.deepEqual(getReplayProtectionPubkeys(network), []);
          assert.deepEqual(getReplayProtectionAddresses(network), []);
        });
      }
    });
  }
});
