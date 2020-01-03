/* global describe, it */

const assert = require('assert')
const crypto = require('crypto')

const BigInteger = require('bigi')

const {
  bitgo: {
    keyutil: {
      privateKeyBufferToECPair,
      privateKeyBufferFromECPair
    }
  },
  ECPair
} = require('../../src')

describe('privateKeyBufferFromECPair', function () {
  it('pads short private keys', function () {
    var keyPair = new ECPair(BigInteger.ONE)
    assert.strictEqual(privateKeyBufferFromECPair(keyPair).length, 32)
    assert.strictEqual(privateKeyBufferFromECPair(keyPair).toString('hex'),
      '0000000000000000000000000000000000000000000000000000000000000001')
  })

  it('does not pad 32 bytes private keys', function () {
    var hexString = 'a000000000000000000000000000000000000000000000000000000000000000'
    var keyPair = new ECPair(new BigInteger(hexString, 16))
    assert.strictEqual(privateKeyBufferFromECPair(keyPair).length, 32)
    assert.strictEqual(privateKeyBufferFromECPair(keyPair).toString('hex'), hexString)
  })

  it('throws if passed value is not ecpair', function () {
    assert.throws(function () {
      privateKeyBufferFromECPair({})
    }, new RegExp('invalid argument ecpair'))
  })
})

describe('privateKeyBufferToECPair', function () {
  it('constructs an ECPair from a random private key buffer', function () {
    var prvKeyBuffer = crypto.randomBytes(32)
    var ecPair = privateKeyBufferToECPair(prvKeyBuffer)
    var ecPairPrvBuffer = privateKeyBufferFromECPair(ecPair)
    assert.strictEqual(Buffer.compare(ecPairPrvBuffer, prvKeyBuffer), 0)
  })

  it('throws if the private key buffer is not a buffer', function () {
    assert.throws(function () {
      privateKeyBufferToECPair('not a buffer')
    }, new RegExp('invalid private key buffer'))
  })

  it('throws if the private key buffer is not 32 bytes', function () {
    assert.throws(function () {
      privateKeyBufferToECPair(Buffer.alloc(31, 0x00))
    }, new RegExp('invalid private key buffer'))

    assert.throws(function () {
      privateKeyBufferToECPair(Buffer.alloc(33, 0x00))
    }, new RegExp('invalid private key buffer'))
  })
})
