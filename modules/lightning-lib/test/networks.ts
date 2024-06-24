import * as assert from 'assert';
import {
  getMainnet,
  getNetworkList,
  getNetworkName,
  getTestnet,
  isMainnet,
  isTestnet,
  isValidNetwork,
  isValidNetworkName,
  Network,
  networks,
} from '../src';

describe('networks', function () {
  it('getNetworkList()', function () {
    assert.deepEqual(getNetworkList(), Object.values(networks));
  });

  for (const name in networks) {
    assert(isValidNetworkName(name));
    const network: Network = networks[name];

    describe(`networks.${name}`, function () {
      it('isValidNetwork', function () {
        assert(isValidNetwork(network));
      });

      it('getNetworkName()', function () {
        assert.strictEqual(name, getNetworkName(network));
      });

      it('has respective testnet/mainnet', function () {
        if (isMainnet(network)) {
          assert.strictEqual(isTestnet(network), false);
          assert.strictEqual(getMainnet(network), network);
          assert.strictEqual(typeof getTestnet(network), 'object');
        } else {
          assert.strictEqual(isMainnet(network), false);
          assert.strictEqual(getTestnet(network), network);
          assert.notStrictEqual(getMainnet(network), network);
          assert.strictEqual(typeof getMainnet(network), 'object');
        }
      });
    });
  }
});
