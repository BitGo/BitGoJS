const typeforce = require('typeforce')
const types = require('../../types')
const version = require('./version')

const { BufferReader, BufferWriter } = require('../../bufferutils')

const NUM_JOINSPLITS_INPUTS = 2
const NUM_JOINSPLITS_OUTPUTS = 2
const NOTECIPHERTEXT_SIZE = 1 + 8 + 32 + 32 + 512 + 16

const G1_PREFIX_MASK = 0x02
const G2_PREFIX_MASK = 0x0a

class ZcashBufferReader extends BufferReader {
  constructor (buffer, offset, txVersion) {
    super(buffer, offset)
    typeforce(types.maybe(types.Int32), txVersion)
    this.txVersion = txVersion
  }

  readInt64 () {
    const a = this.buffer.readUInt32LE(this.offset)
    let b = this.buffer.readInt32LE(this.offset + 4)
    b *= 0x100000000
    this.offset += 8
    return b + a
  }

  readCompressedG1 () {
    var yLsb = this.readUInt8() & 1
    var x = this.readSlice(32)
    return {
      x: x,
      yLsb: yLsb
    }
  }

  readCompressedG2 () {
    var yLsb = this.readUInt8() & 1
    var x = this.readSlice(64)
    return {
      x: x,
      yLsb: yLsb
    }
  }

  readZKProof () {
    var zkproof
    if (this.txVersion >= version.SAPLING) {
      zkproof = {
        sA: this.readSlice(48),
        sB: this.readSlice(96),
        sC: this.readSlice(48)
      }
    } else {
      zkproof = {
        gA: this.readCompressedG1(),
        gAPrime: this.readCompressedG1(),
        gB: this.readCompressedG2(),
        gBPrime: this.readCompressedG1(),
        gC: this.readCompressedG1(),
        gCPrime: this.readCompressedG1(),
        gK: this.readCompressedG1(),
        gH: this.readCompressedG1()
      }
    }
    return zkproof
  }

  readJoinSplit () {
    var vpubOld = this.readUInt64()
    var vpubNew = this.readUInt64()
    var anchor = this.readSlice(32)
    var nullifiers = []
    for (var j = 0; j < NUM_JOINSPLITS_INPUTS; j++) {
      nullifiers.push(this.readSlice(32))
    }
    var commitments = []
    for (j = 0; j < NUM_JOINSPLITS_OUTPUTS; j++) {
      commitments.push(this.readSlice(32))
    }
    var ephemeralKey = this.readSlice(32)
    var randomSeed = this.readSlice(32)
    var macs = []
    for (j = 0; j < NUM_JOINSPLITS_INPUTS; j++) {
      macs.push(this.readSlice(32))
    }

    var zkproof = this.readZKProof()
    var ciphertexts = []
    for (j = 0; j < NUM_JOINSPLITS_OUTPUTS; j++) {
      ciphertexts.push(this.readSlice(NOTECIPHERTEXT_SIZE))
    }
    return {
      vpubOld: vpubOld,
      vpubNew: vpubNew,
      anchor: anchor,
      nullifiers: nullifiers,
      commitments: commitments,
      ephemeralKey: ephemeralKey,
      randomSeed: randomSeed,
      macs: macs,
      zkproof: zkproof,
      ciphertexts: ciphertexts
    }
  }

  readShieldedSpend () {
    var cv = this.readSlice(32)
    var anchor = this.readSlice(32)
    var nullifier = this.readSlice(32)
    var rk = this.readSlice(32)
    var zkproof = this.readZKProof()
    var spendAuthSig = this.readSlice(64)
    return {
      cv: cv,
      anchor: anchor,
      nullifier: nullifier,
      rk: rk,
      zkproof: zkproof,
      spendAuthSig: spendAuthSig
    }
  }

  readShieldedOutput () {
    var cv = this.readSlice(32)
    var cmu = this.readSlice(32)
    var ephemeralKey = this.readSlice(32)
    var encCiphertext = this.readSlice(580)
    var outCiphertext = this.readSlice(80)
    var zkproof = this.readZKProof()

    return {
      cv: cv,
      cmu: cmu,
      ephemeralKey: ephemeralKey,
      encCiphertext: encCiphertext,
      outCiphertext: outCiphertext,
      zkproof: zkproof
    }
  }
}

class ZcashBufferWriter extends BufferWriter {
  writeCompressedG1 (i) {
    this.writeUInt8(G1_PREFIX_MASK | i.yLsb)
    this.writeSlice(i.x)
  }

  writeCompressedG2 (i) {
    this.writeUInt8(G2_PREFIX_MASK | i.yLsb)
    this.writeSlice(i.x)
  }
}

module.exports = { ZcashBufferReader, ZcashBufferWriter }
