import assert from 'assert';
import * as sinon from 'sinon';
import { importMacaroon } from 'macaroon';
import * as statics from '@bitgo/statics';
import * as utxolib from '@bitgo/utxo-lib';

import { accounts, signerRootKey } from './createWatchOnlyFixture';
import {
  isValidLightningNetworkName,
  getLightningNetwork,
  isValidLightningNetwork,
  getStaticsLightningNetwork,
  getUtxolibNetwork,
  isLightningCoinName,
  createWatchOnly,
  addIPCaveatToMacaroon,
  deriveLightningServiceSharedSecret,
} from './../../../../src/bitgo/lightning/lightningUtils';

import * as lightningUtils from '../../../../src/bitgo/lightning/lightningUtils';
import { getSharedSecret } from '../../../../src';

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

      it(`getStaticsLightningNetwork`, function () {
        assert.strictEqual(getStaticsLightningNetwork(name).family, 'lnbtc');
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

  it(`getUtxolibNetwork should return fail for invalid lightning coin`, function () {
    assert.throws(() => {
      getUtxolibNetwork('ltc');
    }, /ltc is not a lightning coin/);
  });

  it(`createWatchOnly`, function () {
    const watchOnly = createWatchOnly(signerRootKey, utxolib.networks.testnet);
    assert.deepStrictEqual(watchOnly.accounts, accounts);
    assert.strictEqual(
      watchOnly.master_key_fingerprint,
      utxolib.bip32.fromBase58(signerRootKey, utxolib.networks.testnet).fingerprint.toString('hex')
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

  it(`deriveLightningServiceSharedSecret`, function () {
    const userAuthXprv =
      'xprv9s21ZrQH143K4NPkV8riiTnFf72MRyQDVHMmmpekGF1w5QkS2MfTei9KXYvrZVMop4zQ4arnzSF7TRp3Cy73AWaDdADiYMCi5qpYW1bUa5m';
    const lightningServicePubKey = '03b6fe266b3f8ae110b877d942765e9cea9e82faf03cdbb6d0effe980b6371b9c2';
    const lightningServicePrvKey = '8b95613f4341e347743bd2625728d87bc6f0a119acb6ae9121afeee2b2a650f7';

    const coin = statics.coins.get('tlnbtc');
    assert(coin instanceof statics.LightningCoin);

    const getStaticsLightningNetworkStub = sinon.stub(lightningUtils, 'getStaticsLightningNetwork').returns({
      ...coin.network,
      lightningServicePubKey,
    });

    const secret = deriveLightningServiceSharedSecret('tlnbtc', userAuthXprv);
    getStaticsLightningNetworkStub.restore();

    const expectedSecret = getSharedSecret(
      Buffer.from(lightningServicePrvKey, 'hex'),
      utxolib.bip32.fromBase58(userAuthXprv).neutered()
    );

    assert.deepStrictEqual(secret, expectedSecret);
  });
});
