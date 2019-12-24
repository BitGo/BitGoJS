/* global describe, it */

const assert = require('assert')

const {
  networks,
  Transaction
} = require('../../../src')

var fixtures = require('../../fixtures/forks/dashTest/transaction')

describe('Transaction', function () {
  describe('fromBuffer/fromHex for Testnet Dash', function () {
    fixtures.valid.forEach(function (testData) {
      it('imports ' + testData.description, function () {
        const tx = Transaction.fromHex(testData.hex, networks.dashTest)
        assert.equal(tx.version, testData.version)
        if (tx.versionSupportsDashSpecialTransactions()) {
          assert.equal(tx.type, testData.type)
        }
        assert.equal(tx.locktime, testData.locktime)
        assert.equal(tx.ins.length, testData.vin.length)
        assert.equal(tx.outs.length, testData.vout.length)
        if (tx.isDashSpecialTransaction()) {
          assert.equal(tx.extraPayload.toString('hex'), testData.extraPayload)
        }
      })
    })

    fixtures.valid.forEach(function (testData) {
      it('exports ' + testData.description, function () {
        const tx = Transaction.fromHex(testData.hex, networks.dashTest)
        const hexTx = tx.toHex()
        assert.equal(testData.hex, hexTx)
      })
    })

    fixtures.valid.forEach(function (testData) {
      it('clone ' + testData.description, function () {
        const tx = Transaction.fromHex(testData.hex, networks.dashTest)
        const clonedTx = tx.clone()
        assert.equal(clonedTx.toHex(), testData.hex)
      })
    })
  })

  describe('getPrevoutHash', function () {
    fixtures.valid.filter(f => !!f.proRegTx).forEach(function (testData) {
      it('produces the correct inputsHash on ' + testData.description, function () {
        const tx = Transaction.fromHex(testData.hex, networks.dashTest)
        assert.equal(tx.getPrevoutHash(Transaction.SIGHASH_ALL).reverse().toString('hex'), testData.proRegTx.inputsHash)
      })
    })
  })
})
