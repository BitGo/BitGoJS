var typeforce = require('typeforce')

var ECSignature = require('./ecsignature')
var types = require('./types')

var secp256k1
var available = false
try {
  // secp256k1 is an optional native module used for accelerating
  // low-level elliptic curve operations. It's nice to have, but
  // we can live without it too
  secp256k1 = require('secp256k1')
  available = true
} catch (e) {
  // secp256k1 is not available, this is alright
}

/**
 * Derive a public key from a 32 byte private key buffer.
 *
 * Uses secp256k1 for acceleration. If secp256k1 is not available,
 * this function returns undefined.
 *
 * @param buffer {Buffer} Private key buffer
 * @param compressed {Boolean} Whether the public key should be compressed
 * @return {undefined}
 */
var publicKeyCreate = function (buffer, compressed) {
  typeforce(types.tuple(types.Buffer256bit, types.Boolean), arguments)

  if (!available) {
    return undefined
  }

  return secp256k1.publicKeyCreate(buffer, compressed)
}

/**
 * Create an ECDSA signature over the given message hash `hash` with
 * the private key `d`.
 *
 * Uses secp256k1 for acceleration. If secp256k1 is not available,
 * this function returns undefined.
 * @param hash {Buffer} hash of the message which is to be signed
 * @param d {BigInteger} private key which is to be used for signing
 * @return {ECSignature}
 */
var sign = function (hash, d) {
  typeforce(types.tuple(types.Buffer256bit, types.BigInt), arguments)

  if (!available) {
    return undefined
  }

  var sig = secp256k1.sign(hash, d.toBuffer(32)).signature
  return ECSignature.fromDER(secp256k1.signatureExport(sig))
}

/**
 * Verify an ECDSA signature over the given message hash `hash` with signature `sig`
 * and public key `pubkey`.
 *
 * Uses secp256k1 for acceleration. If secp256k1 is not available,
 * this function returns undefined.
 * @param hash {Buffer} hash of the message which is to be verified
 * @param sig {ECSignature} signature which is to be verified
 * @param pubkey {Buffer} public key which will be used to verify the message signature
 * @return {Boolean}
 */
var verify = function (hash, sig, pubkey) {
  typeforce(types.tuple(
    types.Hash256bit,
    types.ECSignature,
    // both compressed and uncompressed public keys are fine
    types.oneOf(types.BufferN(33), types.BufferN(65))),
    arguments)

  if (!available) {
    return undefined
  }

  sig = new ECSignature(sig.r, sig.s)
  sig = secp256k1.signatureNormalize(secp256k1.signatureImport(sig.toDER()))
  return secp256k1.verify(hash, sig, pubkey)
}

module.exports = {
  available: available,
  publicKeyCreate: publicKeyCreate,
  sign: sign,
  verify: verify
}
