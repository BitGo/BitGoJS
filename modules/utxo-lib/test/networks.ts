import * as assert from 'assert';
import {
  getMainnet,
  getNetworkList,
  getNetworkName,
  getTestnet,
  isBitcoin,
  isBitcoinCash,
  isECash,
  isBitcoinGold,
  isBitcoinSV,
  isDogecoin,
  isLitecoin,
  isMainnet,
  isSameCoin,
  isTestnet,
  isValidNetwork,
  isZcash,
  Network,
  networks,
  supportsSegwit,
  supportsTaproot,
} from '../src/networks';

describe('networks', function () {
  // Ideally, all properties for all coins should be distinct.
  // However, there are some exceptions and some networks share the same properties.

  // Here we define some groups of networks that are allowed to share properties.
  const bitcoinSharedMessagePrefix = (network) => isBitcoin(network) || isBitcoinCash(network) || isBitcoinSV(network);

  const bitcoinMainnetSharedPubkeyPrefix = (network) =>
    isMainnet(network) && (isBitcoin(network) || isBitcoinCash(network) || isECash(network) || isBitcoinSV(network));

  const bitcoinMainnetSharedScriptPrefix = (network) => bitcoinMainnetSharedPubkeyPrefix(network);

  const bitcoinTestnetSharedPubkeyPrefix = (network) =>
    isTestnet(network) &&
    (isBitcoin(network) ||
      isBitcoinCash(network) ||
      isECash(network) ||
      isBitcoinGold(network) ||
      isBitcoinSV(network) ||
      isLitecoin(network));

  const bitcoinTestnetSharedScriptPrefix = (network) =>
    isTestnet(network) &&
    (isBitcoin(network) ||
      isBitcoinCash(network) ||
      isECash(network) ||
      isBitcoinGold(network) ||
      isBitcoinSV(network) ||
      isDogecoin(network));

  const bitcoinMainnetSharedWIFPrefix = (network) =>
    isMainnet(network) &&
    (isBitcoin(network) ||
      isBitcoinCash(network) ||
      isECash(network) ||
      isBitcoinGold(network) ||
      isBitcoinSV(network) ||
      isZcash(network));

  const bitcoinTestnetSharedWIFPrefix = (network) => isTestnet(network) && !isDogecoin(network);

  const bech32Coins = (network) => isBitcoin(network) || isBitcoinGold(network) || isLitecoin(network);

  const sameGroup = (group, network, otherNetwork) => group(network) && group(otherNetwork);

  describe('getNetworkList()', function () {
    it('mainnets are sorted alphabetically', function () {
      const mainnets = getNetworkList().filter(isMainnet);
      const sortedMainnets = [...mainnets].sort((a, b) =>
        (getNetworkName(a) as string).localeCompare(getNetworkName(b) as string)
      );
      assert.deepStrictEqual(mainnets, sortedMainnets);
    });

    it('testnet(s) follow mainnets', function () {
      const list = getNetworkList();
      while (list.length > 0) {
        // first element is a mainnet
        const mainnet = list.shift();
        assert.strict(mainnet);
        assert.strictEqual(isMainnet(mainnet), true);

        // subsequent entries are testnets
        while (list.length > 0 && isTestnet(list[0])) {
          assert.strictEqual(getMainnet(list[0]), mainnet);
          list.shift();
        }
      }
    });
  });

  describe('Features', function () {
    it('have expected values for networks', function () {
      assert.deepStrictEqual(
        getNetworkList().map((n) => [getNetworkName(n), supportsSegwit(n), supportsTaproot(n)]),
        [
          ['bitcoin', true, true],
          ['testnet', true, true],
          ['bitcoincash', false, false],
          ['bitcoincashTestnet', false, false],
          ['bitcoingold', true, false],
          ['bitcoingoldTestnet', true, false],
          ['bitcoinsv', false, false],
          ['bitcoinsvTestnet', false, false],
          ['dash', false, false],
          ['dashTest', false, false],
          ['dogecoin', false, false],
          ['dogecoinTest', false, false],
          ['ecash', false, false],
          ['ecashTest', false, false],
          ['litecoin', true, false],
          ['litecoinTest', true, false],
          ['zcash', false, false],
          ['zcashTest', false, false],
        ]
      );
    });
  });

  for (const name in networks) {
    const network: Network = networks[name];

    describe(`networks.${name}`, function () {
      it('is valid network', function () {
        assert(isValidNetwork(network));
      });

      it('getNetworkName() returns network name', function () {
        assert.strictEqual(name, getNetworkName(network));
      });

      it('has corresponding testnet/mainnet', function () {
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

      it('has expected properties', function () {
        assert.strictEqual(typeof network, 'object');
        assert.strictEqual(typeof network.messagePrefix, 'string');
        assert.strictEqual(typeof (network as any).bech32, bech32Coins(network) ? 'string' : 'undefined');
        assert.strictEqual(typeof network.bip32, 'object');
        assert.strictEqual(typeof network.pubKeyHash, 'number');
        assert.strictEqual(typeof network.scriptHash, 'number');
        assert.strictEqual(typeof network.wif, 'number');
        assert.strictEqual(typeof network.coin, 'string');

        if (isMainnet(network)) {
          assert.strictEqual(network.bip32.public, networks.bitcoin.bip32.public);
          assert.strictEqual(network.bip32.private, networks.bitcoin.bip32.private);
        } else {
          assert.strictEqual(network.bip32.public, networks.testnet.bip32.public);
          assert.strictEqual(network.bip32.private, networks.testnet.bip32.private);
        }
      });

      for (const otherName in networks) {
        const otherNetwork = networks[otherName];

        it('isSameCoin() returns true testnet/mainnet variants', function () {
          assert.strictEqual(
            isSameCoin(network, otherNetwork),
            otherNetwork === getMainnet(network) || otherNetwork === getTestnet(network)
          );

          assert.strictEqual(name === otherName, network === otherNetwork);
        });

        if (network === otherNetwork) {
          continue;
        }

        it(`has distinct properties with ${otherName}`, function () {
          assert.strictEqual(
            network.messagePrefix === otherNetwork.messagePrefix,
            isSameCoin(network, otherNetwork) || sameGroup(bitcoinSharedMessagePrefix, network, otherNetwork)
          );

          assert.strictEqual(
            network.pubKeyHash === otherNetwork.pubKeyHash,
            sameGroup(bitcoinMainnetSharedPubkeyPrefix, network, otherNetwork) ||
              sameGroup(bitcoinTestnetSharedPubkeyPrefix, network, otherNetwork)
          );

          assert.strictEqual(
            network.scriptHash === otherNetwork.scriptHash,
            sameGroup(bitcoinMainnetSharedScriptPrefix, network, otherNetwork) ||
              sameGroup(bitcoinTestnetSharedScriptPrefix, network, otherNetwork)
          );

          assert.strictEqual(
            network.wif === otherNetwork.wif,
            sameGroup(bitcoinMainnetSharedWIFPrefix, network, otherNetwork) ||
              sameGroup(bitcoinTestnetSharedWIFPrefix, network, otherNetwork)
          );
        });
      }
    });
  }
});
