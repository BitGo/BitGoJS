var Buffer = require('safe-buffer').Buffer
var bcrypto = require('./crypto')
var bscript = require('./script')
var { BufferReader, BufferWriter } = require('./bufferutils')
var { ZcashBufferReader, ZcashBufferWriter } = require('./forks/zcash/bufferutils')
var coins = require('./coins')
var opcodes = require('bitcoin-ops')
var networks = require('./networks')
var typeforce = require('typeforce')
var types = require('./types')
var varuint = require('varuint-bitcoin')
var blake2b = require('blake2b')

var zcashVersion = require('./forks/zcash/version')

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
    this.overwintered = 0  // 1 if the transaction is post overwinter upgrade, 0 otherwise
    this.versionGroupId = 0  // 0x03C48270 (63210096) for overwinter and 0x892F2085 (2301567109) for sapling
    this.expiryHeight = 0  // Block height after which this transactions will expire, or 0 to disable expiry
    // ZCash version >= 4
    this.valueBalance = 0
    this.vShieldedSpend = []
    this.vShieldedOutput = []
    this.bindingSig = 0
    // Must be updated along with version
    this.consensusBranchId = network.consensusBranchId[this.version]
  }
  if (coins.isDash(network)) {
    // Dash version = 3
    this.type = 0
    this.extraPayload = Buffer.alloc(0)
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
// Used to represent the absence of a value
var VALUE_UINT64_MAX = Buffer.from('ffffffffffffffff', 'hex')
var BLANK_OUTPUT = {
  script: EMPTY_SCRIPT,
  valueBuffer: VALUE_UINT64_MAX
}

Transaction.DASH_NORMAL = 0
Transaction.DASH_PROVIDER_REGISTER = 1
Transaction.DASH_PROVIDER_UPDATE_SERVICE = 2
Transaction.DASH_PROVIDER_UPDATE_REGISTRAR = 3
Transaction.DASH_PROVIDER_UPDATE_REVOKE = 4
Transaction.DASH_COINBASE = 5
Transaction.DASH_QUORUM_COMMITMENT = 6

Transaction.fromBuffer = function (buffer, network = networks.bitcoin, __noStrict) {
  let bufferReader = new BufferReader(buffer)

  let tx = new Transaction(network)
  tx.version = bufferReader.readInt32()

  if (coins.isZcash(network)) {
    // Split the header into fOverwintered and nVersion
    tx.overwintered = tx.version >>> 31  // Must be 1 for version 3 and up
    tx.version = tx.version & 0x07FFFFFFF  // 3 for overwinter
    if (!network.consensusBranchId.hasOwnProperty(tx.version)) {
      throw new Error('Unsupported Zcash transaction')
    }
    tx.consensusBranchId = network.consensusBranchId[tx.version]
    bufferReader = new ZcashBufferReader(
      bufferReader.buffer,
      bufferReader.offset,
      tx.version,
    )
  }

  if (coins.isDash(network)) {
    tx.type = tx.version >> 16
    tx.version = tx.version & 0xffff
    if (tx.version === 3 && (tx.type < Transaction.DASH_NORMAL || tx.type > Transaction.DASH_QUORUM_COMMITMENT)) {
      throw new Error('Unsupported Dash transaction type')
    }
  }

  var marker = bufferReader.readUInt8()
  var flag = bufferReader.readUInt8()

  var hasWitnesses = false
  if (marker === Transaction.ADVANCED_TRANSACTION_MARKER &&
      flag === Transaction.ADVANCED_TRANSACTION_FLAG &&
      !coins.isZcash(network)) {
    hasWitnesses = true
  } else {
    bufferReader.offset -= 2
  }

  if (tx.isOverwinterCompatible()) {
    tx.versionGroupId = bufferReader.readUInt32()
  }

  var vinLen = bufferReader.readVarInt()
  for (var i = 0; i < vinLen; ++i) {
    tx.ins.push({
      hash: bufferReader.readSlice(32),
      index: bufferReader.readUInt32(),
      script: bufferReader.readVarSlice(),
      sequence: bufferReader.readUInt32(),
      witness: EMPTY_WITNESS
    })
  }

  var voutLen = bufferReader.readVarInt()
  for (i = 0; i < voutLen; ++i) {
    tx.outs.push({
      value: bufferReader.readUInt64(),
      script: bufferReader.readVarSlice()
    })
  }

  if (hasWitnesses) {
    for (i = 0; i < vinLen; ++i) {
      tx.ins[i].witness = bufferReader.readVector()
    }

    // was this pointless?
    if (!tx.hasWitnesses()) throw new Error('Transaction has superfluous witness data')
  }

  tx.locktime = bufferReader.readUInt32()

  if (coins.isZcash(network)) {
    if (tx.isOverwinterCompatible()) {
      tx.expiryHeight = bufferReader.readUInt32()
    }

    if (tx.isSaplingCompatible()) {
      tx.valueBalance = bufferReader.readInt64()
      var nShieldedSpend = bufferReader.readVarInt()
      for (i = 0; i < nShieldedSpend; ++i) {
        tx.vShieldedSpend.push(bufferReader.readShieldedSpend())
      }

      var nShieldedOutput = bufferReader.readVarInt()
      for (i = 0; i < nShieldedOutput; ++i) {
        tx.vShieldedOutput.push(bufferReader.readShieldedOutput())
      }
    }

    if (tx.supportsJoinSplits()) {
      var joinSplitsLen = bufferReader.readVarInt()
      for (i = 0; i < joinSplitsLen; ++i) {
        tx.joinsplits.push(bufferReader.readJoinSplit())
      }
      if (joinSplitsLen > 0) {
        tx.joinsplitPubkey = bufferReader.readSlice(32)
        tx.joinsplitSig = bufferReader.readSlice(64)
      }
    }

    if (tx.isSaplingCompatible() &&
      tx.vShieldedSpend.length + tx.vShieldedOutput.length > 0) {
      tx.bindingSig = bufferReader.readSlice(64)
    }
  }

  if (tx.isDashSpecialTransaction()) {
    tx.extraPayload = bufferReader.readVarSlice()
  }

  tx.network = network

  if (__noStrict) return tx
  if (bufferReader.offset !== buffer.length) throw new Error('Transaction has unexpected data')

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

Transaction.prototype.isSaplingCompatible = function () {
  return coins.isZcash(this.network) && this.version >= zcashVersion.SAPLING
}

Transaction.prototype.isOverwinterCompatible = function () {
  return coins.isZcash(this.network) && this.version >= zcashVersion.OVERWINTER
}

Transaction.prototype.supportsJoinSplits = function () {
  return coins.isZcash(this.network) && this.version >= zcashVersion.JOINSPLITS_SUPPORT
}

Transaction.prototype.versionSupportsDashSpecialTransactions = function () {
  return coins.isDash(this.network) && this.version >= 3
}

Transaction.prototype.isDashSpecialTransaction = function () {
  return this.versionSupportsDashSpecialTransactions() && this.type !== Transaction.DASH_NORMAL
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

Transaction.prototype.getShieldedSpendByteLength = function () {
  if (!this.isSaplingCompatible()) {
    return 0
  }

  var byteLength = 0
  byteLength += varuint.encodingLength(this.vShieldedSpend.length)  // nShieldedSpend
  byteLength += (384 * this.vShieldedSpend.length)  // vShieldedSpend
  return byteLength
}

Transaction.prototype.getShieldedOutputByteLength = function () {
  if (!this.isSaplingCompatible()) {
    return 0
  }
  var byteLength = 0
  byteLength += varuint.encodingLength(this.vShieldedOutput.length)  // nShieldedOutput
  byteLength += (948 * this.vShieldedOutput.length)  // vShieldedOutput
  return byteLength
}

Transaction.prototype.getJoinSplitByteLength = function () {
  if (!this.supportsJoinSplits()) {
    return 0
  }
  var joinSplitsLen = this.joinsplits.length
  var byteLength = 0
  byteLength += varuint.encodingLength(joinSplitsLen)  // vJoinSplit

  if (joinSplitsLen > 0) {
    // Both pre and post Sapling JoinSplits are encoded with the following data:
    // 8 vpub_old, 8 vpub_new, 32 anchor, joinSplitsLen * 32 nullifiers, joinSplitsLen * 32 commitments, 32 ephemeralKey
    // 32 ephemeralKey, 32 randomSeed, joinsplit.macs.length * 32 vmacs
    if (this.isSaplingCompatible()) {
      byteLength += 1698 * joinSplitsLen  // vJoinSplit using JSDescriptionGroth16
    } else {
      byteLength += 1802 * joinSplitsLen  // vJoinSplit using JSDescriptionPHGR13
    }
    byteLength += 32  // joinSplitPubKey
    byteLength += 64  // joinSplitSig
  }

  return byteLength
}

Transaction.prototype.zcashTransactionByteLength = function () {
  if (!coins.isZcash(this.network)) {
    throw new Error('zcashTransactionByteLength can only be called when using Zcash network')
  }
  var byteLength = 0
  byteLength += 4  // Header
  if (this.isOverwinterCompatible()) {
    byteLength += 4  // nVersionGroupId
  }
  byteLength += varuint.encodingLength(this.ins.length)  // tx_in_count
  byteLength += this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script) }, 0)  // tx_in
  byteLength += varuint.encodingLength(this.outs.length)  // tx_out_count
  byteLength += this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script) }, 0)  // tx_out
  byteLength += 4  // lock_time
  if (this.isOverwinterCompatible()) {
    byteLength += 4  // nExpiryHeight
  }
  if (this.isSaplingCompatible()) {
    byteLength += 8  // valueBalance
    byteLength += this.getShieldedSpendByteLength()
    byteLength += this.getShieldedOutputByteLength()
  }
  if (this.supportsJoinSplits()) {
    byteLength += this.getJoinSplitByteLength()
  }
  if (this.isSaplingCompatible() &&
    this.vShieldedSpend.length + this.vShieldedOutput.length > 0) {
    byteLength += 64  // bindingSig
  }
  return byteLength
}

Transaction.prototype.__byteLength = function (__allowWitness) {
  var hasWitnesses = __allowWitness && this.hasWitnesses()

  if (coins.isZcash(this.network)) {
    return this.zcashTransactionByteLength()
  }

  return (
    (hasWitnesses ? 10 : 8) +
    varuint.encodingLength(this.ins.length) +
    varuint.encodingLength(this.outs.length) +
    this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script) }, 0) +
    this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script) }, 0) +
    (this.isDashSpecialTransaction() ? varSliceSize(this.extraPayload) : 0) +
    (hasWitnesses ? this.ins.reduce(function (sum, input) { return sum + vectorSize(input.witness) }, 0) : 0)
  )
}

Transaction.prototype.clone = function () {
  var newTx = new Transaction(this.network)
  newTx.version = this.version
  newTx.locktime = this.locktime
  newTx.network = this.network

  if (coins.isDash(this.network)) {
    newTx.type = this.type
    newTx.extraPayload = this.extraPayload
  }

  if (coins.isZcash(this.network)) {
    newTx.consensusBranchId = this.consensusBranchId
  }
  if (this.isOverwinterCompatible()) {
    newTx.overwintered = this.overwintered
    newTx.versionGroupId = this.versionGroupId
    newTx.expiryHeight = this.expiryHeight
  }
  if (this.isSaplingCompatible()) {
    newTx.valueBalance = this.valueBalance
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
  if (this.isSaplingCompatible()) {
    newTx.vShieldedSpend = this.vShieldedSpend.map(function (shieldedSpend) {
      return {
        cv: shieldedSpend.cv,
        anchor: shieldedSpend.anchor,
        nullifier: shieldedSpend.nullifier,
        rk: shieldedSpend.rk,
        zkproof: shieldedSpend.zkproof,
        spendAuthSig: shieldedSpend.spendAuthSig
      }
    })

    newTx.vShieldedOutput = this.vShieldedOutput.map(function (shieldedOutput) {
      return {
        cv: shieldedOutput.cv,
        cmu: shieldedOutput.cmu,
        ephemeralKey: shieldedOutput.ephemeralKey,
        encCiphertext: shieldedOutput.encCiphertext,
        outCiphertext: shieldedOutput.outCiphertext,
        zkproof: shieldedOutput.zkproof
      }
    })
  }

  if (this.supportsJoinSplits()) {
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
        zkproof: txJoinsplit.zkproof,
        ciphertexts: txJoinsplit.ciphertexts
      }
    })

    newTx.joinsplitPubkey = this.joinsplitPubkey
    newTx.joinsplitSig = this.joinsplitSig
  }

  if (this.isSaplingCompatible() && this.vShieldedSpend.length + this.vShieldedOutput.length > 0) {
    newTx.bindingSig = this.bindingSig
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
    var bufferWriter = new BufferWriter(Buffer.allocUnsafe(36 * this.ins.length))

    this.ins.forEach(function (txIn) {
      bufferWriter.writeSlice(txIn.hash)
      bufferWriter.writeUInt32(txIn.index)
    })

    if (coins.isZcash(this.network)) {
      return this.getBlake2bHash(bufferWriter.buffer, 'ZcashPrevoutHash')
    }
    return bcrypto.hash256(bufferWriter.buffer)
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
    var bufferWriter = new BufferWriter(Buffer.allocUnsafe(4 * this.ins.length))

    this.ins.forEach(function (txIn) {
      bufferWriter.writeUInt32(txIn.sequence)
    })

    if (coins.isZcash(this.network)) {
      return this.getBlake2bHash(bufferWriter.buffer, 'ZcashSequencHash')
    }
    return bcrypto.hash256(bufferWriter.buffer)
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

    bufferWriter = new BufferWriter(Buffer.allocUnsafe(txOutsSize))

    this.outs.forEach(function (out) {
      bufferWriter.writeUInt64(out.value)
      bufferWriter.writeVarSlice(out.script)
    })

    if (coins.isZcash(this.network)) {
      return this.getBlake2bHash(bufferWriter.buffer, 'ZcashOutputsHash')
    }
    return bcrypto.hash256(bufferWriter.buffer)
  } else if ((hashType & 0x1f) === Transaction.SIGHASH_SINGLE && inIndex < this.outs.length) {
    // Write only the output specified in inIndex
    var output = this.outs[inIndex]

    bufferWriter = new BufferWriter(Buffer.allocUnsafe(8 + varSliceSize(output.script)))
    bufferWriter.writeUInt64(output.value)
    bufferWriter.writeVarSlice(output.script)

    if (coins.isZcash(this.network)) {
      return this.getBlake2bHash(bufferWriter.buffer, 'ZcashOutputsHash')
    }
    return bcrypto.hash256(bufferWriter.buffer)
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
  if (!coins.isZcash(this.network)) {
    throw new Error('hashForZcashSignature can only be called when using Zcash network')
  }
  if (this.joinsplits.length > 0) {
    throw new Error('Hash signature for Zcash protected transactions is not supported')
  }

  if (inIndex >= this.ins.length && inIndex !== VALUE_UINT64_MAX) {
    throw new Error('Input index is out of range')
  }

  if (this.isOverwinterCompatible()) {
    var hashPrevouts = this.getPrevoutHash(hashType)
    var hashSequence = this.getSequenceHash(hashType)
    var hashOutputs = this.getOutputsHash(hashType, inIndex)
    var hashJoinSplits = ZERO
    var hashShieldedSpends = ZERO
    var hashShieldedOutputs = ZERO

    var bufferWriter
    var baseBufferSize = 0
    baseBufferSize += 4 * 5  // header, nVersionGroupId, lock_time, nExpiryHeight, hashType
    baseBufferSize += 32 * 4  // 256 hashes: hashPrevouts, hashSequence, hashOutputs, hashJoinSplits
    if (inIndex !== VALUE_UINT64_MAX) {
      // If this hash is for a transparent input signature (i.e. not for txTo.joinSplitSig), we need extra space
      baseBufferSize += 4 * 2  // input.index, input.sequence
      baseBufferSize += 8  // value
      baseBufferSize += 32  // input.hash
      baseBufferSize += varSliceSize(prevOutScript)  // prevOutScript
    }
    if (this.isSaplingCompatible()) {
      baseBufferSize += 32 * 2  // hashShieldedSpends and hashShieldedOutputs
      baseBufferSize += 8  // valueBalance
    }
    bufferWriter = new BufferWriter(Buffer.alloc(baseBufferSize))

    bufferWriter.writeInt32(this.getHeader())
    bufferWriter.writeUInt32(this.versionGroupId)
    bufferWriter.writeSlice(hashPrevouts)
    bufferWriter.writeSlice(hashSequence)
    bufferWriter.writeSlice(hashOutputs)
    bufferWriter.writeSlice(hashJoinSplits)
    if (this.isSaplingCompatible()) {
      bufferWriter.writeSlice(hashShieldedSpends)
      bufferWriter.writeSlice(hashShieldedOutputs)
    }
    bufferWriter.writeUInt32(this.locktime)
    bufferWriter.writeUInt32(this.expiryHeight)
    if (this.isSaplingCompatible()) {
      bufferWriter.writeUInt64(this.valueBalance)
    }
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
    personalization.writeUInt32LE(this.consensusBranchId, prefix.length)

    return this.getBlake2bHash(bufferWriter.buffer, personalization)
  }
  // TODO: support non overwinter transactions
}

Transaction.prototype.hashForWitnessV0 = function (inIndex, prevOutScript, value, hashType) {
  typeforce(types.tuple(types.UInt32, types.Buffer, types.Satoshi, types.UInt32), arguments)

  var hashPrevouts = this.getPrevoutHash(hashType)
  var hashSequence = this.getSequenceHash(hashType)
  var hashOutputs = this.getOutputsHash(hashType, inIndex)

  var bufferWriter = new BufferWriter(Buffer.allocUnsafe(156 + varSliceSize(prevOutScript)))
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
  return bcrypto.hash256(bufferWriter.buffer)
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

  const bufferWriter = coins.isZcash(this.network)
    ? new ZcashBufferWriter(buffer, initialOffset || 0)
    : new BufferWriter(buffer, initialOffset || 0)

  function writeUInt16 (i) {
    bufferWriter.offset = bufferWriter.buffer.writeUInt16LE(i, bufferWriter.offset)
  }

  if (this.isOverwinterCompatible()) {
    var mask = (this.overwintered ? 1 : 0)
    bufferWriter.writeInt32(this.version | (mask << 31))  // Set overwinter bit
    bufferWriter.writeUInt32(this.versionGroupId)
  } else if (this.isDashSpecialTransaction()) {
    writeUInt16(this.version)
    writeUInt16(this.type)
  } else {
    bufferWriter.writeInt32(this.version)
  }

  var hasWitnesses = __allowWitness && this.hasWitnesses()

  if (hasWitnesses) {
    bufferWriter.writeUInt8(Transaction.ADVANCED_TRANSACTION_MARKER)
    bufferWriter.writeUInt8(Transaction.ADVANCED_TRANSACTION_FLAG)
  }

  bufferWriter.writeVarInt(this.ins.length)

  this.ins.forEach(function (txIn) {
    bufferWriter.writeSlice(txIn.hash)
    bufferWriter.writeUInt32(txIn.index)
    bufferWriter.writeVarSlice(txIn.script)
    bufferWriter.writeUInt32(txIn.sequence)
  })

  bufferWriter.writeVarInt(this.outs.length)
  this.outs.forEach(function (txOut) {
    if (!txOut.valueBuffer) {
      bufferWriter.writeUInt64(txOut.value)
    } else {
      bufferWriter.writeSlice(txOut.valueBuffer)
    }

    bufferWriter.writeVarSlice(txOut.script)
  })

  if (hasWitnesses) {
    this.ins.forEach(function (input) {
      bufferWriter.writeVector(input.witness)
    })
  }

  bufferWriter.writeUInt32(this.locktime)

  if (this.isOverwinterCompatible()) {
    bufferWriter.writeUInt32(this.expiryHeight)
  }

  if (this.isSaplingCompatible()) {
    bufferWriter.writeUInt64(this.valueBalance)

    bufferWriter.writeVarInt(this.vShieldedSpend.length)
    this.vShieldedSpend.forEach(function (shieldedSpend) {
      bufferWriter.writeSlice(shieldedSpend.cv)
      bufferWriter.writeSlice(shieldedSpend.anchor)
      bufferWriter.writeSlice(shieldedSpend.nullifier)
      bufferWriter.writeSlice(shieldedSpend.rk)
      bufferWriter.writeSlice(shieldedSpend.zkproof.sA)
      bufferWriter.writeSlice(shieldedSpend.zkproof.sB)
      bufferWriter.writeSlice(shieldedSpend.zkproof.sC)
      bufferWriter.writeSlice(shieldedSpend.spendAuthSig)
    })
    bufferWriter.writeVarInt(this.vShieldedOutput.length)
    this.vShieldedOutput.forEach(function (shieldedOutput) {
      bufferWriter.writeSlice(shieldedOutput.cv)
      bufferWriter.writeSlice(shieldedOutput.cmu)
      bufferWriter.writeSlice(shieldedOutput.ephemeralKey)
      bufferWriter.writeSlice(shieldedOutput.encCiphertext)
      bufferWriter.writeSlice(shieldedOutput.outCiphertext)
      bufferWriter.writeSlice(shieldedOutput.zkproof.sA)
      bufferWriter.writeSlice(shieldedOutput.zkproof.sB)
      bufferWriter.writeSlice(shieldedOutput.zkproof.sC)
    })
  }

  if (this.supportsJoinSplits()) {
    bufferWriter.writeVarInt(this.joinsplits.length)
    this.joinsplits.forEach(function (joinsplit) {
      bufferWriter.writeUInt64(joinsplit.vpubOld)
      bufferWriter.writeUInt64(joinsplit.vpubNew)
      bufferWriter.writeSlice(joinsplit.anchor)
      joinsplit.nullifiers.forEach(function (nullifier) {
        bufferWriter.writeSlice(nullifier)
      })
      joinsplit.commitments.forEach(function (nullifier) {
        bufferWriter.writeSlice(nullifier)
      })
      bufferWriter.writeSlice(joinsplit.ephemeralKey)
      bufferWriter.writeSlice(joinsplit.randomSeed)
      joinsplit.macs.forEach(function (nullifier) {
        bufferWriter.writeSlice(nullifier)
      })
      if (this.isSaplingCompatible()) {
        bufferWriter.writeSlice(joinsplit.zkproof.sA)
        bufferWriter.writeSlice(joinsplit.zkproof.sB)
        bufferWriter.writeSlice(joinsplit.zkproof.sC)
      } else {
        bufferWriter.writeCompressedG1(joinsplit.zkproof.gA)
        bufferWriter.writeCompressedG1(joinsplit.zkproof.gAPrime)
        bufferWriter.writeCompressedG2(joinsplit.zkproof.gB)
        bufferWriter.writeCompressedG1(joinsplit.zkproof.gBPrime)
        bufferWriter.writeCompressedG1(joinsplit.zkproof.gC)
        bufferWriter.writeCompressedG1(joinsplit.zkproof.gCPrime)
        bufferWriter.writeCompressedG1(joinsplit.zkproof.gK)
        bufferWriter.writeCompressedG1(joinsplit.zkproof.gH)
      }
      joinsplit.ciphertexts.forEach(function (ciphertext) {
        bufferWriter.writeSlice(ciphertext)
      })
    }, this)
    if (this.joinsplits.length > 0) {
      bufferWriter.writeSlice(this.joinsplitPubkey)
      bufferWriter.writeSlice(this.joinsplitSig)
    }
  }

  if (this.isSaplingCompatible() && this.vShieldedSpend.length + this.vShieldedOutput.length > 0) {
    bufferWriter.writeSlice(this.bindingSig)
  }

  if (this.isDashSpecialTransaction()) {
    bufferWriter.writeVarSlice(this.extraPayload)
  }

  if (initialOffset !== undefined) return buffer.slice(initialOffset, bufferWriter.offset)
  // avoid slicing unless necessary
  // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
  return buffer.slice(0, bufferWriter.offset)
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
