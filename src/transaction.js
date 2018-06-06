var Buffer = require('safe-buffer').Buffer
var BufferWriter = require('./bufferWriter')
var bcrypto = require('./crypto')
var bscript = require('./script')
var bufferutils = require('./bufferutils')
var coins = require('./coins')
var opcodes = require('bitcoin-ops')
var networks = require('./networks')
var typeforce = require('typeforce')
var types = require('./types')
var varuint = require('varuint-bitcoin')
var blake2b = require('blake2b')

function varSliceSize (someScript) {
  var length = someScript.length

  return varuint.encodingLength(length) + length
}

function vectorSize (someVector) {
  var length = someVector.length

  return varuint.encodingLength(length) + someVector.reduce(function (sum, witness) {
    return sum + varSliceSize(witness)
  }, 0)
}

// By default, assume is a bitcoin transaction
function Transaction (network = networks.bitcoin) {
  this.version = 1
  this.locktime = 0
  this.ins = []
  this.outs = []
  this.network = network
  if (coins.isZcash(network)) {
    // ZCash version >= 2
    this.joinsplits = []
    this.joinsplitPubkey = []
    this.joinsplitSig = []
    // ZCash version >= 3
    this.overwintered = 0
    this.versionGroupId = 0  // 0x03C48270 (63210096) for overwinter
    this.expiryHeight = 0
  }
}

Transaction.DEFAULT_SEQUENCE = 0xffffffff
Transaction.SIGHASH_ALL = 0x01
Transaction.SIGHASH_NONE = 0x02
Transaction.SIGHASH_SINGLE = 0x03
Transaction.SIGHASH_ANYONECANPAY = 0x80
Transaction.SIGHASH_BITCOINCASHBIP143 = 0x40
Transaction.ADVANCED_TRANSACTION_MARKER = 0x00
Transaction.ADVANCED_TRANSACTION_FLAG = 0x01

var EMPTY_SCRIPT = Buffer.allocUnsafe(0)
var EMPTY_WITNESS = []
var ZERO = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex')
var ONE = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
var VALUE_UINT64_MAX = Buffer.from('ffffffffffffffff', 'hex')
var BLANK_OUTPUT = {
  script: EMPTY_SCRIPT,
  valueBuffer: VALUE_UINT64_MAX
}

Transaction.ZCASH_OVERWINTER_VERSION = 3
Transaction.ZCASH_JOINSPLITS_SUPPORT_VERSION = 2
Transaction.ZCASH_NUM_JOINSPLITS_INPUTS = 2
Transaction.ZCASH_NUM_JOINSPLITS_OUTPUTS = 2
Transaction.ZCASH_NOTECIPHERTEXT_SIZE = 1 + 8 + 32 + 32 + 512 + 16

Transaction.ZCASH_G1_PREFIX_MASK = 0x02
Transaction.ZCASH_G2_PREFIX_MASK = 0x0a

Transaction.fromBuffer = function (buffer, network = networks.bitcoin, __noStrict) {
  var offset = 0
  function readSlice (n) {
    offset += n
    return buffer.slice(offset - n, offset)
  }

  function readUInt8 () {
    var i = buffer.readUInt8(offset)
    offset += 1
    return i
  }

  function readUInt32 () {
    var i = buffer.readUInt32LE(offset)
    offset += 4
    return i
  }

  function readInt32 () {
    var i = buffer.readInt32LE(offset)
    offset += 4
    return i
  }

  function readUInt64 () {
    var i = bufferutils.readUInt64LE(buffer, offset)
    offset += 8
    return i
  }

  function readVarInt () {
    var vi = varuint.decode(buffer, offset)
    offset += varuint.decode.bytes
    return vi
  }

  function readVarSlice () {
    return readSlice(readVarInt())
  }

  function readVector () {
    var count = readVarInt()
    var vector = []
    for (var i = 0; i < count; i++) vector.push(readVarSlice())
    return vector
  }

  function readCompressedG1 () {
    var yLsb = readUInt8() & 1
    var x = readSlice(32)
    return {
      x: x,
      yLsb: yLsb
    }
  }

  function readCompressedG2 () {
    var yLsb = readUInt8() & 1
    var x = readSlice(64)
    return {
      x: x,
      yLsb: yLsb
    }
  }

  var tx = new Transaction(network)
  tx.version = readInt32()

  if (coins.isZcash(network)) {
    // Split the header into fOverwintered and nVersion
    tx.overwintered = tx.version >>> 31  // Must be 1 for version 3 and up
    tx.version = tx.version & 0x07FFFFFFF  // 3 for overwinter
  }

  var marker = buffer.readUInt8(offset)
  var flag = buffer.readUInt8(offset + 1)

  var hasWitnesses = false
  if (marker === Transaction.ADVANCED_TRANSACTION_MARKER &&
      flag === Transaction.ADVANCED_TRANSACTION_FLAG &&
      !coins.isZcash(network)) {
    offset += 2
    hasWitnesses = true
  }

  if (coins.isZcash(network) && tx.version >= Transaction.ZCASH_OVERWINTER_VERSION) {
    tx.versionGroupId = readUInt32()
  }

  var vinLen = readVarInt()
  for (var i = 0; i < vinLen; ++i) {
    tx.ins.push({
      hash: readSlice(32),
      index: readUInt32(),
      script: readVarSlice(),
      sequence: readUInt32(),
      witness: EMPTY_WITNESS
    })
  }

  var voutLen = readVarInt()
  for (i = 0; i < voutLen; ++i) {
    tx.outs.push({
      value: readUInt64(),
      script: readVarSlice()
    })
  }

  if (hasWitnesses) {
    for (i = 0; i < vinLen; ++i) {
      tx.ins[i].witness = readVector()
    }

    // was this pointless?
    if (!tx.hasWitnesses()) throw new Error('Transaction has superfluous witness data')
  }

  tx.locktime = readUInt32()

  if (coins.isZcash(network) && tx.version >= Transaction.ZCASH_OVERWINTER_VERSION) {
    tx.expiryHeight = readUInt32()
  }

  if (coins.isZcash(network) && tx.version >= Transaction.ZCASH_JOINSPLITS_SUPPORT_VERSION) {
    var joinSplitsLen = readVarInt()
    for (i = 0; i < joinSplitsLen; ++i) {
      var vpubOld = readUInt64()
      var vpubNew = readUInt64()
      var anchor = readSlice(32)
      var nullifiers = []
      for (var j = 0; j < Transaction.ZCASH_NUM_JOINSPLITS_INPUTS; j++) {
        nullifiers.push(readSlice(32))
      }
      var commitments = []
      for (j = 0; j < Transaction.ZCASH_NUM_JOINSPLITS_OUTPUTS; j++) {
        commitments.push(readSlice(32))
      }
      var ephemeralKey = readSlice(32)
      var randomSeed = readSlice(32)
      var macs = []
      for (j = 0; j < Transaction.ZCASH_NUM_JOINSPLITS_INPUTS; j++) {
        macs.push(readSlice(32))
      }
      // TODO what are those exactly? Can it be expressed by BigNum?
      var zproof = {
        gA: readCompressedG1(),
        gAPrime: readCompressedG1(),
        gB: readCompressedG2(),
        gBPrime: readCompressedG1(),
        gC: readCompressedG1(),
        gCPrime: readCompressedG1(),
        gK: readCompressedG1(),
        gH: readCompressedG1()
      }
      var ciphertexts = []
      for (j = 0; j < Transaction.ZCASH_NUM_JOINSPLITS_OUTPUTS; j++) {
        ciphertexts.push(readSlice(Transaction.ZCASH_NOTECIPHERTEXT_SIZE))
      }

      tx.joinsplits.push({
        vpubOld: vpubOld,
        vpubNew: vpubNew,
        anchor: anchor,
        nullifiers: nullifiers,
        commitments: commitments,
        ephemeralKey: ephemeralKey,
        randomSeed: randomSeed,
        macs: macs,
        zproof: zproof,
        ciphertexts: ciphertexts
      })
    }
    if (joinSplitsLen > 0) {
      tx.joinsplitPubkey = readSlice(32)
      tx.joinsplitSig = readSlice(64)
    }
  }

  tx.network = network

  if (__noStrict) return tx
  if (offset !== buffer.length) throw new Error('Transaction has unexpected data')

  return tx
}

Transaction.fromHex = function (hex, network) {
  return Transaction.fromBuffer(Buffer.from(hex, 'hex'), network)
}

Transaction.isCoinbaseHash = function (buffer) {
  typeforce(types.Hash256bit, buffer)
  for (var i = 0; i < 32; ++i) {
    if (buffer[i] !== 0) return false
  }
  return true
}

Transaction.prototype.isCoinbase = function () {
  return this.ins.length === 1 && Transaction.isCoinbaseHash(this.ins[0].hash)
}

Transaction.prototype.addInput = function (hash, index, sequence, scriptSig) {
  typeforce(types.tuple(
    types.Hash256bit,
    types.UInt32,
    types.maybe(types.UInt32),
    types.maybe(types.Buffer)
  ), arguments)

  if (types.Null(sequence)) {
    sequence = Transaction.DEFAULT_SEQUENCE
  }

  // Add the input and return the input's index
  return (this.ins.push({
    hash: hash,
    index: index,
    script: scriptSig || EMPTY_SCRIPT,
    sequence: sequence,
    witness: EMPTY_WITNESS
  }) - 1)
}

Transaction.prototype.addOutput = function (scriptPubKey, value) {
  typeforce(types.tuple(types.Buffer, types.Satoshi), arguments)

  // Add the output and return the output's index
  return (this.outs.push({
    script: scriptPubKey,
    value: value
  }) - 1)
}

Transaction.prototype.hasWitnesses = function () {
  return this.ins.some(function (x) {
    return x.witness.length !== 0
  })
}

Transaction.prototype.weight = function () {
  var base = this.__byteLength(false)
  var total = this.__byteLength(true)
  return base * 3 + total
}

Transaction.prototype.virtualSize = function () {
  return Math.ceil(this.weight() / 4)
}

Transaction.prototype.byteLength = function () {
  return this.__byteLength(true)
}

Transaction.prototype.joinsplitByteLength = function () {
  if (!this.overwintered && this.version < 2) {
    return 0
  }

  if (!coins.isZcash(this.network)) {
    return 0
  }

  var pubkeySigLength = (this.joinsplits.length > 0) ? (32 + 64) : 0
  return (
    bufferutils.varIntSize(this.joinsplits.length) +
    this.joinsplits.reduce(function (sum, joinsplit) {
      return (
        sum +
        8 + 8 + 32 +
        joinsplit.nullifiers.length * 32 +
        joinsplit.commitments.length * 32 +
        32 + 32 +
        joinsplit.macs.length * 32 +
        65 + 33 * 7 +
        joinsplit.ciphertexts.length * Transaction.ZCASH_NOTECIPHERTEXT_SIZE
      )
    }, 0) +
    pubkeySigLength
  )
}

Transaction.prototype.__byteLength = function (__allowWitness) {
  var hasWitnesses = __allowWitness && this.hasWitnesses()

  return (
    (coins.isZcash(this.network) && this.version >= Transaction.ZCASH_OVERWINTER_VERSION ? 8 : 0) +
    (hasWitnesses ? 10 : 8) +
    varuint.encodingLength(this.ins.length) +
    varuint.encodingLength(this.outs.length) +
    this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script) }, 0) +
    this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script) }, 0) +
    (hasWitnesses ? this.ins.reduce(function (sum, input) { return sum + vectorSize(input.witness) }, 0) : 0) +
    this.joinsplitByteLength()
  )
}

Transaction.prototype.clone = function () {
  var newTx = new Transaction(this.network)
  newTx.version = this.version
  newTx.locktime = this.locktime
  newTx.network = this.network

  if (coins.isZcash(this.network) && this.version >= Transaction.ZCASH_OVERWINTER_VERSION) {
    newTx.overwintered = this.overwintered
    newTx.versionGroupId = this.versionGroupId
    newTx.expiryHeight = this.expiryHeight
  }

  newTx.ins = this.ins.map(function (txIn) {
    return {
      hash: txIn.hash,
      index: txIn.index,
      script: txIn.script,
      sequence: txIn.sequence,
      witness: txIn.witness
    }
  })

  newTx.outs = this.outs.map(function (txOut) {
    return {
      script: txOut.script,
      value: txOut.value
    }
  })

  if (coins.isZcash(this.network) && this.version >= Transaction.ZCASH_JOINSPLITS_SUPPORT_VERSION) {
    newTx.joinsplits = this.joinsplits.map(function (txJoinsplit) {
      return {
        vpubOld: txJoinsplit.vpubOld,
        vpubNew: txJoinsplit.vpubNew,
        anchor: txJoinsplit.anchor,
        nullifiers: txJoinsplit.nullifiers,
        commitments: txJoinsplit.commitments,
        ephemeralKey: txJoinsplit.ephemeralKey,
        randomSeed: txJoinsplit.randomSeed,
        macs: txJoinsplit.macs,
        zproof: txJoinsplit.zproof,
        ciphertexts: txJoinsplit.ciphertexts
      }
    })

    newTx.joinsplitPubkey = this.joinsplitPubkey
    newTx.joinsplitSig = this.joinsplitSig
  }

  return newTx
}

/**
 * Get Zcash header or version
 * @returns {number}
 */
Transaction.prototype.getHeader = function () {
  var mask = (this.overwintered ? 1 : 0)
  var header = this.version | (mask << 31)
  return header
}

/**
 * Hash transaction for signing a specific input.
 *
 * Bitcoin uses a different hash for each signed transaction input.
 * This method copies the transaction, makes the necessary changes based on the
 * hashType, and then hashes the result.
 * This hash can then be used to sign the provided transaction input.
 */
Transaction.prototype.hashForSignature = function (inIndex, prevOutScript, hashType) {
  typeforce(types.tuple(types.UInt32, types.Buffer, /* types.UInt8 */ types.Number), arguments)

  // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L29
  if (inIndex >= this.ins.length) return ONE

  // ignore OP_CODESEPARATOR
  var ourScript = bscript.compile(bscript.decompile(prevOutScript).filter(function (x) {
    return x !== opcodes.OP_CODESEPARATOR
  }))

  var txTmp = this.clone()

  // SIGHASH_NONE: ignore all outputs? (wildcard payee)
  if ((hashType & 0x1f) === Transaction.SIGHASH_NONE) {
    txTmp.outs = []

    // ignore sequence numbers (except at inIndex)
    txTmp.ins.forEach(function (input, i) {
      if (i === inIndex) return

      input.sequence = 0
    })

    // SIGHASH_SINGLE: ignore all outputs, except at the same index?
  } else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE) {
    // https://github.com/bitcoin/bitcoin/blob/master/src/test/sighash_tests.cpp#L60
    if (inIndex >= this.outs.length) return ONE

    // truncate outputs after
    txTmp.outs.length = inIndex + 1

    // "blank" outputs before
    for (var i = 0; i < inIndex; i++) {
      txTmp.outs[i] = BLANK_OUTPUT
    }

    // ignore sequence numbers (except at inIndex)
    txTmp.ins.forEach(function (input, y) {
      if (y === inIndex) return

      input.sequence = 0
    })
  }

  // SIGHASH_ANYONECANPAY: ignore inputs entirely?
  if (hashType & Transaction.SIGHASH_ANYONECANPAY) {
    txTmp.ins = [txTmp.ins[inIndex]]
    txTmp.ins[0].script = ourScript

    // SIGHASH_ALL: only ignore input scripts
  } else {
    // "blank" others input scripts
    txTmp.ins.forEach(function (input) { input.script = EMPTY_SCRIPT })
    txTmp.ins[inIndex].script = ourScript
  }

  // serialize and hash
  var buffer = Buffer.allocUnsafe(txTmp.__byteLength(false) + 4)
  buffer.writeInt32LE(hashType, buffer.length - 4)
  txTmp.__toBuffer(buffer, 0, false)

  return bcrypto.hash256(buffer)
}

/**
 * Blake2b hashing algorithm for Zcash
 * @param bufferToHash
 * @param personalization
 * @returns 256-bit BLAKE2b hash
 */
Transaction.prototype.getBlake2bHash = function (bufferToHash, personalization) {
  var out = Buffer.allocUnsafe(32)
  return blake2b(out.length, null, null, Buffer.from(personalization)).update(bufferToHash).digest(out)
}

/**
 * Build a hash for all or none of the transaction inputs depending on the hashtype
 * @param hashType
 * @returns double SHA-256, 256-bit BLAKE2b hash or 256-bit zero if doesn't apply
 */
Transaction.prototype.getPrevoutHash = function (hashType) {
  if (!(hashType & Transaction.SIGHASH_ANYONECANPAY)) {
    var bufferWriter = new BufferWriter(36 * this.ins.length)

    this.ins.forEach(function (txIn) {
      bufferWriter.writeSlice(txIn.hash)
      bufferWriter.writeUInt32(txIn.index)
    })

    if (coins.isZcash(this.network)) {
      return this.getBlake2bHash(bufferWriter.getBuffer(), 'ZcashPrevoutHash')
    }
    return bcrypto.hash256(bufferWriter.getBuffer())
  }
  return ZERO
}

/**
 * Build a hash for all or none of the transactions inputs sequence numbers depending on the hashtype
 * @param hashType
 * @returns double SHA-256, 256-bit BLAKE2b hash or 256-bit zero if doesn't apply
 */
Transaction.prototype.getSequenceHash = function (hashType) {
  if (!(hashType & Transaction.SIGHASH_ANYONECANPAY) &&
    (hashType & 0x1f) !== Transaction.SIGHASH_SINGLE &&
    (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
    var bufferWriter = new BufferWriter(4 * this.ins.length)

    this.ins.forEach(function (txIn) {
      bufferWriter.writeUInt32(txIn.sequence)
    })

    if (coins.isZcash(this.network)) {
      return this.getBlake2bHash(bufferWriter.getBuffer(), 'ZcashSequencHash')
    }
    return bcrypto.hash256(bufferWriter.getBuffer())
  }
  return ZERO
}

/**
 * Build a hash for one, all or none of the transaction outputs depending on the hashtype
 * @param hashType
 * @param inIndex
 * @returns double SHA-256, 256-bit BLAKE2b hash or 256-bit zero if doesn't apply
 */
Transaction.prototype.getOutputsHash = function (hashType, inIndex) {
  var bufferWriter
  if ((hashType & 0x1f) !== Transaction.SIGHASH_SINGLE && (hashType & 0x1f) !== Transaction.SIGHASH_NONE) {
    // Find out the size of the outputs and write them
    var txOutsSize = this.outs.reduce(function (sum, output) {
      return sum + 8 + varSliceSize(output.script)
    }, 0)

    bufferWriter = new BufferWriter(txOutsSize)

    this.outs.forEach(function (out) {
      bufferWriter.writeUInt64(out.value)
      bufferWriter.writeVarSlice(out.script)
    })

    if (coins.isZcash(this.network)) {
      return this.getBlake2bHash(bufferWriter.getBuffer(), 'ZcashOutputsHash')
    }
    return bcrypto.hash256(bufferWriter.getBuffer())
  } else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE && inIndex < this.outs.length) {
    // Write only the output specified in inIndex
    var output = this.outs[inIndex]

    bufferWriter = new BufferWriter(8 + varSliceSize(output.script))
    bufferWriter.writeUInt64(output.value)
    bufferWriter.writeVarSlice(output.script)

    if (coins.isZcash(this.network)) {
      return this.getBlake2bHash(bufferWriter.getBuffer(), 'ZcashOutputsHash')
    }
    return bcrypto.hash256(bufferWriter.getBuffer())
  }
  return ZERO
}

/**
 * Hash transaction for signing a transparent transaction in Zcash. Protected transactions are not supported.
 * @param inIndex
 * @param prevOutScript
 * @param value
 * @param hashType
 * @returns double SHA-256 or 256-bit BLAKE2b hash
 */
Transaction.prototype.hashForZcashSignature = function (inIndex, prevOutScript, value, hashType) {
  typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments)
  if (this.joinsplits.length > 0) {
    throw new Error('Hash signature for Zcash protected transactions is not supported')
  }

  if (inIndex >= this.ins.length && inIndex !== VALUE_UINT64_MAX) {
    throw new Error('Input index is out of range')
  }

  if (this.version >= Transaction.ZCASH_OVERWINTER_VERSION) {
    var hashPrevouts = this.getPrevoutHash(hashType)
    var hashSequence = this.getSequenceHash(hashType)
    var hashOutputs = this.getOutputsHash(hashType, inIndex)
    var hashJoinSplits = ZERO

    var bufferWriter
    var baseBufferSize = 4 * 5 + 32 * 4
    if (inIndex !== VALUE_UINT64_MAX) {
      // If this hash is for a transparent input signature (i.e. not for txTo.joinSplitSig), we need extra space
      bufferWriter = new BufferWriter(baseBufferSize + 4 * 4 + 32 + varSliceSize(prevOutScript))
    } else {
      bufferWriter = new BufferWriter(baseBufferSize)
    }

    bufferWriter.writeInt32(this.getHeader())
    bufferWriter.writeUInt32(this.versionGroupId)
    bufferWriter.writeSlice(hashPrevouts)
    bufferWriter.writeSlice(hashSequence)
    bufferWriter.writeSlice(hashOutputs)
    bufferWriter.writeSlice(hashJoinSplits)
    bufferWriter.writeUInt32(this.locktime)
    bufferWriter.writeUInt32(this.expiryHeight)
    bufferWriter.writeUInt32(hashType)

    // If this hash is for a transparent input signature (i.e. not for txTo.joinSplitSig):
    if (inIndex !== VALUE_UINT64_MAX) {
      // The input being signed (replacing the scriptSig with scriptCode + amount)
      // The prevout may already be contained in hashPrevout, and the nSequence
      // may already be contained in hashSequence.
      var input = this.ins[inIndex]
      bufferWriter.writeSlice(input.hash)
      bufferWriter.writeUInt32(input.index)
      bufferWriter.writeVarSlice(prevOutScript)
      bufferWriter.writeUInt64(value)
      bufferWriter.writeUInt32(input.sequence)
    }

    var personalization = Buffer.alloc(16)
    var prefix = 'ZcashSigHash'
    personalization.write(prefix)
    personalization.writeUInt32LE(this.network.consensusBranchId, prefix.length)

    return this.getBlake2bHash(bufferWriter.getBuffer(), personalization)
  }
  // TODO: support non overwinter transactions
}

Transaction.prototype.hashForWitnessV0 = function (inIndex, prevOutScript, value, hashType) {
  typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments)

  var hashPrevouts = this.getPrevoutHash(hashType)
  var hashSequence = this.getSequenceHash(hashType)
  var hashOutputs = this.getOutputsHash(hashType, inIndex)

  var bufferWriter = new BufferWriter(156 + varSliceSize(prevOutScript))
  var input = this.ins[inIndex]
  bufferWriter.writeUInt32(this.version)
  bufferWriter.writeSlice(hashPrevouts)
  bufferWriter.writeSlice(hashSequence)
  bufferWriter.writeSlice(input.hash)
  bufferWriter.writeUInt32(input.index)
  bufferWriter.writeVarSlice(prevOutScript)
  bufferWriter.writeUInt64(value)
  bufferWriter.writeUInt32(input.sequence)
  bufferWriter.writeSlice(hashOutputs)
  bufferWriter.writeUInt32(this.locktime)
  bufferWriter.writeUInt32(hashType)
  return bcrypto.hash256(bufferWriter.getBuffer())
}

/**
 * Hash transaction for signing a specific input for Bitcoin Cash.
 */
Transaction.prototype.hashForCashSignature = function (inIndex, prevOutScript, inAmount, hashType) {
  typeforce(types.tuple(types.UInt32, types.Buffer, /* types.UInt8 */ types.Number, types.maybe(types.UInt53)), arguments)

  // This function works the way it does because Bitcoin Cash
  // uses BIP143 as their replay protection, AND their algo
  // includes `forkId | hashType`, AND since their forkId=0,
  // this is a NOP, and has no difference to segwit. To support
  // other forks, another parameter is required, and a new parameter
  // would be required in the hashForWitnessV0 function, or
  // it could be broken into two..

  // BIP143 sighash activated in BitcoinCash via 0x40 bit
  if (hashType & Transaction.SIGHASH_BITCOINCASHBIP143) {
    if (types.Null(inAmount)) {
      throw new Error('Bitcoin Cash sighash requires value of input to be signed.')
    }
    return this.hashForWitnessV0(inIndex, prevOutScript, inAmount, hashType)
  } else {
    return this.hashForSignature(inIndex, prevOutScript, hashType)
  }
}

/**
 * Hash transaction for signing a specific input for Bitcoin Gold.
 */
Transaction.prototype.hashForGoldSignature = function (inIndex, prevOutScript, inAmount, hashType, sigVersion) {
  typeforce(types.tuple(types.UInt32, types.Buffer, /* types.UInt8 */ types.Number, types.maybe(types.UInt53)), arguments)

  // Bitcoin Gold also implements segregated witness
  // therefore we can pull out the setting of nForkHashType
  // and pass it into the functions.

  var nForkHashType = hashType
  var fUseForkId = (hashType & Transaction.SIGHASH_BITCOINCASHBIP143) > 0
  if (fUseForkId) {
    nForkHashType |= this.network.forkId << 8
  }

  // BIP143 sighash activated in BitcoinCash via 0x40 bit
  if (sigVersion || fUseForkId) {
    if (types.Null(inAmount)) {
      throw new Error('Bitcoin Cash sighash requires value of input to be signed.')
    }
    return this.hashForWitnessV0(inIndex, prevOutScript, inAmount, nForkHashType)
  } else {
    return this.hashForSignature(inIndex, prevOutScript, nForkHashType)
  }
}

Transaction.prototype.getHash = function () {
  return bcrypto.hash256(this.__toBuffer(undefined, undefined, false))
}

Transaction.prototype.getId = function () {
  // transaction hash's are displayed in reverse order
  return this.getHash().reverse().toString('hex')
}

Transaction.prototype.toBuffer = function (buffer, initialOffset) {
  return this.__toBuffer(buffer, initialOffset, true)
}

Transaction.prototype.__toBuffer = function (buffer, initialOffset, __allowWitness) {
  if (!buffer) buffer = Buffer.allocUnsafe(this.__byteLength(__allowWitness))

  var offset = initialOffset || 0
  function writeSlice (slice) { offset += slice.copy(buffer, offset) }
  function writeUInt8 (i) { offset = buffer.writeUInt8(i, offset) }
  function writeUInt32 (i) { offset = buffer.writeUInt32LE(i, offset) }
  function writeInt32 (i) { offset = buffer.writeInt32LE(i, offset) }
  function writeUInt64 (i) { offset = bufferutils.writeUInt64LE(buffer, i, offset) }
  function writeVarInt (i) {
    varuint.encode(i, buffer, offset)
    offset += varuint.encode.bytes
  }
  function writeVarSlice (slice) { writeVarInt(slice.length); writeSlice(slice) }
  function writeVector (vector) { writeVarInt(vector.length); vector.forEach(writeVarSlice) }

  function writeCompressedG1 (i) {
    writeUInt8(Transaction.ZCASH_G1_PREFIX_MASK | i.yLsb)
    writeSlice(i.x)
  }

  function writeCompressedG2 (i) {
    writeUInt8(Transaction.ZCASH_G2_PREFIX_MASK | i.yLsb)
    writeSlice(i.x)
  }

  if (coins.isZcash(this.network) && this.version >= Transaction.ZCASH_OVERWINTER_VERSION) {
    var mask = (this.overwintered ? 1 : 0)
    writeInt32(this.version | (mask << 31))  // Set overwinter bit
    writeUInt32(this.versionGroupId)
  } else {
    writeInt32(this.version)
  }

  var hasWitnesses = __allowWitness && this.hasWitnesses()

  if (hasWitnesses) {
    writeUInt8(Transaction.ADVANCED_TRANSACTION_MARKER)
    writeUInt8(Transaction.ADVANCED_TRANSACTION_FLAG)
  }

  writeVarInt(this.ins.length)

  this.ins.forEach(function (txIn) {
    writeSlice(txIn.hash)
    writeUInt32(txIn.index)
    writeVarSlice(txIn.script)
    writeUInt32(txIn.sequence)
  })

  writeVarInt(this.outs.length)
  this.outs.forEach(function (txOut) {
    if (!txOut.valueBuffer) {
      writeUInt64(txOut.value)
    } else {
      writeSlice(txOut.valueBuffer)
    }

    writeVarSlice(txOut.script)
  })

  if (hasWitnesses) {
    this.ins.forEach(function (input) {
      writeVector(input.witness)
    })
  }

  writeUInt32(this.locktime)

  if (coins.isZcash(this.network) && this.version >= Transaction.ZCASH_OVERWINTER_VERSION) {
    writeUInt32(this.expiryHeight)
  }

  if (coins.isZcash(this.network) && this.version >= Transaction.ZCASH_JOINSPLITS_SUPPORT_VERSION) {
    writeVarInt(this.joinsplits.length)
    this.joinsplits.forEach(function (joinsplit) {
      writeUInt64(joinsplit.vpubOld)
      writeUInt64(joinsplit.vpubNew)
      writeSlice(joinsplit.anchor)
      joinsplit.nullifiers.forEach(function (nullifier) {
        writeSlice(nullifier)
      })
      joinsplit.commitments.forEach(function (nullifier) {
        writeSlice(nullifier)
      })
      writeSlice(joinsplit.ephemeralKey)
      writeSlice(joinsplit.randomSeed)
      joinsplit.macs.forEach(function (nullifier) {
        writeSlice(nullifier)
      })
      writeCompressedG1(joinsplit.zproof.gA)
      writeCompressedG1(joinsplit.zproof.gAPrime)
      writeCompressedG2(joinsplit.zproof.gB)
      writeCompressedG1(joinsplit.zproof.gBPrime)
      writeCompressedG1(joinsplit.zproof.gC)
      writeCompressedG1(joinsplit.zproof.gCPrime)
      writeCompressedG1(joinsplit.zproof.gK)
      writeCompressedG1(joinsplit.zproof.gH)
      joinsplit.ciphertexts.forEach(function (ciphertext) {
        writeSlice(ciphertext)
      })
    })
    if (this.joinsplits.length > 0) {
      writeSlice(this.joinsplitPubkey)
      writeSlice(this.joinsplitSig)
    }
  }

  // avoid slicing unless necessary
  if (initialOffset !== undefined) return buffer.slice(initialOffset, offset)
  return buffer
}

Transaction.prototype.toHex = function () {
  return this.toBuffer().toString('hex')
}

Transaction.prototype.setInputScript = function (index, scriptSig) {
  typeforce(types.tuple(types.Number, types.Buffer), arguments)

  this.ins[index].script = scriptSig
}

Transaction.prototype.setWitness = function (index, witness) {
  typeforce(types.tuple(types.Number, [types.Buffer]), arguments)

  this.ins[index].witness = witness
}

module.exports = Transaction
