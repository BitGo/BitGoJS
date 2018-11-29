/* global describe, it, beforeEach */

var assert = require('assert')
var Block = require('../src/block')
var NETWORKS = require('../src/networks')

var fixtures = require('./fixtures/block')

describe('Block', function () {
  describe('version', function () {
    it('should be interpreted as an int32le', function () {
      var blockHex = 'ffffffff0000000000000000000000000000000000000000000000000000000000000000414141414141414141414141414141414141414141414141414141414141414101000000020000000300000000'
      var block = Block.fromHex(blockHex)
      assert.equal(-1, block.version)
      assert.equal(1, block.timestamp)
    })
  })

  describe('calculateTarget', function () {
    fixtures.targets.forEach(function (f) {
      it('returns ' + f.expected + ' for 0x' + f.bits, function () {
        var bits = parseInt(f.bits, 16)

        assert.equal(Block.calculateTarget(bits).toString('hex'), f.expected)
      })
    })
  })

  describe('fromBuffer/fromHex', function () {
    fixtures.valid.forEach(function (f) {
      it('imports ' + f.description, function () {
        var block = Block.fromHex(f.hex)

        assert.strictEqual(block.version, f.version)
        assert.strictEqual(block.prevHash.toString('hex'), f.prevHash)
        assert.strictEqual(block.merkleRoot.toString('hex'), f.merkleRoot)
        assert.strictEqual(block.timestamp, f.timestamp)
        assert.strictEqual(block.bits, f.bits)
        assert.strictEqual(block.nonce, f.nonce)
        assert.strictEqual(!block.transactions, f.hex.length === 160)
      })
    })

    fixtures.invalid.forEach(function (f) {
      it('throws on ' + f.exception, function () {
        assert.throws(function () {
          Block.fromHex(f.hex)
        }, new RegExp(f.exception))
      })
    })

    fixtures.zcash.valid.forEach(function (f) {
      it('Zcash imports ' + f.description, function () {
        var block = Block.fromHex(f.hex, NETWORKS.zcashTest)

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
        block = Block.fromHex(f.hex)
      })

      it('exports ' + f.description, function () {
        assert.strictEqual(block.toHex(true), f.hex.slice(0, 160))
        assert.strictEqual(block.toHex(), f.hex)
      })
    })

    fixtures.zcash.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, NETWORKS.zcashTest)
      })

      it('Zcash exports ' + f.description, function () {
        assert.strictEqual(block.toHex(true), f.hex.slice(0, Block.ZCASH_HEADER_BYTE_SIZE * 2))
        assert.strictEqual(block.toHex(), f.hex)
      })
    })
  })

  describe('getHash/getId', function () {
    fixtures.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex)
      })

      it('returns ' + f.id + ' for ' + f.description, function () {
        assert.strictEqual(block.getHash().toString('hex'), f.hash)
        assert.strictEqual(block.getId(), f.id)
      })
    })

    fixtures.zcash.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, NETWORKS.zcashTest)
      })

      it('Zcash returns ' + f.id + ' for ' + f.description, function () {
        assert.strictEqual(block.getHash().reverse().toString('hex'), f.hash)
        assert.strictEqual(block.getId(), f.id)
      })
    })
  })

  describe('getUTCDate', function () {
    fixtures.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex)
      })

      it('returns UTC date of ' + f.id, function () {
        var utcDate = block.getUTCDate().getTime()

        assert.strictEqual(utcDate, f.timestamp * 1e3)
      })
    })

    fixtures.zcash.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, NETWORKS.zcashTest)
      })

      it('Zcash returns UTC date of ' + f.id, function () {
        var utcDate = block.getUTCDate().getTime()

        assert.strictEqual(utcDate, f.timestamp * 1e3)
      })
    })
  })

  describe('calculateMerkleRoot', function () {
    it('should throw on zero-length transaction array', function () {
      assert.throws(function () {
        Block.calculateMerkleRoot([])
      }, /Cannot compute merkle root for zero transactions/)
    })

    fixtures.valid.forEach(function (f) {
      if (f.hex.length === 160) return

      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex)
      })

      it('returns ' + f.merkleRoot + ' for ' + f.id, function () {
        assert.strictEqual(Block.calculateMerkleRoot(block.transactions).toString('hex'), f.merkleRoot)
      })
    })

    fixtures.zcash.valid.forEach(function (f) {
      if (f.hex.length === 160) return

      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, NETWORKS.zcashTest)
      })

      it('Zcash returns ' + f.merkleRoot + ' for ' + f.id, function () {
        assert.strictEqual(Block.calculateMerkleRoot(block.transactions).reverse().toString('hex'), f.merkleRoot)
      })
    })
  })

  describe('checkMerkleRoot', function () {
    fixtures.valid.forEach(function (f) {
      if (f.hex.length === 160) return

      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex)
      })

      it('returns ' + f.valid + ' for ' + f.id, function () {
        assert.strictEqual(block.checkMerkleRoot(), true)
      })
    })

    fixtures.zcash.valid.forEach(function (f) {
      if (f.hex.length === 160) return

      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, NETWORKS.zcashTest)
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
        block = Block.fromHex(f.hex)
      })

      it('returns ' + f.valid + ' for ' + f.id, function () {
        assert.strictEqual(block.checkProofOfWork(), f.valid)
      })
    })

    fixtures.zcash.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = Block.fromHex(f.hex, NETWORKS.zcashTest)
      })

      it('Zcash returns ' + f.valid + ' for ' + f.id, function () {
        assert.strictEqual(block.checkProofOfWork(), f.valid)
      })
    })
  })
})
