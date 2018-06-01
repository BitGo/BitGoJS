/* global describe, it, beforeEach */

var assert = require('assert')
var bscript = require('../src/script')
var networks = require('../src/networks')
var fixtures = require('./fixtures/transaction')
var Transaction = require('../src/transaction')

describe('Transaction', function () {
  function fromRaw (raw, noWitness) {
    var tx = new Transaction()
    tx.version = raw.version
    tx.locktime = raw.locktime

    raw.ins.forEach(function (txIn, i) {
      var txHash = Buffer.from(txIn.hash, 'hex')
      var scriptSig

      if (txIn.data) {
        scriptSig = Buffer.from(txIn.data, 'hex')
      } else if (txIn.script) {
        scriptSig = bscript.fromASM(txIn.script)
      }

      tx.addInput(txHash, txIn.index, txIn.sequence, scriptSig)

      if (!noWitness && txIn.witness) {
        var witness = txIn.witness.map(function (x) {
          return Buffer.from(x, 'hex')
        })

        tx.setWitness(i, witness)
      }
    })

    raw.outs.forEach(function (txOut) {
      var script

      if (txOut.data) {
        script = Buffer.from(txOut.data, 'hex')
      } else if (txOut.script) {
        script = bscript.fromASM(txOut.script)
      }

      tx.addOutput(script, txOut.value)
    })

    return tx
  }

  describe('fromBuffer/fromHex', function () {
    function importExport (f) {
      var id = f.id || f.hash
      var txHex = f.hex || f.txHex

      it('imports ' + f.description + ' (' + id + ')', function () {
        var actual = Transaction.fromHex(txHex)

        assert.strictEqual(actual.toHex(), txHex)
      })

      if (f.whex) {
        it('imports ' + f.description + ' (' + id + ') as witness', function () {
          var actual = Transaction.fromHex(f.whex)

          assert.strictEqual(actual.toHex(), f.whex)
        })
      }
    }

    fixtures.valid.forEach(importExport)
    fixtures.hashForSignature.forEach(importExport)
    fixtures.hashForWitnessV0.forEach(importExport)

    fixtures.invalid.fromBuffer.forEach(function (f) {
      it('throws on ' + f.exception, function () {
        assert.throws(function () {
          Transaction.fromHex(f.hex)
        }, new RegExp(f.exception))
      })
    })

    it('.version should be interpreted as an int32le', function () {
      var txHex = 'ffffffff0000ffffffff'
      var tx = Transaction.fromHex(txHex)
      assert.equal(-1, tx.version)
      assert.equal(0xffffffff, tx.locktime)
    })
  })

  describe('fromBuffer/fromHex for Zcash', function () {
    fixtures.zcash.valid.forEach(function (testData) {
      it('imports ' + testData.description, function () {
        const tx = Transaction.fromHex(testData.hex, networks.zcashTest)
        assert.equal(tx.version, testData.version)
        assert.equal(tx.versionGroupId, testData.versionGroupId)
        assert.equal(tx.overwintered, testData.overwintered)
        assert.equal(tx.locktime, testData.locktime)
        assert.equal(tx.expiryHeight, testData.expiryHeight)
        assert.equal(tx.ins.length, testData.insLength)
        assert.equal(tx.outs.length, testData.outsLength)
        assert.equal(tx.joinsplits.length, testData.joinsplitsLength)
        assert.equal(tx.joinsplitPubkey.length, testData.joinsplitPubkeyLength)
        assert.equal(tx.joinsplitSig.length, testData.joinsplitSigLength)
      })
    })

    fixtures.zcash.valid.forEach(function (testData) {
      it('exports ' + testData.description, function () {
        const tx = Transaction.fromHex(testData.hex, networks.zcashTest)
        const hexTx = tx.toHex()
        assert.equal(testData.hex, hexTx)
      })
    })

    fixtures.zcash.valid.forEach(function (testData) {
      it('clone ' + testData.description, function () {
        const tx = Transaction.fromHex(testData.hex, networks.zcashTest)
        const clonedTx = tx.clone()
        assert.equal(clonedTx.toHex(), testData.hex)
      })
    })
  })

  describe('toBuffer/toHex', function () {
    fixtures.valid.forEach(function (f) {
      it('exports ' + f.description + ' (' + f.id + ')', function () {
        var actual = fromRaw(f.raw, true)
        assert.strictEqual(actual.toHex(), f.hex)
      })

      if (f.whex) {
        it('exports ' + f.description + ' (' + f.id + ') as witness', function () {
          var wactual = fromRaw(f.raw)
          assert.strictEqual(wactual.toHex(), f.whex)
        })
      }
    })

    it('accepts target Buffer and offset parameters', function () {
      var f = fixtures.valid[0]
      var actual = fromRaw(f.raw)
      var byteLength = actual.byteLength()

      var target = Buffer.alloc(byteLength * 2)
      var a = actual.toBuffer(target, 0)
      var b = actual.toBuffer(target, byteLength)

      assert.strictEqual(a.length, byteLength)
      assert.strictEqual(b.length, byteLength)
      assert.strictEqual(a.toString('hex'), f.hex)
      assert.strictEqual(b.toString('hex'), f.hex)
      assert.deepEqual(a, b)
      assert.deepEqual(a, target.slice(0, byteLength))
      assert.deepEqual(b, target.slice(byteLength))
    })
  })

  describe('hasWitnesses', function () {
    fixtures.valid.forEach(function (f) {
      it('detects if the transaction has witnesses: ' + (f.whex ? 'true' : 'false'), function () {
        assert.strictEqual(Transaction.fromHex(f.whex ? f.whex : f.hex).hasWitnesses(), !!f.whex)
      })
    })
  })

  describe('weight/virtualSize', function () {
    it('computes virtual size', function () {
      fixtures.valid.forEach(function (f) {
        var transaction = Transaction.fromHex(f.whex ? f.whex : f.hex)

        assert.strictEqual(transaction.virtualSize(), f.virtualSize)
      })
    })

    it('computes weight', function () {
      fixtures.valid.forEach(function (f) {
        var transaction = Transaction.fromHex(f.whex ? f.whex : f.hex)

        assert.strictEqual(transaction.weight(), f.weight)
      })
    })
  })

  describe('addInput', function () {
    var prevTxHash
    beforeEach(function () {
      prevTxHash = Buffer.from('ffffffff00ffff000000000000000000000000000000000000000000101010ff', 'hex')
    })

    it('returns an index', function () {
      var tx = new Transaction()
      assert.strictEqual(tx.addInput(prevTxHash, 0), 0)
      assert.strictEqual(tx.addInput(prevTxHash, 0), 1)
    })

    it('defaults to empty script, witness and 0xffffffff SEQUENCE number', function () {
      var tx = new Transaction()
      tx.addInput(prevTxHash, 0)

      assert.strictEqual(tx.ins[0].script.length, 0)
      assert.strictEqual(tx.ins[0].witness.length, 0)
      assert.strictEqual(tx.ins[0].sequence, 0xffffffff)
    })

    fixtures.invalid.addInput.forEach(function (f) {
      it('throws on ' + f.exception, function () {
        var tx = new Transaction()
        var hash = Buffer.from(f.hash, 'hex')

        assert.throws(function () {
          tx.addInput(hash, f.index)
        }, new RegExp(f.exception))
      })
    })
  })

  describe('addOutput', function () {
    it('returns an index', function () {
      var tx = new Transaction()
      assert.strictEqual(tx.addOutput(Buffer.alloc(0), 0), 0)
      assert.strictEqual(tx.addOutput(Buffer.alloc(0), 0), 1)
    })
  })

  describe('clone', function () {
    fixtures.valid.forEach(function (f) {
      var actual, expected

      beforeEach(function () {
        expected = Transaction.fromHex(f.hex)
        actual = expected.clone()
      })

      it('should have value equality', function () {
        assert.deepEqual(actual, expected)
      })

      it('should not have reference equality', function () {
        assert.notEqual(actual, expected)
      })
    })
  })

  describe('getHash/getId', function () {
    function verify (f) {
      it('should return the id for ' + f.id + '(' + f.description + ')', function () {
        var tx = Transaction.fromHex(f.whex || f.hex)

        assert.strictEqual(tx.getHash().toString('hex'), f.hash)
        assert.strictEqual(tx.getId(), f.id)
      })
    }

    fixtures.valid.forEach(verify)
  })

  describe('isCoinbase', function () {
    function verify (f) {
      it('should return ' + f.coinbase + ' for ' + f.id + '(' + f.description + ')', function () {
        var tx = Transaction.fromHex(f.hex)

        assert.strictEqual(tx.isCoinbase(), f.coinbase)
      })
    }

    fixtures.valid.forEach(verify)
  })

  describe('hashForSignature', function () {
    it('does not use Witness serialization', function () {
      var randScript = Buffer.from('6a', 'hex')

      var tx = new Transaction()
      tx.addInput(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), 0)
      tx.addOutput(randScript, 5000000000)

      var original = tx.__toBuffer
      tx.__toBuffer = function (a, b, c) {
        if (c !== false) throw new Error('hashForSignature MUST pass false')

        return original.call(this, a, b, c)
      }

      assert.throws(function () {
        tx.__toBuffer(undefined, undefined, true)
      }, /hashForSignature MUST pass false/)

      // assert hashForSignature does not pass false
      assert.doesNotThrow(function () {
        tx.hashForSignature(0, randScript, 1)
      })
    })

    fixtures.hashForSignature.forEach(function (f) {
      it('should return ' + f.hash + ' for ' + (f.description ? ('case "' + f.description + '"') : f.script), function () {
        var tx = Transaction.fromHex(f.txHex)
        var script = bscript.fromASM(f.script)

        assert.strictEqual(tx.hashForSignature(f.inIndex, script, f.type).toString('hex'), f.hash)
      })
    })
  })

  describe('hashForWitnessV0', function () {
    fixtures.hashForWitnessV0.forEach(function (f) {
      it('should return ' + f.hash + ' for ' + (f.description ? ('case "' + f.description + '"') : ''), function () {
        var tx = Transaction.fromHex(f.txHex)
        var script = bscript.fromASM(f.script)

        assert.strictEqual(tx.hashForWitnessV0(f.inIndex, script, f.value, f.type).toString('hex'), f.hash)
      })
    })
  })

  describe('setWitness', function () {
    it('only accepts a a witness stack (Array of Buffers)', function () {
      assert.throws(function () {
        (new Transaction()).setWitness(0, 'foobar')
      }, /Expected property "1" of type \[Buffer], got String "foobar"/)
    })
  })

  describe('test', function () {
    it('test', function () {
      var txHex = '030000807082c40302ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000b6004730440220797b00bbd7d1a4bf842c6a53653c1ab6c78d6d92a00ae69abef0a321ebe04a8902201765cba901a20438e538ab1c6a4f6fc7f71c69f7f8045ef31bcd35c60b88a0960100004c69522102c906a14ab17d556d369aae073e6b5574202156cc7c2759d98286dfe9c76ac1032102be8869ea63dc7106e8f7b63ae49f74993db3521dff615795e56378f736a0bca82103eb95ea6e1f0c554327f16bdb44f75598546e7e4267e3d03f280b4b1bd675ea5753aeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01000000b60047304402202621614762ef3d816c9fc751f381ffa046cfcecfb313e2920cc6ea1171503b4b022038a0e3cf938b7602490bab7fa996dfabfe64374fd4baa93cf692fb1bb74ec4cc0100004c69522102fe3abd28ca58a13eedf288ebc82fca4d5974e11d3e20d453a3e2bf533770821b21025ceec133b4955fe50f2e1f5dc5b5a3ffd80695d04d7e52d681d06c18d194c36a21024afed6b8d752bf75137e8b9b0fc931d9fec4e9d5abfedbaf978a60061ae31e3e53aeffffffff01102700000000000017a914ee721cc2a149e40e934c7b5ba5229778c1f595d887000000000000000000'
      var tx = Transaction.fromHex(txHex, networks.zcashTest)

    })
  })

  describe('hashForZcashSignature', function () {
    fixtures.hashForZcashSignature.valid.forEach(function (testData) {
      it('should return ' + testData.hash + ' for ' + testData.description, function () {
        var network = networks.zcash
        network.consensusBranchId = testData.branchId
        var tx = Transaction.fromHex(testData.txHex, network)
        var script = Buffer.from(testData.script, 'hex')
        var hash = Buffer.from(testData.hash, 'hex')
        hash.reverse()
        hash = hash.toString('hex')

        assert.strictEqual(
          tx.hashForZcashSignature(testData.inIndex, script, testData.value, testData.type).toString('hex'),
          hash)
      })
    })

    fixtures.hashForZcashSignature.invalid.forEach(function (testData) {
      it('should throw on ' + testData.description, function () {
        var tx = Transaction.fromHex(testData.txHex, networks.zcashTest)
        var script = Buffer.from(testData.script, 'hex')

        assert.throws(function () {
          tx.hashForZcashSignature(testData.inIndex, script, testData.value, testData.type)
        }, new RegExp(testData.exception))
      })
    })
  })
})
