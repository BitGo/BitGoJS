import assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import { importMacaroon } from 'macaroon';

import {
  addIPCaveatToMacaroon,
  createWatchOnly,
  getLightningNetwork,
  getUtxolibNetwork,
  getUtxolibNetworkName,
  isLightningCoinName,
  isValidLightningNetwork,
  isValidLightningNetworkName,
} from '../../../../src';
import { accounts, signerRootKey } from './createWatchOnlyFixture';
import { networks } from '@bitgo/utxo-lib';

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

      it(`getUtxolibNetwork`, function () {
        assert.strictEqual(
          getUtxolibNetwork(name),
          networkName === 'bitcoin' ? utxolib.networks.bitcoin : utxolib.networks.testnet
        );
      });

      it(`isLightningCoinName`, function () {
        assert.strictEqual(isLightningCoinName(name), true);
        assert.strictEqual(isLightningCoinName('ltc'), false);
      });
    });
  });

  it(`isValidLightningNetworkName should return false for non lightning network name`, function () {
    assert.strictEqual(isValidLightningNetworkName('litecoin'), false);
  });

  it(`isValidLightningNetwork should return false for non lightning network`, function () {
    assert.strictEqual(isValidLightningNetwork(utxolib.networks['litecoin']), false);
  });

  it(`getUtxolibNetworkName should return undefined for non lightning coin`, function () {
    assert.strictEqual(getUtxolibNetworkName('ltc'), undefined);
  });

  it(`getUtxolibNetwork should return fail for invalid lightning coin`, function () {
    assert.throws(() => {
      getUtxolibNetwork('ltc');
    }, /invalid lightning network/);
  });

  it(`createWatchOnly`, function () {
    const watchOnly = createWatchOnly(signerRootKey, networks.testnet);
    assert.deepStrictEqual(watchOnly.accounts, accounts);
    assert.strictEqual(
      watchOnly.master_key_fingerprint,
      utxolib.bip32.fromBase58(signerRootKey, networks.testnet).fingerprint.toString('hex')
    );
  });

  it(`addIPCaveatToMacaroon`, function () {
    const macaroon =
      'AgEDbG5kAvgBAwoQMgU7rDi802Yqg/tHll24nhIBMBoWCgdhZGRyZXNzEgRyZWFkEgV3cml0ZRoTCgRpbmZvEgRyZWFkEgV3cml0ZRoXCghpbnZvaWNlcxIEcmVhZBIFd3JpdGUaIQoIbWFjYXJvb24SCGdlbmVyYXRlEgRyZWFkEgV3cml0ZRoWCgdtZXNzYWdlEgRyZWFkEgV3cml0ZRoXCghvZmZjaGFpbhIEcmVhZBIFd3JpdGUaFgoHb25jaGFpbhIEcmVhZBIFd3JpdGUaFAoFcGVlcnMSBHJlYWQSBXdyaXRlGhgKBnNpZ25lchIIZ2VuZXJhdGUSBHJlYWQAAAYgZKiUvEzxGd2QKGUS+9R5ZWevG09S06fMJUnt+k1XXXQ=';
    const macaroonObj = importMacaroon(macaroon).exportJSON();
    assert.strictEqual(macaroonObj.c, undefined);
    const macaroonWithCaveat = addIPCaveatToMacaroon(macaroon, '127.0.0.1');
    const macaroonObjWithCaveat = importMacaroon(macaroonWithCaveat).exportJSON();
    assert.strictEqual(macaroonObjWithCaveat.c[0].i, 'ipaddr 127.0.0.1');
  });
});
