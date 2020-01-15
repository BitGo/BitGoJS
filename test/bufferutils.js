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
})
