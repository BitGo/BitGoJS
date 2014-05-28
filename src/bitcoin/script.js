var Address = require('./address');
var Crypto = require('./crypto-js/index');
var Opcode = require('./opcode');
var Util = require('./util');

var ops = Opcode.map;

var Script = function (data) {
  if (!data) {
    this.buffer = [];
  } else if ("string" == typeof data) {
    this.buffer = Crypto.util.hexToBytes(data);
  } else if (Util.isArray(data)) {
    this.buffer = data;
  } else if (data instanceof Script) {
    this.buffer = data.buffer;
  } else {
    throw new Error("Invalid script");
  }

  this.parse();
};

/**
 * Update the parsed script representation.
 *
 * Each Script object stores the script in two formats. First as a raw byte
 * array and second as an array of "chunks", such as opcodes and pieces of
 * data.
 *
 * This method updates the chunks cache. Normally this is called by the
 * constructor and you don't need to worry about it. However, if you change
 * the script buffer manually, you should update the chunks using this method.
 */
Script.prototype.parse = function () {
  var self = this;

  this.chunks = [];

  // Cursor
  var i = 0;

  // Read n bytes and store result as a chunk
  function readChunk(n) {
    self.chunks.push(self.buffer.slice(i, i + n));
    i += n;
  };

  while (i < this.buffer.length) {
    var opcode = this.buffer[i++];
    if (opcode >= 0xF0) {
      // Two byte opcode
      opcode = (opcode << 8) | this.buffer[i++];
    }

    var len;
    if (opcode > 0 && opcode < ops.OP_PUSHDATA1) {
      // Read some bytes of data, opcode value is the length of data
      readChunk(opcode);
    } else if (opcode == ops.OP_PUSHDATA1) {
      len = this.buffer[i++];
      readChunk(len);
    } else if (opcode == ops.OP_PUSHDATA2) {
      len = (this.buffer[i++] << 8) | this.buffer[i++];
      readChunk(len);
    } else if (opcode == ops.OP_PUSHDATA4) {
      len = (this.buffer[i++] << 24) |
        (this.buffer[i++] << 16) |
        (this.buffer[i++] << 8) |
        this.buffer[i++];
      readChunk(len);
    } else {
      this.chunks.push(opcode);
    }
  }
};

/**
 * Compare the script to known templates of scriptPubKey.
 *
 * This method will compare the script to a small number of standard script
 * templates and return a string naming the detected type.
 *
 * Currently supported are:
 * Address:
 *   Paying to a Bitcoin address which is the hash of a pubkey.
 *   OP_DUP OP_HASH160 [pubKeyHash] OP_EQUALVERIFY OP_CHECKSIG
 *
 * Pubkey:
 *   Paying to a public key directly.
 *   [pubKey] OP_CHECKSIG
 *
 * Strange:
 *   Any other script (no template matched).
 */
Script.prototype.getOutType = function () {
  if (this.chunks[this.chunks.length-1] == ops.OP_CHECKMULTISIG &&
      this.chunks[this.chunks.length-2] <= ops.OP_1 + 2 &&
      this.chunks[0] >= ops.OP_1 && this.chunks[0] <= ops.OP_16) {
    // Transfer to M-OF-N
    return 'Multisig';
  } else if (this.chunks.length == 5 &&
      this.chunks[0] == ops.OP_DUP &&
      this.chunks[1] == ops.OP_HASH160 &&
      this.chunks[3] == ops.OP_EQUALVERIFY &&
      this.chunks[4] == ops.OP_CHECKSIG) {
    // Transfer to Bitcoin address
    return 'Address';
  } else if (this.chunks.length == 3 &&
      this.chunks[0] == ops.OP_HASH160 &&
      this.chunks[2] == ops.OP_EQUAL) {
    return 'P2SH';
  } else if (this.chunks.length == 2 &&
      this.chunks[1] == ops.OP_CHECKSIG) {
    // Transfer to IP address
    return 'Pubkey';
  } else {
    return 'Strange';
  }
}


/**
 * Returns the affected address hash for this output.
 *
 * For standard transactions, this will return the hash of the pubKey that
 * can spend this output.
 *
 * In the future, for payToScriptHash outputs, this will return the
 * scriptHash. Note that non-standard and standard payToScriptHash transactions
 * look the same
 *
 * This method is useful for indexing transactions.
 */
Script.prototype.simpleOutHash = function ()
{
  switch (this.getOutType()) {
  case 'Address':
    return this.chunks[2];
  case 'Pubkey':
    return Util.sha256ripe160(this.chunks[0]);
  case 'P2SH':
    return this.chunks[1];
  default:
    throw new Error("Encountered non-standard scriptPubKey");
  }
};

/**
 * Old name for Script#simpleOutHash.
 *
 * @deprecated
 */
Script.prototype.simpleOutPubKeyHash = Script.prototype.simpleOutHash;

/**
 * Compare the script to known templates of scriptSig.
 *
 * This method will compare the script to a small number of standard script
 * templates and return a string naming the detected type.
 *
 * WARNING: Use this method with caution. It merely represents a heuristic
 * based on common transaction formats. A non-standard transaction could
 * very easily match one of these templates by accident.
 *
 * Currently supported are:
 * Address:
 *   Paying to a Bitcoin address which is the hash of a pubkey.
 *   [sig] [pubKey]
 *
 * Pubkey:
 *   Paying to a public key directly.
 *   [sig]
 *
 * Strange:
 *   Any other script (no template matched).
 */
Script.prototype.getInType = function ()
{
  var chunks = this.chunks;
  if (chunks.length == 1 &&
      Util.isArray(chunks[0])) {
    // Direct IP to IP transactions only have the signature in their scriptSig.
    // TODO: We could also check that the length of the data is correct.
    return 'Pubkey';
  } else if (chunks.length == 2 &&
             Util.isArray(chunks[0]) &&
             Util.isArray(chunks[1])) {
    return 'Address';
  } else if (chunks[0] == ops.OP_0 &&
      chunks.slice(1).reduce(function(t, chunk, i) {
          // Partially signed transactions may have a place holder OP_0.
          return t && (chunk == ops.OP_0 || (Array.isArray(chunk) && (chunk[0] == 48 || i == chunks.length - 2)));
      }, true)) {
      return 'Multisig';
  } else {
    return 'Strange';
  }
};

/**
 * Add an op code to the script.
 */
Script.prototype.writeOp = function (opcode)
{
  this.buffer.push(opcode);
  this.chunks.push(opcode);
};

/**
 * Add a data chunk to the script.
 */
Script.prototype.writeBytes = function (data)
{
  if (data.length < ops.OP_PUSHDATA1) {
    this.buffer.push(data.length);
  } else if (data.length <= 0xff) {
    this.buffer.push(ops.OP_PUSHDATA1);
    this.buffer.push(data.length);
  } else if (data.length <= 0xffff) {
    this.buffer.push(ops.OP_PUSHDATA2);
    this.buffer.push(data.length & 0xff);
    this.buffer.push((data.length >>> 8) & 0xff);
  } else {
    this.buffer.push(ops.OP_PUSHDATA4);
    this.buffer.push(data.length & 0xff);
    this.buffer.push((data.length >>> 8) & 0xff);
    this.buffer.push((data.length >>> 16) & 0xff);
    this.buffer.push((data.length >>> 24) & 0xff);
  }
  this.buffer = this.buffer.concat(data);
  this.chunks.push(data);
};

/**
 * Create a standard payToPubKeyHash output.
 */
Script.createOutputScript = function (address)
{
  if (!(address instanceof Address)) {
    throw 'invalid argument';
  }

  var script = new Script();
  if (address.version == Address.pubKeyHashVersion) {
    script.writeOp(ops.OP_DUP);
    script.writeOp(ops.OP_HASH160);
    script.writeBytes(address.hash);
    script.writeOp(ops.OP_EQUALVERIFY);
    script.writeOp(ops.OP_CHECKSIG);
  } else if (address.version == Address.p2shVersion) {
    script.writeOp(ops.OP_HASH160);
    script.writeBytes(address.hash);
    script.writeOp(ops.OP_EQUAL);
  } else {
    throw "Unknown address version";
  }
  return script;
};

/**
 * Extract bitcoin addresses from an output script
 */
Script.prototype.extractAddresses = function (addresses)
{
  if (!addresses || !Array.isArray(addresses)) {
    throw new Error('addresses is not an array');
  }
  switch (this.getOutType()) {
  case 'Address':
    addresses.push(new Address(this.chunks[2]));
    return 1;
  case 'Pubkey':
    addresses.push(new Address(Util.sha256ripe160(this.chunks[0])));
    return 1;
  case 'P2SH':
    addresses.push(new Address(this.chunks[1], Address.p2shVersion));
    return 1;
  case 'Multisig':
    var pubKeys = [];
    var count = this.extractMultiSigPubKeys(pubKeys);
    for (var index = 0; index < pubKeys.length; ++index) {
      addresses.push(new Address(Util.sha256ripe160(pubKeys[index])));
    }
    return addresses.length;
  default:
    throw new Error("non-standard script");
  }
};

/**
 * Extract bitcoin addresses from a multi-sigscript
 */
Script.prototype.extractMultiSigPubKeys = function (keys)
{
  if (this.chunks.length == 0 ||
      this.chunks[this.chunks.length - 1] != ops.OP_CHECKMULTISIG ||
      this.chunks[this.chunks.length - 2] > ops.OP_1 + 2) {
    throw 'not a multisig script';
  }
  for (var i = 1; i < this.chunks.length-2; ++i) {
    keys.push(this.chunks[i]);
  }
  return this.chunks[4] - ops.OP_1 + 1;
};

/**
 * Create an m-of-n script.
 * This can either be a multi-signature output or the
 * P2SH input script.
 */
Script.createMultiSigScript = function (m, pubkeys)
{
  var script = new Script();

  script.writeOp(ops.OP_1 + m - 1);

  for (var i = 0; i < pubkeys.length; ++i) {
    script.writeBytes(pubkeys[i]);
  }

  script.writeOp(ops.OP_1 + pubkeys.length - 1);

  script.writeOp(ops.OP_CHECKMULTISIG);

  return script;
};

/**
 * Create a standard payToPubKeyHash input.
 */
Script.createInputScript = function (signature, pubKey)
{
  var script = new Script();
  script.writeBytes(signature);
  script.writeBytes(pubKey);
  return script;
};

Script.prototype.clone = function ()
{
  return new Script(this.buffer);
};

module.exports = Script;
