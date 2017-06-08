var fs = require('fs')
var buf = toUint8Array(fs.readFileSync(__dirname + '/blake2b.wasm', 'base64'))
var rdy

var head = 64
var mod = null
var memory = null
var freeList = []

module.exports = Blake2b

function Blake2b (digestLength, key, salt, personal) {
  if (!(this instanceof Blake2b)) return new Blake2b(digestLength, key, salt, personal)
  if (!mod) throw new Error('WASM not loaded. Wait for Blake2b.ready(cb)')

  if (!freeList.length) {
    freeList.push(head)
    head += 216
  }

  this.digestLength = digestLength || 32
  this.finalized = false
  this.pointer = freeList.pop()

  memory.fill(0, 0, 64)
  memory[0] = this.digestLength
  memory[1] = key ? key.length : 0
  memory[2] = 1 // fanout
  memory[3] = 1 // depth

  if (salt) memory.set(salt, 32)
  if (personal) memory.set(personal, 48)

  mod.blake2b_init(this.pointer, this.digestLength)

  if (key) {
    this.update(key)
    memory.fill(0, head, head + key.length) // whiteout key
    memory[this.pointer + 200] = 128
  }
}

Blake2b.prototype.ready = Blake2b.ready

Blake2b.prototype.update = function (input) {
  if (this.finalized) throw new Error('Hash instance finalized')

  memory.set(input, head)
  mod.blake2b_update(this.pointer, head, head + input.length)
  return this
}

Blake2b.prototype.digest = function (enc) {
  if (this.finalized) throw new Error('Hash instance finalized')
  this.finalized = true

  freeList.push(this.pointer)
  mod.blake2b_final(this.pointer)

  if (!enc || enc === 'binary') {
    return memory.slice(this.pointer + 128, this.pointer + 128 + this.digestLength)
  }

  if (enc === 'hex') {
    return hexSlice(memory, this.pointer + 128, this.digestLength)
  }

  for (var i = 0; i < this.digestLength; i++) {
    enc[i] = memory[this.pointer + 128 + i]
  }

  return enc
}

Blake2b.WASM = buf
Blake2b.SUPPORTED = typeof WebAssembly !== 'undefined'

Blake2b.ready = function (cb) {
  if (!cb) cb = noop
  if (!Blake2b.SUPPORTED) return cb(new Error('WebAssembly not supported'))

  if (!rdy) {
    rdy = WebAssembly.instantiate(buf).then(setup)
  }

  return rdy.then(cb).catch(cb)
}

function noop () {}

function hexSlice (buf, start, len) {
  var str = ''
  for (var i = 0; i < len; i++) str += toHex(buf[start + i])
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function setup (w) {
  mod = w.instance.exports
  memory = new Uint8Array(w.instance.exports.memory.buffer)
}

function toUint8Array (s) {
  if (typeof atob === 'function') {
    return new Uint8Array(atob(s).split('').map(charCodeAt))
  }
  var b = require('buf' + 'fer')
  return new b.Buffer(s, 'base64')
}

function charCodeAt (c) {
  return c.charCodeAt(0)
}
