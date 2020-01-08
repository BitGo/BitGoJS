/* global describe, it */
const assert = require('assert')

const { networks, coins } = require('../src')

describe('networks', function () {
  // Ideally, all properties for all coins should be distinct.
  // However, there are some exceptions and some networks share the same properties.

  // Here we define some groups of networks that are allowed to share properties.
  const bitcoinSharedMessagePrefix = [
    'bitcoin', 'testnet',
    'bitcoincash', 'bitcoincashTestnet',
    'bitcoinsv', 'bitcoinsvTestnet'
  ]

  const bitcoinMainnetSharedPubkeyPrefix = [
    'bitcoin',
    'bitcoincash',
    'bitcoinsv'
  ]

  const bitcoinMainnetSharedScriptPrefix = bitcoinMainnetSharedPubkeyPrefix.filter(() => true)

  const bitcoinTestnetSharedPubkeyPrefix = [
    'testnet',
    'bitcoincashTestnet',
    'bitcoinsvTestnet',
    'litecoinTest'
  ]

  const bitcoinTestnetSharedScriptPrefix = bitcoinTestnetSharedPubkeyPrefix.filter(n => n !== 'litecoinTest')

  const bitcoinMainnetSharedWIFPrefix = [
    'bitcoin',
    'bitcoincash',
    'bitcoingold',
    'bitcoinsv',
    'zcash'
  ]

  const bech32Coins = [
    'bitcoin', 'testnet',
    'bitcoingold',
    'litecoin', 'litecoinTest'
  ]

  function sameGroup (group, name, otherName) {
    return group.includes(name) && group.includes(otherName)
  }

  for (const name in networks) {
    const network = networks[name]

    describe(`networks.${name}`, function () {
      it('is valid network', function () {
        assert(coins.isValidNetwork(network))
      })

      it('getNetworkName() returns network name', function () {
        assert.strictEqual(name, coins.getNetworkName(network))
      })

      it('has corresponding testnet/mainnet', function () {
        if (coins.isMainnet(network)) {
          assert.strictEqual(coins.isTestnet(network), false)
          assert.strictEqual(coins.getMainnet(network), network)
          assert.strictEqual(
            typeof coins.getTestnet(network),
            (network === networks.bitcoingold) ? 'undefined' : 'object'
          )
        } else {
          assert.strictEqual(coins.isMainnet(network), false)
          assert.strictEqual(coins.getTestnet(network), network)
          assert.notStrictEqual(coins.getMainnet(network), network)
          assert.strictEqual(typeof coins.getMainnet(network), 'object')
        }
      })

      it('has expected properties', function () {
        assert.strictEqual(typeof network, 'object')
        assert.strictEqual(typeof network.messagePrefix, 'string')
        assert.strictEqual(typeof network.bech32, bech32Coins.includes(name) ? 'string' : 'undefined')
        assert.strictEqual(typeof network.bip32, 'object')
        assert.strictEqual(typeof network.pubKeyHash, 'number')
        assert.strictEqual(typeof network.scriptHash, 'number')
        assert.strictEqual(typeof network.wif, 'number')
        assert.strictEqual(typeof network.coin, 'string')

        // FIXME(BG-16466): litecoin should not be a special case here -- all forks have the same bip32 values
        const isLitecoin = coins.getMainnet(network) === networks.litecoin

        if (coins.isMainnet(network)) {
          assert.strictEqual(
            (network.bip32.public === networks.bitcoin.bip32.public), !isLitecoin
          )
          assert.strictEqual(
            (network.bip32.private === networks.bitcoin.bip32.private), !isLitecoin
          )
        } else {
          assert.strictEqual(
            (network.bip32.public === networks.testnet.bip32.public), !isLitecoin
          )
          assert.strictEqual(
            (network.bip32.private === networks.testnet.bip32.private), !isLitecoin
          )
        }
      })

      for (const otherName in networks) {
        if (name === otherName) {
          continue
        }

        it(`has distinct properties with ${otherName}`, function () {
          const otherNetwork = networks[otherName]

          assert.strictEqual(
            (network.messagePrefix === otherNetwork.messagePrefix),
            (network.coin === otherNetwork.coin) ||
            sameGroup(bitcoinSharedMessagePrefix, name, otherName)
          )

          assert.strictEqual(
            (network.pubKeyHash === otherNetwork.pubKeyHash),
            sameGroup(bitcoinMainnetSharedPubkeyPrefix, name, otherName) ||
            sameGroup(bitcoinTestnetSharedPubkeyPrefix, name, otherName)
          )

          assert.strictEqual(
            (network.scriptHash === otherNetwork.scriptHash),
            sameGroup(bitcoinMainnetSharedScriptPrefix, name, otherName) ||
            sameGroup(bitcoinTestnetSharedScriptPrefix, name, otherName)
          )

          assert.strictEqual(
            (network.wif === otherNetwork.wif),
            sameGroup(bitcoinMainnetSharedWIFPrefix, name, otherName) ||
            (coins.isTestnet(network) && coins.isTestnet(otherNetwork))
          )
        })
      }
    })
  }
})
