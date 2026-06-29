const assert = require('nanoassert');
const wasm = require('./blake2b')();

let head = 64;
const freeList = [];

module.exports = Blake2b;
const BYTES_MIN = (module.exports.BYTES_MIN = 16);
const BYTES_MAX = (module.exports.BYTES_MAX = 64);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BYTES = (module.exports.BYTES = 32);
const KEYBYTES_MIN = (module.exports.KEYBYTES_MIN = 16);
const KEYBYTES_MAX = (module.exports.KEYBYTES_MAX = 64);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const KEYBYTES = (module.exports.KEYBYTES = 32);
const SALTBYTES = (module.exports.SALTBYTES = 16);
const PERSONALBYTES = (module.exports.PERSONALBYTES = 16);

function Blake2b(digestLength, key, salt, personal, noAssert) {
  if (!(this instanceof Blake2b)) return new Blake2b(digestLength, key, salt, personal, noAssert);
  if (!(wasm && wasm.exports)) throw new Error('WASM not loaded. Wait for Blake2b.ready(cb)');
  if (!digestLength) digestLength = 32;

  if (noAssert !== true) {
    assert(digestLength >= BYTES_MIN, 'digestLength must be at least ' + BYTES_MIN + ', was given ' + digestLength);
    assert(digestLength <= BYTES_MAX, 'digestLength must be at most ' + BYTES_MAX + ', was given ' + digestLength);
    if (key != null) {
      assert(key instanceof Uint8Array, 'key must be Uint8Array or Buffer');
      assert(key.length >= KEYBYTES_MIN, 'key must be at least ' + KEYBYTES_MIN + ', was given ' + key.length);
      assert(key.length <= KEYBYTES_MAX, 'key must be at least ' + KEYBYTES_MAX + ', was given ' + key.length);
    }
    if (salt != null) {
      assert(salt instanceof Uint8Array, 'salt must be Uint8Array or Buffer');
      assert(salt.length === SALTBYTES, 'salt must be exactly ' + SALTBYTES + ', was given ' + salt.length);
    }
    if (personal != null) {
      assert(personal instanceof Uint8Array, 'personal must be Uint8Array or Buffer');
      assert(
        personal.length === PERSONALBYTES,
        'personal must be exactly ' + PERSONALBYTES + ', was given ' + personal.length
      );
    }
  }

  if (!freeList.length) {
    freeList.push(head);
    head += 216;
  }

  this.digestLength = digestLength;
  this.finalized = false;
  this.pointer = freeList.pop();

  wasm.memory.fill(0, 0, 64);
  wasm.memory[0] = this.digestLength;
  wasm.memory[1] = key ? key.length : 0;
  wasm.memory[2] = 1; // fanout
  wasm.memory[3] = 1; // depth

  if (salt) wasm.memory.set(salt, 32);
  if (personal) wasm.memory.set(personal, 48);

  if (this.pointer + 216 > wasm.memory.length) wasm.realloc(this.pointer + 216); // we need 216 bytes for the state
  wasm.exports.blake2b_init(this.pointer, this.digestLength);

  if (key) {
    this.update(key);
    wasm.memory.fill(0, head, head + key.length); // whiteout key
    wasm.memory[this.pointer + 200] = 128;
  }
}

Blake2b.prototype.update = function (input) {
  assert(this.finalized === false, 'Hash instance finalized');
  assert(input instanceof Uint8Array, 'input must be Uint8Array or Buffer');

  if (head + input.length > wasm.memory.length) wasm.realloc(head + input.length);
  wasm.memory.set(input, head);
  wasm.exports.blake2b_update(this.pointer, head, head + input.length);
  return this;
};

Blake2b.prototype.digest = function (enc) {
  assert(this.finalized === false, 'Hash instance finalized');
  this.finalized = true;

  freeList.push(this.pointer);
  wasm.exports.blake2b_final(this.pointer);

  if (!enc || enc === 'binary') {
    return wasm.memory.slice(this.pointer + 128, this.pointer + 128 + this.digestLength);
  }

  if (enc === 'hex') {
    return hexSlice(wasm.memory, this.pointer + 128, this.digestLength);
  }

  assert(enc instanceof Uint8Array && enc.length >= this.digestLength, 'input must be Uint8Array or Buffer');
  for (let i = 0; i < this.digestLength; i++) {
    enc[i] = wasm.memory[this.pointer + 128 + i];
  }

  return enc;
};

// libsodium compat
Blake2b.prototype.final = Blake2b.prototype.digest;

Blake2b.WASM = wasm && wasm.buffer;
Blake2b.SUPPORTED = typeof WebAssembly !== 'undefined';

Blake2b.ready = function (cb) {
  if (!cb) cb = noop;
  if (!wasm) return cb(new Error('WebAssembly not supported'));

  // backwards compat, can be removed in a new major
  const p = new Promise(function (reject, resolve) {
    wasm.onload(function (err) {
      if (err) resolve();
      else reject();
      cb(err);
    });
  });

  return p;
};

Blake2b.prototype.ready = Blake2b.ready;

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

function hexSlice(buf, start, len) {
  let str = '';
  for (let i = 0; i < len; i++) str += toHex(buf[start + i]);
  return str;
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}
