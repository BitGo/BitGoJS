var baddress = require('./address')
var bcrypto = require('./crypto')
var ecdsa = require('./ecdsa')
var randomBytes = require('randombytes')
var typeforce = require('typeforce')
var types = require('./types')
var wif = require('wif')

var NETWORKS = require('./networks')
var BigInteger = require('bigi')

var ecurve = require('ecurve')
var curve = ecurve.getCurveByName('secp256k1')
var secp256k1 = ecdsa.__curve

var fastcurve = require('./fastcurve')

function ECPair (d, Q, options) {
  if (options) {
    typeforce({
      compressed: types.maybe(types.Boolean),
      network: types.maybe(types.Network)
    }, options)
  }

  options = options || {}

  if (d) {
    if (d.signum() <= 0) throw new Error('Private key must be greater than 0')
    if (d.compareTo(secp256k1.n) >= 0) throw new Error('Private key must be less than the curve order')
    if (Q) throw new TypeError('Unexpected publicKey parameter')

    this.d = d
  } else {
    typeforce(types.ECPoint, Q)

    this.__Q = Q
  }

  this.compressed = options.compressed === undefined ? true : options.compressed
  this.network = options.network || NETWORKS.bitcoin
}

Object.defineProperty(ECPair.prototype, 'Q', {
  get: function () {
    if (!this.__Q && this.d) {
      this.__Q = secp256k1.G.multiply(this.d)
    }

    return this.__Q
  }
})

ECPair.fromPublicKeyBuffer = function (buffer, network) {
  var Q = ecurve.Point.decodeFrom(secp256k1, buffer)

  return new ECPair(null, Q, {
    compressed: Q.compressed,
    network: network
  })
}

/**
 * Create an ECPair from the raw private key bytes
 * @param buffer {Buffer} Private key for the ECPair. Must be exactly 32 bytes.
 * @param network {Object} Network for the ECPair. Defaults to bitcoin.
 * @return {ECPair}
 */
ECPair.fromPrivateKeyBuffer = function (buffer, network) {
  if (!Buffer.isBuffer(buffer) || buffer.length !== 32) {
    throw new Error('invalid private key buffer')
  }

  var d = BigInteger.fromBuffer(buffer)

  if (d.signum() <= 0 || d.compareTo(curve.n) >= 0) {
    throw new Error('private key out of range')
  }

  var ecPair = new ECPair(d, null, { network: network })
  if (!ecPair.__Q && curve) {
    ecPair.__Q = ecurve.Point.decodeFrom(curve, fastcurve.publicKeyCreate(d.toBuffer(32), false))
  }

  return ecPair
}

ECPair.fromWIF = function (string, network) {
  var decoded = wif.decode(string)
  var version = decoded.version

  // list of networks?
  if (types.Array(network)) {
    network = network.filter(function (x) {
      return version === x.wif
    }).pop()  // We should not use pop since it depends on the order of the networks for the same wif

    if (!network) throw new Error('Unknown network version')

  // otherwise, assume a network object (or default to bitcoin)
  } else {
    network = network || NETWORKS.bitcoin

    if (version !== network.wif) throw new Error('Invalid network version')
  }

  var d = BigInteger.fromBuffer(decoded.privateKey)

  return new ECPair(d, null, {
    compressed: decoded.compressed,
    network: network
  })
}

ECPair.makeRandom = function (options) {
  options = options || {}

  var rng = options.rng || randomBytes

  var d
  do {
    var buffer = rng(32)
    typeforce(types.Buffer256bit, buffer)

    d = BigInteger.fromBuffer(buffer)
  } while (d.signum() <= 0 || d.compareTo(secp256k1.n) >= 0)

  return new ECPair(d, null, options)
}

ECPair.prototype.getAddress = function () {
  return baddress.toBase58Check(bcrypto.hash160(this.getPublicKeyBuffer()), this.getNetwork().pubKeyHash)
}

ECPair.prototype.getNetwork = function () {
  return this.network
}

ECPair.prototype.getPublicKeyBuffer = function () {
  return this.Q.getEncoded(this.compressed)
}

/**
 * Get the private key as a 32 bytes buffer. If it is smaller than 32 bytes, pad it with zeros
 * @return Buffer
 */
ECPair.prototype.getPrivateKeyBuffer = function () {
  if (!this.d) throw new Error('Missing private key')

  var bigIntBuffer = this.d.toBuffer()
  if (bigIntBuffer.length > 32) throw new Error('Private key size exceeds 32 bytes')

  if (bigIntBuffer.length === 32) {
    return bigIntBuffer
  }
  var newBuffer = Buffer.alloc(32)
  bigIntBuffer.copy(newBuffer, newBuffer.length - bigIntBuffer.length, 0, bigIntBuffer.length)
  return newBuffer
}

ECPair.prototype.sign = function (hash) {
  if (!this.d) throw new Error('Missing private key')

  var sig = fastcurve.sign(hash, this.d)
  if (sig !== undefined) return sig
  return ecdsa.sign(hash, this.d)
}

ECPair.prototype.toWIF = function () {
  if (!this.d) throw new Error('Missing private key')

  return wif.encode(this.network.wif, this.d.toBuffer(32), this.compressed)
}

ECPair.prototype.verify = function (hash, signature) {
  var fastsig = fastcurve.verify(hash, signature, this.getPublicKeyBuffer())
  if (fastsig !== undefined) return fastsig
  return ecdsa.verify(hash, signature, this.Q)
}

module.exports = ECPair
