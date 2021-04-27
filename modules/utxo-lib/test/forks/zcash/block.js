/* global describe, it, beforeEach */

const assert = require('assert')
const {
  Block,
  networks
} = require('../../..')

const fixtures = require('../../fixtures/forks/zcash/block_custom')

describe('Block (zcash)', function () {
  describe('fromBuffer/fromHex', function () {
    fixtures.valid.forEach(function (f) {
      it('imports ' + f.description, function () {
        var block = Block.fromHex(f.hex, networks.zcashTest)

        assert.strictEqual(block.version, f.version)
        assert.strictEqual(block.prevHash.reverse().toString('hex'), f.prevHash)
        assert.strictEqual(block.merkleRoot.reverse().toString('hex'), f.merkleRoot)
        assert.strictEqual(block.timestamp, f.timestamp)
        assert.strictEqual(block.bits, parseInt(f.bits, 16))
        assert.strictEqual(block.nonce.reverse().toString('hex'), f.nonce)
        assert.strictEqual(block.finalSaplingRoot.reverse().toString('hex'), f.finalSaplingRoot)
        assert.strictEqual(block.solutionSize, f.solutionSize)
        assert.strictEqual(block.solution.toString('hex'), f.solution)

        assert.strictEqual(block.transactions.length, f.transactions.length)
        for (var t = 0; t < f.transactions.length; t++) {
          assert.strictEqual(block.transactions[t].ins.length, f.transactions[t].ins.length)
          assert.strictEqual(block.transactions[t].outs.length, f.transactions[t].outs.length)

          for (var i = 0; i < f.transactions[t].ins.length; i++) {
            assert.strictEqual(block.transactions[t].ins[i].hash.toString('hex'), f.transactions[t].ins[i].hash)
          }
          for (var o = 0; o < f.transactions[t].outs.length; o++) {
            assert.strictEqual(block.transactions[t].outs[o].value, f.transactions[t].outs[o].value)
          }
        }
      })
    })
  })

  describe('toBuffer/toHex', function () {
    fixtures.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, networks.zcashTest)
      })

      it('exports ' + f.description, function () {
        assert.strictEqual(block.toHex(true), f.hex.slice(0, Block.ZCASH_HEADER_BYTE_SIZE * 2))
        assert.strictEqual(block.toHex(), f.hex)
      })
    })
  })

  describe('getHash/getId', function () {
    fixtures.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, networks.zcashTest)
      })

      it('returns ' + f.id + ' for ' + f.description, function () {
        assert.strictEqual(block.getHash().reverse().toString('hex'), f.hash)
        assert.strictEqual(block.getId(), f.id)
      })
    })
  })

  describe('getUTCDate', function () {
    fixtures.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, networks.zcashTest)
      })

      it('returns UTC date of ' + f.id, function () {
        var utcDate = block.getUTCDate().getTime()

        assert.strictEqual(utcDate, f.timestamp * 1e3)
      })
    })
  })

  describe('calculateMerkleRoot', function () {
    fixtures.valid.forEach(function (f) {
      if (f.hex.length === 160) return

      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, networks.zcashTest)
      })

      it('returns ' + f.merkleRoot + ' for ' + f.id, function () {
        assert.strictEqual(Block.calculateMerkleRoot(block.transactions).reverse().toString('hex'), f.merkleRoot)
      })
    })
  })

  describe('checkMerkleRoot', function () {
    fixtures.valid.forEach(function (f) {
      if (f.hex.length === 160) return

      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, networks.zcashTest)
      })

      it('Zcash returns ' + f.valid + ' for ' + f.id, function () {
        assert.strictEqual(block.checkMerkleRoot(), true)
      })
    })
  })

  describe('checkProofOfWork', function () {
    fixtures.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, networks.zcashTest)
      })

      it('Zcash returns ' + f.valid + ' for ' + f.id, function () {
        assert.strictEqual(block.checkProofOfWork(), f.valid)
      })
    })
  })
})
