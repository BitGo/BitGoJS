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

  const bitcoinTestnetSharedWIFPrefix = [
    'testnet',
    'bitcoincashTestnet',
    'bitcoinsvTestnet',
    'dashTest',
    'zcashTest'
  ]

  // FIXME(BG-16466): this is a bug, they should be distinct
  const litecoinSharedWIFPrefix = [
    'litecoin',
    'litecoinTest'
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

      it('has expected properties', function () {
        assert.strictEqual(typeof network, 'object')
        assert.strictEqual(typeof network.messagePrefix, 'string')
        assert.strictEqual(typeof network.bech32, bech32Coins.includes(name) ? 'string' : 'undefined')
        assert.strictEqual(typeof network.bip32, 'object')
        assert.strictEqual(typeof network.pubKeyHash, 'number')
        assert.strictEqual(typeof network.scriptHash, 'number')
        assert.strictEqual(typeof network.wif, 'number')
        assert.strictEqual(typeof network.coin, 'string')
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
            sameGroup(bitcoinTestnetSharedWIFPrefix, name, otherName) ||
            // FIXME(BG-16466): this group should not exist
            sameGroup(litecoinSharedWIFPrefix, name, otherName)
          )
        })
      }
    })
  }
})
