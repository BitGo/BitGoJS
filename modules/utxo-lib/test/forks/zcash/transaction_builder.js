/* global describe, it */
const assert = require('assert')

const {
  networks,
  Transaction,
  TransactionBuilder
} = require('../../../src')

const fixtures = require('../../fixtures/forks/zcash/transaction_builder_custom')

describe('TransactionBuilder (zcash)', function () {
  fixtures.valid.fromTransaction.forEach(function (testData) {
    it('returns TransactionBuilder, with ' + testData.description, function () {
      var network = networks.zcash
      var tx = Transaction.fromHex(testData.hex, network)
      var txb = TransactionBuilder.fromTransaction(tx, network)

      assert.equal(txb.tx.version, testData.version)
      assert.equal(txb.tx.versionGroupId, testData.versionGroupId)
      assert.equal(txb.tx.overwintered, testData.overwintered)
      assert.equal(txb.tx.locktime, testData.locktime)
      assert.equal(txb.tx.expiryHeight, testData.expiryHeight)
      assert.equal(txb.tx.ins.length, testData.insLength)
      assert.equal(txb.tx.outs.length, testData.outsLength)
      assert.equal(txb.tx.joinsplits.length, testData.joinsplitsLength)
      assert.equal(txb.tx.joinsplitPubkey.length, testData.joinsplitPubkeyLength)
      assert.equal(txb.tx.joinsplitSig.length, testData.joinsplitSigLength)
    })

    it('throws if transaction builder network is incompatible for ' + testData.description, function () {
      var errorMessage = 'This transaction is incompatible with the transaction builder'
      var tx = Transaction.fromHex(testData.hex, networks.zcash)

      // Zcash transaction but different network
      assert.throws(function () {
        TransactionBuilder.fromTransaction(tx)
      }, new RegExp(errorMessage))

      assert.throws(function () {
        TransactionBuilder.fromTransaction(tx, networks.bitcoincash)
      }, new RegExp(errorMessage))

      assert.throws(function () {
        TransactionBuilder.fromTransaction(tx, networks.bitcoinsv)
      }, new RegExp(errorMessage))

      assert.throws(function () {
        TransactionBuilder.fromTransaction(tx, networks.bitcoingold)
      }, new RegExp(errorMessage))

      assert.throws(function () {
        TransactionBuilder.fromTransaction(tx, networks.bitcoin)
      }, new RegExp(errorMessage))

      assert.throws(function () {
        TransactionBuilder.fromTransaction(tx, networks.litecoin)
      }, new RegExp(errorMessage))

      assert.throws(function () {
        TransactionBuilder.fromTransaction(tx, networks.testnet)
      }, new RegExp(errorMessage))
    })
  })
})
