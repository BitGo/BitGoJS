var Address = require('./address');
var BigInteger = require('./jsbn/jsbn2');
var Crypto = require('./crypto-js/index');
var ECKey = require('./eckey');
var Opcode = require('./opcode');
var Script = require('./script');
var Util = require('./util');

var Transaction = Transaction = function (doc) {
  this.version = 1;
  this.locktime = 0;
  this.ins = [];
  this.outs = [];
  this.timestamp = null;
  this.block = null;

  if (doc) {
    if (doc.version) this.version = doc.version;
    if (doc.locktime) this.locktime = doc.locktime;
    if (doc.ins && doc.ins.length) {
      for (var i = 0; i < doc.ins.length; i++) {
        this.addInput(new TransactionIn(doc.ins[i]));
      }
    }
    if (doc.outs && doc.outs.length) {
      for (var i = 0; i < doc.outs.length; i++) {
        this.addOutput(new TransactionOut(doc.outs[i]));
      }
    }
    if (doc.timestamp) this.timestamp = doc.timestamp;
    if (doc.block) this.block = doc.block;
  }
};

/**
 * Create a new txin.
 *
 * Can be called with an existing TransactionIn object to add it to the
 * transaction. Or it can be called with a Transaction object and an integer
 * output index, in which case a new TransactionIn object pointing to the
 * referenced output will be created.
 *
 * Note that this method does not sign the created input.
 */
Transaction.prototype.addInput = function (tx, outIndex) {
  if (arguments[0] instanceof TransactionIn) {
    this.ins.push(arguments[0]);
    return;
  }

  if (!(tx instanceof Transaction) || typeof(outIndex) != 'number') {
    throw new Error('invalid argument');
  }

  // txHash should be a hex-encoded string.

  this.ins.push(new TransactionIn({
    outpoint: {
      hash: Util.bytesToHex(tx.getHashBytes()),
      index: outIndex
    },
    script: tx.outs[outIndex].script,
    sequence: 4294967295
  }));
};

Transaction.prototype.clearInputs = function (tx) {
  this.ins = [];
};

/**
 * Serialize this transaction.
 *
 * Returns the transaction as a byte array in the standard Bitcoin binary
 * format. This method is byte-perfect, i.e. the resulting byte array can
 * be hashed to get the transaction's standard Bitcoin hash.
 */
Transaction.prototype.serialize = function ()
{
  var buffer = [];
  buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(this.version)]).reverse());
  buffer = buffer.concat(Util.numToVarInt(this.ins.length));
  for (var i = 0; i < this.ins.length; i++) {
    var txin = this.ins[i];
    buffer = buffer.concat(Crypto.util.hexToBytes(txin.outpoint.hash).reverse());
    buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(txin.outpoint.index)]).reverse());
    var scriptBytes = txin.script.buffer;
    buffer = buffer.concat(Util.numToVarInt(scriptBytes.length));
    buffer = buffer.concat(scriptBytes);
    buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(txin.sequence)]).reverse());
  }
  buffer = buffer.concat(Util.numToVarInt(this.outs.length));
  for (var i = 0; i < this.outs.length; i++) {
    var txout = this.outs[i];
    buffer = buffer.concat(Util.numToBytes(txout.value, 8));
    var scriptBytes = txout.script.buffer;
    buffer = buffer.concat(Util.numToVarInt(scriptBytes.length));
    buffer = buffer.concat(scriptBytes);
  }
  buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(this.locktime)]).reverse());

  return buffer;
};

var OP_CODESEPARATOR = 171;

var SIGHASH_ALL = 1;
var SIGHASH_NONE = 2;
var SIGHASH_SINGLE = 3;
var SIGHASH_ANYONECANPAY = 80;

/**
 * Hash transaction for signing a specific input.
 *
 * Bitcoin uses a different hash for each signed transaction input. This
 * method copies the transaction, makes the necessary changes based on the
 * hashType, serializes and finally hashes the result. This hash can then be
 * used to sign the transaction input in question.
 */
Transaction.prototype.hashTransactionForSignature =
function (connectedScript, inIndex, hashType)
{
  var txTmp = this.clone();

  // In case concatenating two scripts ends up with two codeseparators,
  // or an extra one at the end, this prevents all those possible
  // incompatibilities.
  /*scriptCode = scriptCode.filter(function (val) {
   return val !== OP_CODESEPARATOR;
   });*/

  // Blank out other inputs' signatures
  for (var i = 0; i < txTmp.ins.length; i++) {
    txTmp.ins[i].script = new Script();
  }

  txTmp.ins[inIndex].script = connectedScript;

  // Blank out some of the outputs
  if ((hashType & 0x1f) == SIGHASH_NONE) {
    txTmp.outs = [];

    // Let the others update at will
    for (var i = 0; i < txTmp.ins.length; i++)
      if (i != inIndex)
        txTmp.ins[i].sequence = 0;
  } else if ((hashType & 0x1f) == SIGHASH_SINGLE) {
    throw new Error('sighash_single not implemented');
  }

  // Blank out other inputs completely, not recommended for open transactions
  if (hashType & SIGHASH_ANYONECANPAY) {
    txTmp.ins = [txTmp.ins[inIndex]];
  }

  var buffer = txTmp.serialize();

  buffer = buffer.concat(Crypto.util.wordsToBytes([parseInt(hashType)]).reverse());

  var hash1 = Crypto.SHA256(buffer, {asBytes: true});

  return Crypto.SHA256(hash1, {asBytes: true});
};

/**
 * Calculate and return the transaction's hash.
 */
Transaction.prototype.getHashBytes = function ()
{
  var buffer = this.serialize();
  return Crypto.SHA256(Crypto.SHA256(buffer, {asBytes: true}), {asBytes: true});
};

/**
 * Create a copy of this transaction object.
 */
Transaction.prototype.clone = function ()
{
  var newTx = new Transaction();
  newTx.version = this.version;
  newTx.locktime = this.locktime;
  for (var i = 0; i < this.ins.length; i++) {
    var txin = this.ins[i].clone();
    newTx.addInput(txin);
  }
  for (var i = 0; i < this.outs.length; i++) {
    var txout = this.outs[i].clone();
    newTx.addOutput(txout);
  }
  return newTx;
};

/**
 * Get the total amount of a transaction's outputs.
 */
Transaction.prototype.getTotalOutValue = function () {
  var totalValue = 0
  for (var j = 0; j < this.outs.length; j++) {
    var txout = this.outs[j];
    totalValue += txout.value;
  }
  return totalValue;
};

/**
 * Old name for Transaction#getTotalOutValue.
 *
 * @deprecated
 */
Transaction.prototype.getTotalValue = Transaction.prototype.getTotalOutValue;

var TransactionIn = TransactionIn = function (data)
{
  if (!data || !(data.script instanceof Script) || !data.outpoint || !(typeof(data.outpoint.hash) == 'string') || !(typeof(data.outpoint.index) == 'number')) {
    throw new Error('illegal argument');
  }

  this.outpoint = data.outpoint;
  this.script = data.script;
  this.sequence = data.sequence;
};

TransactionIn.prototype.clone = function ()
{
  var newTxin = new TransactionIn({
    outpoint: {
      hash: this.outpoint.hash,
      index: this.outpoint.index
    },
    script: this.script.clone(),
    sequence: this.sequence
  });
  return newTxin;
};

var TransactionOut = TransactionOut = function (data)
{
  if (!data || !(data.script instanceof Script) || !(typeof(data.value) == 'number')) {
    throw new Error('invalid argument');
  }

  this.script = data.script;
  this.value = data.value;
};

TransactionOut.prototype.clone = function ()
{
  var newTxout = new TransactionOut({
    script: this.script.clone(),
    value: this.value
  });
  return newTxout;
};


//
// Utility functions for parsing
//
function uint(f, size) {
  if (f.length < size)
    return 0;
  var bytes = f.slice(0, size);
  var pos = 1;
  var n = 0;
  for (var i = 0; i < size; i++) {
    var b = f.shift();
    n += b * pos;
    pos *= 256;
  }
  return size <= 4 ? n : bytes;
}

function u8(f)  { return uint(f,1); }
function u16(f) { return uint(f,2); }
function u32(f) { return uint(f,4); }
function u64(f) { return uint(f,8); }

function errv(val) {
  return (val instanceof BigInteger || val > 0xffff);
}

function readBuffer(f, size) {
  var res = f.slice(0, size);
  for (var i = 0; i < size; i++) f.shift();
  return res;
}

function readString(f) {
  var len = readVarInt(f);
  if (errv(len)) return [];
  return readBuffer(f, len);
}

function readVarInt(f) {
  var t = u8(f);
  if (t == 0xfd) return u16(f); else
  if (t == 0xfe) return u32(f); else
  if (t == 0xff) return u64(f); else
  return t;
}

Transaction.deserialize = function(bytes) {
  var sendTx = new Transaction();

  var f = bytes.slice(0);  // creates a copy.
  var tx_ver = u32(f);
  if (tx_ver != 1) {
      return null;
  }
  var vin_sz = readVarInt(f);
  if (errv(vin_sz))
      return null;

  for (var i = 0; i < vin_sz; i++) {
      var op = readBuffer(f, 32);
      var n = u32(f);
      var script = readString(f);
      var seq = u32(f);
      var txin = new TransactionIn({
          outpoint: {
              hash: Crypto.util.bytesToHex(op.reverse()),
              index: n
          },
          script: new Script(script),
          sequence: seq
      });
      sendTx.addInput(txin);
  }

  var vout_sz = readVarInt(f);

  if (errv(vout_sz))
      return null;

  for (var i = 0; i < vout_sz; i++) {
      var value = u64(f);
      var script = readString(f);

      var txout = new TransactionOut({
          value: Util.bytesToNum(value),
          script: new Script(script)
      });

      sendTx.addOutput(txout);
  }
  var locktime = u32(f);
  sendTx.locktime = locktime;
  return sendTx;
};


// Verify the signature on an input.
// If the transaction is fully signed, returns a positive number representing the number of valid signatures.
// If the transaction is partially signed, returns a negative number representing the number of valid signatures.
Transaction.prototype.verifyInputSignatures = function(inputIndex, pubScript) {
  if (inputIndex < 0 || inputIndex >= this.ins.length) {
    throw new Error('illegal index');
  }
  if (!(pubScript instanceof Script)) {
    throw new Error('illegal argument');
  }

  var sigScript = this.ins[inputIndex].script;
  var sigsNeeded = 1;
  var sigs = [];
  var pubKeys = [];

  // Check the script type to determine number of signatures, the pub keys, and the script to hash.
  switch(sigScript.getInType()) {
    case 'Multisig':
      // Replace the pubScript with the P2SH Script.
      var p2shBytes = sigScript.chunks[sigScript.chunks.length -1];
      pubScript = new Script(p2shBytes);
      sigsNeeded = pubScript.chunks[0] - Opcode.map.OP_1 + 1;
      for (var index = 1; index < sigScript.chunks.length -1; ++index) {
        sigs.push(sigScript.chunks[index]);
      }
      for (var index = 1; index < pubScript.chunks.length - 2; ++index) {
        pubKeys.push(pubScript.chunks[index]);
      }
      break;
    case 'Address':
      sigsNeeded = 1;
      sigs.push(sigScript.chunks[0]);
      pubKeys.push(sigScript.chunks[1]);
      break;
    default:
      return 0;
      break;
  }

  var numVerifiedSignatures = 0;
  for (var sigIndex = 0; sigIndex < sigs.length; ++sigIndex) {
    // If this is an OP_0, then its been left as a placeholder for a future sig.
    if (sigs[sigIndex] == Opcode.map.OP_0) {
      continue;
    }

    var hashType = sigs[sigIndex].pop();
    var signatureHash = this.hashTransactionForSignature(pubScript, inputIndex, hashType);

    var validSig = false;

    // Enumerate the possible public keys
    for (var pubKeyIndex = 0; pubKeyIndex < pubKeys.length; ++pubKeyIndex) {
      var pubKey = new ECKey().setPub(pubKeys[pubKeyIndex]);
      validSig = pubKey.verify(signatureHash, sigs[sigIndex]);
      if (validSig) {
        pubKeys.splice(pubKeyIndex, 1);  // remove the pubkey so we can't match 2 sigs against the same pubkey
        break;
      }
    }
    if (!validSig) {
      throw new Error('invalid signature');
    }
    numVerifiedSignatures++;
  }

  if (numVerifiedSignatures < sigsNeeded) {
    numVerifiedSignatures = -numVerifiedSignatures;
  }
  return numVerifiedSignatures;
};


// Verify that all inputs in a transaction are signed.
// Returns the number of inputs that are fully signed.
Transaction.prototype.verifySignatures = function(inputScripts) {
  if (!(inputScripts instanceof Array)) {
    throw new Error('illegal argument');
  } else {
    for (var index = 0; index < inputScripts.length; ++index) {
      if (typeof(inputScripts[index]) == 'string') {
        inputScripts[index] = new Script(Util.hexToBytes(inputScripts[index]));
      }
      if (!(inputScripts[index] instanceof Script)) {
        throw new Error('illegal argument');
      }
    };
  }

  var numVerifiedSignatures = 0;
  for (var inputIndex = 0; inputIndex < this.ins.length; ++inputIndex) {
    try {
      var fullySigned = (this.verifyInputSignatures(inputIndex, inputScripts[inputIndex]) > 0);
      if (fullySigned) {
        numVerifiedSignatures++;
      }
    } catch (e) {
    }
  }
  return numVerifiedSignatures;
};

//
// A Proof is information needed to sign a particular input.
//

// Create a proof for a single-key input
Transaction.prototype.createStandardProof = function(key) {
  if (!(key instanceof ECKey)) { throw new Error('invalid argument'); }

  return {
    hash: Util.bytesToHex(key.getPubKeyHash()),
    key: key
  }
};

Transaction.prototype.createP2SHProof = function(redeemScript) {
  if (!(redeemScript instanceof Script)) { throw new Error('invalid argument'); }

  return {
    scriptHash: Util.bytesToHex(Util.sha256ripe160(redeemScript.buffer)),
    redeemScript: redeemScript
  }
};

// Sign a specific input.
Transaction.prototype.signInput = function(inputIndex, proof, hashType) {
  // 1. Verify that the proof matches the input.
  // 2. Sign it.

  hashType = hashType || SIGHASH_ALL;

  if (inputIndex < 0 || inputIndex >= this.ins.length) {
    throw new Error('illegal index');
  }

  var input = this.ins[inputIndex];

  if (input.script.chunks.length == 0) {
    throw new Error('transaction input missing script');
  }

  var scriptType = input.script.getOutType();

  if (scriptType == 'Address') {
    if (Util.bytesToHex(input.script.simpleOutHash()) != proof.hash) {
      throw new Error('invalid proof');
    }
    var hash = this.hashTransactionForSignature(input.script, inputIndex, hashType);
    var signature = proof.key.sign(hash);
    signature.push(parseInt(hashType, 10));
    input.script = Script.createInputScript(signature, proof.key.getPub());
    return true;
  }

  if (scriptType == 'P2SH') {
    if (Util.bytesToHex(input.script.simpleOutHash()) != proof.scriptHash) {
      throw new Error('invalid proof');
    }

    var numSigsRequired = proof.redeemScript.chunks[0] - Opcode.map.OP_1 + 1;
    if (numSigsRequired < 0 || numSigsRequired > 15) {
      throw new Error("Can't determine required number of signatures");
    }

    // Replace the input script with a MultiSig style input signature.
    // For now we leave OP_0 placeholders for all the actual sigs.
    var script = new Script();
    script.writeOp(Opcode.map.OP_0);  // BIP11 requires this leading OP_0.
    for (var index = 0; index < numSigsRequired; ++index) {
      script.writeOp(Opcode.map.OP_0);  // A placeholder for each sig
    }
    script.writeBytes(proof.redeemScript.buffer);  // The redeemScript itself.
    input.script = script;

    // At this point, the script looks like a "Multisig" out script, because
    // we've actually replaced it with a multi-sig placeholder for P2SH
    return false;  // return false because we didn't actually sign anything
  }

  if (scriptType == 'Strange') {
    // We hope this is a partially signed transaction and that the script is now:
    //    0 [sig] [sig] ... [redeemScript]

    // Verify that a key is actually valid for this P2SH redeemScript.
    var redeemScriptContainsPubKey = function(redeemScript, key) {
      if (!(key instanceof ECKey)) { throw new Error('invalid argument'); }
      if (!(redeemScript instanceof Script)) { throw new Error('invalid argument'); }
      var pubKey = key.getPub().toString();
      for (var pubKeyIndex = 1; pubKeyIndex < redeemScript.chunks.length - 2; ++pubKeyIndex) {
        var redeemScriptPubKey = redeemScript.chunks[pubKeyIndex]
        if (redeemScriptPubKey.toString() == pubKey.toString()) {
          return true;
        }
      }
      return false;
    };

    // Returns true if this key has already signed this script
    var isDuplicateSignature = function(script, hashToSign, numSigsRequired, key) {
      for (var index = 1; index < 1 + numSigsRequired; ++index) {
        if (script.chunks[index] == 0) {
          break;  // No more signatures to check
        }
        var oldSig = script.chunks[index].slice(0);  // make a copy of the old sig
        oldSig.pop();  // Remove the hashtype.
        if (key.verify(hashToSign, oldSig)) {
          return true;
        }
      }
      return false;
    }

    var redeemScript = new Script(input.script.chunks[input.script.chunks.length - 1]);
    if (redeemScript.getOutType() != 'Multisig') {
      throw new Error('unrecognized input type');
    }
    var numSigsRequired = redeemScript.chunks[0] - Opcode.map.OP_1 + 1;

    if (numSigsRequired < 0 || numSigsRequired > 15) {
      throw new Error("Can't determine required number of signatures");
    }

    var hashToSign = this.hashTransactionForSignature(redeemScript, inputIndex, hashType);

    // Create a new script, insert the leading OP_0.
    var script = new Script();
    script.writeOp(Opcode.map.OP_0);

    // For the rest of the sigs, either copy or insert a new one.
    var signed = false;
    for (var index = 1; index < 1 + numSigsRequired; ++index) {
      if (input.script.chunks[index] != 0) {  // Already signed case
        script.writeBytes(input.script.chunks[index]);
        continue;
      }
      if (!signed) {
        if (!redeemScriptContainsPubKey(redeemScript, proof.key)) {
          return false;
        }

        if (isDuplicateSignature(input.script, hashToSign, numSigsRequired, proof.key)) {
          return false;
        }

        var signature = proof.key.sign(hashToSign);
        signature.push(parseInt(hashType, 10));
        script.writeBytes(signature);  // Apply the signature
        signed = true;
      } else {
        // Write another placeholder.
        script.writeOp(Opcode.map.OP_0);
      }
    }
    // Finally, record the redeemScript itself and we're done.
    script.writeBytes(redeemScript.buffer);
    this.ins[inputIndex].script = script;
    return true;
  }

  return false;
};

// Convenience method for signing a single input with a key
// Returns true if it could sign, false otherwise.
Transaction.prototype.signInputWithKey = function(inputIndex, key) {
  try {
    var proof = this.createStandardProof(key);
    return this.signInput(inputIndex, proof, SIGHASH_ALL);
  } catch (e) {
    // Couldn't sign this input.  Continue.
  }
  return false;
};

// Convenience method for signing a multi-sig script with a key
// Returns true if it could sign, false otherwise.
Transaction.prototype.signMultiSigWithKey = function(inputIndex, key, redeemScript) {
  try {
    // Before any signatures are present, it looks like a P2SH sigScript.
    // Convert it to a MultiSig sigScript if necessary.
    if (this.ins[inputIndex].script.getOutType() == 'P2SH') {
      var p2shProof = this.createP2SHProof(redeemScript);
      this.signInput(inputIndex, p2shProof);
    }
    var proof = this.createStandardProof(key);
    return this.signInput(inputIndex, proof);
  } catch (e) {
    // Couldn't sign this input.  Continue.
  }
  return false;
};

// Enumerate all the inputs, and find any which require a key
// which matches the input key.
//
// Returns the number of inputs signed.
Transaction.prototype.signWithKey = function(key) {
  var signatureCount = 0;

  var proof = this.createStandardProof(key);
  for (var index = 0; index < this.ins.length; ++index) {
    try {
      this.signInput(index, proof, SIGHASH_ALL);
      signatureCount++;
    } catch (e) {
      // Couldn't sign this input.  Continue.
    }
  }
  return signatureCount;
};

// Sign a transaction for a P2SH multi-signature input.
//
// Enumerates all the inputs, and find any which need our signature.
// This function does not require that all signatures are applied at the
// same time.  You can sign it once, then call it again later to sign
// again.  When this happens, we leave the scriptSig padded with OP_0's
// where the missing signatures would go.  This allows to us to create
// a valid, parseable transaction that can be passed around in this
// intermediate, partially signed state.
//
// Returns the number of signnatures applied in this pass (kind of meaningless)
Transaction.prototype.signWithMultiSigScript = function(keyArray, redeemScript) {
  var hashType = 1;  // SIGHASH_ALL
  var signatureCount = 0;

  if (!(keyArray instanceof Array) || !(redeemScript instanceof Script)) {
    throw new Error('invalid argument');
  }
  keyArray.forEach(function(key) { if (!(key instanceof ECKey)) { throw new Error('invalid key'); } });

  // First figure out how many signatures we need.
  var numSigsRequired = redeemScript.chunks[0] - Opcode.map.OP_1 + 1;
  if (numSigsRequired < 0 || numSigsRequired > 15) {
    throw new Error("Can't determine required number of signatures");
  }

  for (var index = 0; index < this.ins.length; ++index) {
    if (this.ins[index].script.getOutType() == 'P2SH') {
      var p2shProof = this.createP2SHProof(redeemScript);
      this.signInput(index, p2shProof);
    }
    var proof = this.createStandardProof(keyArray[0]);
    if (this.signInput(index, proof)) {
      signatureCount++;
    }
  }
  return signatureCount;
}

/**
 * Create a new txout.
 *
 * Can be called with an existing TransactionOut object to add it to the
 * transaction. Or it can be called with an Address object and a BigInteger
 * for the amount, in which case a new TransactionOut object with those
 * values will be created.
 *
 * Arguments can be:
 *    addOutput(transactionOut)
 *    addOutput(Bitcoin.Address, value)
 */
Transaction.prototype.addOutput = function (address, value) {
  if (arguments[0] instanceof TransactionOut) {
    this.outs.push(arguments[0]);
    return;
  }

  if (!address || !(address instanceof Address) || typeof(value) != 'number') {
    throw new Error('invalid argument');
  }

  this.outs.push(new TransactionOut({
    value: value,
    script: Script.createOutputScript(address)
  }));
};

Transaction.prototype.clearOutputs = function (tx) {
  this.outs = [];
};

module.exports = {
  Transaction: Transaction,
  TransactionIn: TransactionIn,
  TransactionOut: TransactionOut
};
