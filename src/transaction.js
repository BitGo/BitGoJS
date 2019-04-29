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
    this.overwintered = 0  // 1 if the transaction is post overwinter upgrade, 0 otherwise
    this.versionGroupId = 0  // 0x03C48270 (63210096) for overwinter and 0x892F2085 (2301567109) for sapling
    this.expiryHeight = 0  // Block height after which this transactions will expire, or 0 to disable expiry
    // ZCash version >= 4
    this.valueBalance = 0
    this.vShieldedSpend = []
    this.vShieldedOutput = []
    this.bindingSig = 0
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

Transaction.ZCASH_OVERWINTER_VERSION = 3
Transaction.ZCASH_SAPLING_VERSION = 4
Transaction.ZCASH_JOINSPLITS_SUPPORT_VERSION = 2
Transaction.ZCASH_NUM_JOINSPLITS_INPUTS = 2
Transaction.ZCASH_NUM_JOINSPLITS_OUTPUTS = 2
Transaction.ZCASH_NOTECIPHERTEXT_SIZE = 1 + 8 + 32 + 32 + 512 + 16

Transaction.ZCASH_G1_PREFIX_MASK = 0x02
Transaction.ZCASH_G2_PREFIX_MASK = 0x0a

Transaction.DASH_NORMAL = 0
Transaction.DASH_PROVIDER_REGISTER = 1
Transaction.DASH_PROVIDER_UPDATE_SERVICE = 2
Transaction.DASH_PROVIDER_UPDATE_REGISTRAR = 3
Transaction.DASH_PROVIDER_UPDATE_REVOKE = 4
Transaction.DASH_COINBASE = 5
Transaction.DASH_QUORUM_COMMITMENT = 6

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

  function readInt64 () {
    var i = bufferutils.readInt64LE(buffer, offset)
    offset += 8
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

  function readZKProof () {
    var zkproof
    if (tx.isSaplingCompatible()) {
      zkproof = {
        sA: readSlice(48),
        sB: readSlice(96),
        sC: readSlice(48)
      }
    } else {
      zkproof = {
        gA: readCompressedG1(),
        gAPrime: readCompressedG1(),
        gB: readCompressedG2(),
        gBPrime: readCompressedG1(),
        gC: readCompressedG1(),
        gCPrime: readCompressedG1(),
        gK: readCompressedG1(),
        gH: readCompressedG1()
      }
    }
    return zkproof
  }

  function readJoinSplit () {
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

    var zkproof = readZKProof()
    var ciphertexts = []
    for (j = 0; j < Transaction.ZCASH_NUM_JOINSPLITS_OUTPUTS; j++) {
      ciphertexts.push(readSlice(Transaction.ZCASH_NOTECIPHERTEXT_SIZE))
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

  function readShieldedSpend () {
    var cv = readSlice(32)
    var anchor = readSlice(32)
    var nullifier = readSlice(32)
    var rk = readSlice(32)
    var zkproof = readZKProof()
    var spendAuthSig = readSlice(64)
    return {
      cv: cv,
      anchor: anchor,
      nullifier: nullifier,
      rk: rk,
      zkproof: zkproof,
      spendAuthSig: spendAuthSig
    }
  }

  function readShieldedOutput () {
    var cv = readSlice(32)
    var cmu = readSlice(32)
    var ephemeralKey = readSlice(32)
    var encCiphertext = readSlice(580)
    var outCiphertext = readSlice(80)
    var zkproof = readZKProof()

    return {
      cv: cv,
      cmu: cmu,
      ephemeralKey: ephemeralKey,
      encCiphertext: encCiphertext,
      outCiphertext: outCiphertext,
      zkproof: zkproof
    }
  }
  var tx = new Transaction(network)
  tx.version = readInt32()

  if (coins.isZcash(network)) {
    // Split the header into fOverwintered and nVersion
    tx.overwintered = tx.version >>> 31  // Must be 1 for version 3 and up
    tx.version = tx.version & 0x07FFFFFFF  // 3 for overwinter
    if (!network.consensusBranchId.hasOwnProperty(tx.version)) {
      throw new Error('Unsupported Zcash transaction')
    }
  }

  if (coins.isDash(network)) {
    tx.type = tx.version >> 16
    tx.version = tx.version & 0xffff
    if (tx.version === 3 && (tx.type < Transaction.DASH_NORMAL || tx.type > Transaction.DASH_QUORUM_COMMITMENT)) {
      throw new Error('Unsupported Dash transaction type')
    }
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

  if (tx.isOverwinterCompatible()) {
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

  if (coins.isZcash(network)) {
    if (tx.isOverwinterCompatible()) {
      tx.expiryHeight = readUInt32()
    }

    if (tx.isSaplingCompatible()) {
      tx.valueBalance = readInt64()
      var nShieldedSpend = readVarInt()
      for (i = 0; i < nShieldedSpend; ++i) {
        tx.vShieldedSpend.push(readShieldedSpend())
      }

      var nShieldedOutput = readVarInt()
      for (i = 0; i < nShieldedOutput; ++i) {
        tx.vShieldedOutput.push(readShieldedOutput())
      }
    }

    if (tx.supportsJoinSplits()) {
      var joinSplitsLen = readVarInt()
      for (i = 0; i < joinSplitsLen; ++i) {
        tx.joinsplits.push(readJoinSplit())
      }
      if (joinSplitsLen > 0) {
        tx.joinsplitPubkey = readSlice(32)
        tx.joinsplitSig = readSlice(64)
      }
    }

    if (tx.isSaplingCompatible() &&
      tx.vShieldedSpend.length + tx.vShieldedOutput.length > 0) {
      tx.bindingSig = readSlice(64)
    }
  }

  if (tx.isDashSpecialTransaction()) {
    tx.extraPayload = readVarSlice()
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

Transaction.prototype.isSaplingCompatible = function () {
  return coins.isZcash(this.network) && this.version >= Transaction.ZCASH_SAPLING_VERSION
}

Transaction.prototype.isOverwinterCompatible = function () {
  return coins.isZcash(this.network) && this.version >= Transaction.ZCASH_OVERWINTER_VERSION
}

Transaction.prototype.supportsJoinSplits = function () {
  return coins.isZcash(this.network) && this.version >= Transaction.ZCASH_JOINSPLITS_SUPPORT_VERSION
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
  byteLength += bufferutils.varIntSize(joinSplitsLen)  // vJoinSplit

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
    bufferWriter = new BufferWriter(baseBufferSize)

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
    personalization.writeUInt32LE(this.network.consensusBranchId[this.version], prefix.length)

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
  function writeUInt16 (i) { offset = buffer.writeUInt16LE(i, offset) }
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

  if (this.isOverwinterCompatible()) {
    var mask = (this.overwintered ? 1 : 0)
    writeInt32(this.version | (mask << 31))  // Set overwinter bit
    writeUInt32(this.versionGroupId)
  } else if (this.isDashSpecialTransaction()) {
    writeUInt16(this.version)
    writeUInt16(this.type)
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

  if (this.isOverwinterCompatible()) {
    writeUInt32(this.expiryHeight)
  }

  if (this.isSaplingCompatible()) {
    writeUInt64(this.valueBalance)

    writeVarInt(this.vShieldedSpend.length)
    this.vShieldedSpend.forEach(function (shieldedSpend) {
      writeSlice(shieldedSpend.cv)
      writeSlice(shieldedSpend.anchor)
      writeSlice(shieldedSpend.nullifier)
      writeSlice(shieldedSpend.rk)
      writeSlice(shieldedSpend.zkproof.sA)
      writeSlice(shieldedSpend.zkproof.sB)
      writeSlice(shieldedSpend.zkproof.sC)
      writeSlice(shieldedSpend.spendAuthSig)
    })
    writeVarInt(this.vShieldedOutput.length)
    this.vShieldedOutput.forEach(function (shieldedOutput) {
      writeSlice(shieldedOutput.cv)
      writeSlice(shieldedOutput.cmu)
      writeSlice(shieldedOutput.ephemeralKey)
      writeSlice(shieldedOutput.encCiphertext)
      writeSlice(shieldedOutput.outCiphertext)
      writeSlice(shieldedOutput.zkproof.sA)
      writeSlice(shieldedOutput.zkproof.sB)
      writeSlice(shieldedOutput.zkproof.sC)
    })
  }

  if (this.supportsJoinSplits()) {
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
      if (this.isSaplingCompatible()) {
        writeSlice(joinsplit.zkproof.sA)
        writeSlice(joinsplit.zkproof.sB)
        writeSlice(joinsplit.zkproof.sC)
      } else {
        writeCompressedG1(joinsplit.zkproof.gA)
        writeCompressedG1(joinsplit.zkproof.gAPrime)
        writeCompressedG2(joinsplit.zkproof.gB)
        writeCompressedG1(joinsplit.zkproof.gBPrime)
        writeCompressedG1(joinsplit.zkproof.gC)
        writeCompressedG1(joinsplit.zkproof.gCPrime)
        writeCompressedG1(joinsplit.zkproof.gK)
        writeCompressedG1(joinsplit.zkproof.gH)
      }
      joinsplit.ciphertexts.forEach(function (ciphertext) {
        writeSlice(ciphertext)
      })
    }, this)
    if (this.joinsplits.length > 0) {
      writeSlice(this.joinsplitPubkey)
      writeSlice(this.joinsplitSig)
    }
  }

  if (this.isSaplingCompatible() && this.vShieldedSpend.length + this.vShieldedOutput.length > 0) {
    writeSlice(this.bindingSig)
  }

  if (this.isDashSpecialTransaction()) {
    writeVarSlice(this.extraPayload)
  }

  // avoid slicing unless necessary
  if (initialOffset !== undefined) return buffer.slice(initialOffset, offset)
  // TODO (https://github.com/BitGo/bitgo-utxo-lib/issues/11): we shouldn't have to slice the final buffer
  return buffer.slice(0, offset)
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
