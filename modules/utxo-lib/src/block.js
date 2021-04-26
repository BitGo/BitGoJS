var Buffer = require('safe-buffer').Buffer
var bcrypto = require('./crypto')
var fastMerkleRoot = require('merkle-lib/fastRoot')
var typeforce = require('typeforce')
var types = require('./types')
var bufferutils = require('./bufferutils')
var varuint = require('varuint-bitcoin')
var networks = require('./networks')
var coins = require('./coins')

var Transaction = require('./transaction')

function Block (network) {
  typeforce(types.maybe(types.Network), network)
  network = network || networks.bitcoin
  this.version = 1
  this.prevHash = null
  this.merkleRoot = null
  this.timestamp = 0
  this.bits = 0
  this.nonce = 0
  this.network = network
  if (coins.isZcash(network)) {
    this.finalSaplingRoot = null
    this.solutionSize = 0
    this.solution = null
  }
}

Block.HEADER_BYTE_SIZE = 80
Block.ZCASH_HEADER_BYTE_SIZE = 1487

Block.fromBuffer = function (buffer, network) {
  if (buffer.length < 80) throw new Error('Buffer too small (< 80 bytes)')
  network = network || networks.bitcoin

  const bufferReader = new bufferutils.BufferReader(buffer)

  var block = new Block(network)
  block.version = bufferReader.readInt32()
  block.prevHash = bufferReader.readSlice(32)
  block.merkleRoot = bufferReader.readSlice(32)
  if (coins.isZcash(network)) {
    block.finalSaplingRoot = bufferReader.readSlice(32)
  }
  block.timestamp = bufferReader.readUInt32()
  block.bits = bufferReader.readUInt32()
  if (coins.isZcash(network)) {
    block.nonce = bufferReader.readSlice(32)
    block.solutionSize = bufferReader.readVarInt()
    block.solution = bufferReader.readSlice(1344)
  } else {
    // Not sure sure why the nonce is read as UInt 32 and not as a slice
    block.nonce = bufferReader.readUInt32()
  }

  if (bufferReader.buffer.length === 80) return block

  function readTransaction () {
    var tx = Transaction.fromBuffer(buffer.slice(bufferReader.offset), network, true)
    bufferReader.offset += tx.byteLength()
    return tx
  }

  var nTransactions = bufferReader.readVarInt()
  block.transactions = []

  for (var i = 0; i < nTransactions; ++i) {
    var tx = readTransaction()
    block.transactions.push(tx)
  }

  return block
}

Block.prototype.byteLength = function (headersOnly) {
  if (coins.isZcash(this.network)) {
    if (headersOnly) {
      return Block.ZCASH_HEADER_BYTE_SIZE
    }
    return Block.ZCASH_HEADER_BYTE_SIZE +
      varuint.encodingLength(this.transactions.length) + this.transactions.reduce(function (a, x) {
        return a + x.byteLength()
      }, 0)
  }

  if (headersOnly || !this.transactions) return Block.HEADER_BYTE_SIZE

  return Block.HEADER_BYTE_SIZE +
    varuint.encodingLength(this.transactions.length) + this.transactions.reduce(function (a, x) {
      return a + x.byteLength()
    }, 0)
}

Block.fromHex = function (hex, network) {
  return Block.fromBuffer(Buffer.from(hex, 'hex'), network)
}

Block.prototype.getHash = function () {
  return bcrypto.hash256(this.toBuffer(true))
}

Block.prototype.getId = function () {
  return this.getHash().reverse().toString('hex')
}

Block.prototype.getUTCDate = function () {
  var date = new Date(0) // epoch
  date.setUTCSeconds(this.timestamp)

  return date
}

// TODO: buffer, offset compatibility
Block.prototype.toBuffer = function (headersOnly) {
  var buffer = Buffer.allocUnsafe(this.byteLength(headersOnly))
  var bufferWriter = new bufferutils.BufferWriter(buffer)

  bufferWriter.writeInt32(this.version)
  bufferWriter.writeSlice(this.prevHash)
  bufferWriter.writeSlice(this.merkleRoot)
  if (coins.isZcash(this.network)) {
    bufferWriter.writeSlice(this.finalSaplingRoot)
  }
  bufferWriter.writeUInt32(this.timestamp)
  bufferWriter.writeUInt32(this.bits)
  if (coins.isZcash(this.network)) {
    bufferWriter.writeSlice(this.nonce)
    // TODO: use writeVarInt
    varuint.encode(this.solutionSize, bufferWriter.buffer, bufferWriter.offset)
    bufferWriter.offset += varuint.encode.bytes
    bufferWriter.writeSlice(this.solution)
  } else {
    // Not sure sure why the nonce is interpreted as UInt 32 and not a slice in bitcoin
    bufferWriter.writeUInt32(this.nonce)
  }

  if (headersOnly || !this.transactions) return buffer

  // TODO: use writeVarInt
  varuint.encode(this.transactions.length, bufferWriter.buffer, bufferWriter.offset)
  bufferWriter.offset += varuint.encode.bytes

  // TODO: use writeVarInt
  this.transactions.forEach(function (tx) {
    var txSize = tx.byteLength() // TODO: extract from toBuffer?
    tx.toBuffer(bufferWriter.buffer, bufferWriter.offset)
    bufferWriter.offset += txSize
  })

  return buffer
}

Block.prototype.toHex = function (headersOnly) {
  return this.toBuffer(headersOnly).toString('hex')
}

Block.calculateTarget = function (bits) {
  var exponent = ((bits & 0xff000000) >> 24) - 3
  var mantissa = bits & 0x007fffff
  var target = Buffer.alloc(32, 0)
  if (exponent < 0) {
    // If it is negative, we will overflow the target buffer so we have to slice the mantissa to fit
    mantissa = mantissa >> (8 * Math.abs(exponent))
    target.writeUInt32BE(mantissa, 28)
  } else if (exponent > 28) {
    // If it is greater than 28, we need to shift the mantissa since the offset cannot be greater than 32 - 4
    // (safe-buffer restriction)
    mantissa <<= 8 * (exponent - 28)
    target.writeUInt32BE(mantissa, 0)
  } else {
    target.writeUInt32BE(mantissa, 28 - exponent)
  }
  return target
}

Block.calculateMerkleRoot = function (transactions) {
  typeforce([{ getHash: types.Function }], transactions)
  if (transactions.length === 0) throw TypeError('Cannot compute merkle root for zero transactions')

  var hashes = transactions.map(function (transaction) {
    return transaction.getHash()
  })

  return fastMerkleRoot(hashes, bcrypto.hash256)
}

Block.prototype.checkMerkleRoot = function () {
  if (!this.transactions) return false

  var actualMerkleRoot = Block.calculateMerkleRoot(this.transactions)
  return this.merkleRoot.compare(actualMerkleRoot) === 0
}

Block.prototype.checkProofOfWork = function () {
  var hash = this.getHash().reverse()
  var target = Block.calculateTarget(this.bits)

  return hash.compare(target) <= 0
}

module.exports = Block
