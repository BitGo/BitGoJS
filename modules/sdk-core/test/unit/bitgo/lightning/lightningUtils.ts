import assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';

import {
  getLightningNetwork,
  getUtxolibNetworkName,
  isValidLightningNetwork,
  isValidLightningNetworkName,
} from '../../../../src/bitgo/lightning';

describe('lightning utils', function () {
  [
    { name: 'lnbtc', networkName: 'bitcoin' },
    { name: 'tlnbtc', networkName: 'testnet' },
  ].forEach(({ name, networkName }) => {
    describe(`success - coin ${name} and network ${networkName}`, function () {
      it(`isValidLightningNetworkName and getLightningNetwork`, function () {
        assert(isValidLightningNetworkName(networkName));
        const network = getLightningNetwork(networkName);
        assert.strictEqual(network, utxolib.networks[networkName]);
      });

      it(`isValidLightningNetwork`, function () {
        assert(isValidLightningNetworkName(networkName));
        assert(isValidLightningNetwork(utxolib.networks[networkName]));
      });

      it(`getUtxolibNetworkName`, function () {
        assert.strictEqual(getUtxolibNetworkName(name), networkName);
      });
    });
  });

  it(`isValidLightningNetworkName should return false for non lightning network name`, function () {
    assert.strictEqual(isValidLightningNetworkName('litecoin'), false);
  });

  it(`isValidLightningNetwork should return false for non lightning network`, function () {
    assert.strictEqual(isValidLightningNetwork(utxolib.networks['litecoin']), false);
  });

  it(`isValidLightningNetwork should return undefined for non lightning coin`, function () {
    assert.strictEqual(getUtxolibNetworkName('ltc'), undefined);
  });
});
