/* global describe, it */

var assert = require('assert')
var bufferutils = require('../src/bufferutils')

var fixtures = require('./fixtures/bufferutils.json')

describe('bufferutils', function () {
  describe('readInt64LE', function () {
    fixtures.negative.forEach(function (f) {
      it('decodes ' + f.hex64 + ' correctly', function () {
        var buffer = Buffer.from(f.hex64, 'hex')
        var number = bufferutils.readInt64LE(buffer, 0)

        assert.strictEqual(number, f.dec)
      })
    })
  })

  describe('readUInt64LE', function () {
    fixtures.valid.forEach(function (f) {
      it('decodes ' + f.hex64 + ' correctly', function () {
        var buffer = Buffer.from(f.hex64, 'hex')
        var number = bufferutils.readUInt64LE(buffer, 0)

        assert.strictEqual(number, f.dec)
      })
    })

    fixtures.invalid.readUInt64LE.forEach(function (f) {
      it('throws on ' + f.description, function () {
        var buffer = Buffer.from(f.hex64, 'hex')

        assert.throws(function () {
          bufferutils.readUInt64LE(buffer, 0)
        }, new RegExp(f.exception))
      })
    })
  })

  describe('readVarInt', function () {
    fixtures.valid.forEach(function (f) {
      it('decodes ' + f.hexVI + ' correctly', function () {
        var buffer = Buffer.from(f.hexVI, 'hex')
        var d = bufferutils.readVarInt(buffer, 0)

        assert.strictEqual(d.number, f.dec)
        assert.strictEqual(d.size, buffer.length)
      })
    })

    fixtures.invalid.readUInt64LE.forEach(function (f) {
      it('throws on ' + f.description, function () {
        var buffer = Buffer.from(f.hexVI, 'hex')

        assert.throws(function () {
          bufferutils.readVarInt(buffer, 0)
        }, new RegExp(f.exception))
      })
    })
  })

  describe('varIntBuffer', function () {
    fixtures.valid.forEach(function (f) {
      it('encodes ' + f.dec + ' correctly', function () {
        var buffer = bufferutils.varIntBuffer(f.dec)

        assert.strictEqual(buffer.toString('hex'), f.hexVI)
      })
    })
  })

  describe('varIntSize', function () {
    fixtures.valid.forEach(function (f) {
      it('determines the varIntSize of ' + f.dec + ' correctly', function () {
        var size = bufferutils.varIntSize(f.dec)

        assert.strictEqual(size, f.hexVI.length / 2)
      })
    })
  })

  describe('writeUInt64LE', function () {
    fixtures.valid.forEach(function (f) {
      it('encodes ' + f.dec + ' correctly', function () {
        var buffer = Buffer.alloc(8, 0)

        bufferutils.writeUInt64LE(buffer, f.dec, 0)
        assert.strictEqual(buffer.toString('hex'), f.hex64)
      })
    })

    fixtures.invalid.readUInt64LE.forEach(function (f) {
      it('throws on ' + f.description, function () {
        var buffer = Buffer.alloc(8, 0)

        assert.throws(function () {
          bufferutils.writeUInt64LE(buffer, f.dec, 0)
        }, new RegExp(f.exception))
      })
    })
  })

  describe('writeVarInt', function () {
    fixtures.valid.forEach(function (f) {
      it('encodes ' + f.dec + ' correctly', function () {
        var buffer = Buffer.alloc(9, 0)

        var n = bufferutils.writeVarInt(buffer, f.dec, 0)
        assert.strictEqual(buffer.slice(0, n).toString('hex'), f.hexVI)
      })
    })

    fixtures.invalid.readUInt64LE.forEach(function (f) {
      it('throws on ' + f.description, function () {
        var buffer = Buffer.alloc(9, 0)

        assert.throws(function () {
          bufferutils.writeVarInt(buffer, f.dec, 0)
        }, new RegExp(f.exception))
      })
    })
  })
})
