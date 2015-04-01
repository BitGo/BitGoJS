//
// TransactionBuilder
// A utility for building and signing transactions
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Q = require('q');
var Address = require('bitcoinjs-lib/src/address');
var HDNode = require('./hdnode');
var Transaction = require('bitcoinjs-lib/src/transaction');
var _TransactionBuilder = require('bitcoinjs-lib/src/transaction_builder');
var Script = require('bitcoinjs-lib/src/script');
var Scripts = require('bitcoinjs-lib/src/scripts');
var ECPubkey = require('bitcoinjs-lib/src/ecpubkey');
var ECSignature = require('bitcoinjs-lib/src/ecsignature');
var Opcodes = require('bitcoinjs-lib/src/opcodes');
var Util = require('./util');

// Setup some fee constants.
var MAX_FEE = 1e8 * 0.1;        // The maximum fee we'll allow before declaring an error
var MAX_FEE_RATE = 1e8 * 0.001;        // The maximum fee we'll allow before declaring an error
var FEE_PER_KB = 0.0001 * 1e8;  // The blockchain required fee-per-kb of transaction size
var DEFAULT_FEE = 0.0001 * 1e8; // Our default fee
var MINIMUM_BTC_DUST = 5460;    // The blockchain will reject any output for less than this. (dust - give it to the miner)

//
// TransactionBuilder
// Inputs
//   wallet:  a wallet object to send from
//   recipients - object of recipient addresses and the amount to send to each e.g. {address:1500, address2:1500}
//   fee: the fee to use with this transaction.  if not provided, a default, minimum fee will be used.
var TransactionBuilder = function(wallet, recipients, fee, feeRate, minConfirms) {
  minConfirms = minConfirms || 0;

  // Sanity check the arguments passed in
  if (typeof(wallet) != 'object' || (fee && typeof(fee) != 'number') || (feeRate && typeof(feeRate) != 'number') || typeof(minConfirms) != 'number') {
    throw new Error('invalid argument');
  }

  if (typeof(recipients) != 'object' || recipients instanceof Array) {
    throw new Error('recipients must be dictionary of destinationAddress:amount');
  }

  if (Object.keys(recipients).length === 0) {
    throw new Error('must have at least one recipient');
  }

  // Flag indicating whether this class will compute the fee
  this.shouldComputeBestFee = (typeof(fee) == 'undefined');

  // Sanity check the fee
  if (typeof(fee) !== 'undefined' && typeof(feeRate) !== 'undefined') {
    throw new Error('cannot specify both a fee as well as a fee rate');
  }
  if (typeof(fee) == 'undefined') {
    fee = DEFAULT_FEE;
  }
  if (fee > MAX_FEE) {
    throw new Error('fee too generous');  // Protection against bad inputs
  }
  if (feeRate > MAX_FEE_RATE) {
    throw new Error('fee rate too generous');  // Protection against bad inputs
  }

  var self = this;
  this.wallet = wallet;
  this.fee = fee;
  this.recipients = recipients;

  var _totalOutputs = 0;
  Object.keys(recipients).forEach(function(destinationAddress) {
    var amount = recipients[destinationAddress];

    if (typeof(destinationAddress) != 'string') {
      throw new Error('invalid bitcoin address: ' + destinationAddress);
    }

    if (typeof(amount) != 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('invalid amount for ' + destinationAddress + ': ' + amount);
    }

    try {
      Address.fromBase58Check(destinationAddress);
    } catch (e) {
      throw new Error('invalid bitcoin address: ' + destinationAddress);
    }

    _totalOutputs += amount;
  });
  var _totalAmount = self.fee + _totalOutputs;

  // The total amount needed for this transaction.

  // The list of unspent transactions being used in this transaction.
  var _unspents;

  // The sum of the input values for this transaction.
  var _inputAmount;

  // The transaction.
  var _tx;

  // The serialized transaction.
  var _txBytes;

  // If this transaction requires change, send it here.
  var _changeAddress;

  // Prepare the transaction.
  // This is a multi-phase, multi-round trip operation.
  this.prepare = function() {
    _tx = new Transaction();

    var deferred = Q.defer();

    // Get the unspents for the sending wallet.
    var getUnspents = function() {
      var deferred = Q.defer();

      // Get enough unspents for the requested amount, plus a little more in case we need to pay an increased fee
      var options = {
        target: _totalAmount + 1e8
      };
      self.wallet.unspents(options, function(err, unspents) {
        if (err) {
          deferred.reject(err);
          return;
        }

        _unspents = unspents.filter(function(u) {
          var confirms = u.confirmations || 0;
          return confirms >= minConfirms;
        });
        deferred.resolve(self);
      });
      return deferred.promise;
    };

    var estimateTxSizeKb = function() {
      // Tx size is dominated by signatures.
      // Use the rough formula of 6 signatures per KB.
      var signaturesPerInput = 2;  // 2-of-3 wallets

      // Note: Reference implementation uses 1000 bytes/kb, so we follow it to be safe
      var outputSizeKb = Object.keys(self.recipients).length * 34 / 1000;
      var inputSizeKb = (_tx.ins.length * signaturesPerInput * 170) / 1000;

      return Math.ceil(inputSizeKb + outputSizeKb);
    };

    // Approximate the fee based on number of inputs
    var approximateBlockchainFee = function() {
      var feeRateToUse = typeof(feeRate) !== 'undefined' ? feeRate : FEE_PER_KB;
      return estimateTxSizeKb() * feeRateToUse;
    };

    // Iterate _unspents, sum the inputs, and save _inputs with the total
    // input amound and final list of inputs to use with the transaction.
    var collectInputs = function() {
      _inputAmount = 0;
      _unspents.every(function(unspent) {
        _inputAmount += unspent.value;
        var hash = new Buffer(unspent.tx_hash, 'hex');
        hash = new Buffer(Array.prototype.reverse.call(hash));
        var script = Script.fromHex(unspent.script);
        _tx.addInput(hash, unspent.tx_output_n, 0xffffffff, script);
        return (_inputAmount < _totalAmount);
      });

      if (_totalAmount > _inputAmount) {
        return Q.reject('Insufficient funds');
      }
      if (self.shouldComputeBestFee) {
        var approximateFee = approximateBlockchainFee();
        if (approximateFee > self.fee) {
          self.fee = approximateFee;
          _totalAmount = self.fee + _totalOutputs;
          _inputAmount = 0;
          _tx.ins = [];
          return collectInputs();
        }
      }
      return Q.when(self);
    };

    // If change is needed for this transaction, compute a change address to
    // receive into.
    var getChangeAddress = function() {
      // Check if we need change.
      if (_inputAmount === _totalAmount) {
        return Q.when(self);
      }

      var deferred = Q.defer();
      wallet.createAddress({chain: 1}, function(err, newAddress) {
        if (err) {
          deferred.reject(err);
          return;
        }
        _changeAddress = newAddress.address;
        deferred.resolve(self);
      });
      return deferred.promise;
    };

    // Add the outputs for this transaction.
    var collectOutputs = function() {
      var estimatedTxSize = estimateTxSizeKb();
      if (estimatedTxSize >= 90) {
        throw new Error('transaction too large: estimated size ' + estimatedTxSize + 'kb');
      }

      Object.keys(self.recipients).forEach(function(destinationAddress) {
        var addr = Address.fromBase58Check(destinationAddress);
        var script = addr.toOutputScript();
        _tx.addOutput(script, self.recipients[destinationAddress]);
      });

      var remainder = _inputAmount - _totalAmount;
      // As long as the remainder is greater than dust we send it to our change
      // address.  Otherwise, let it go to the miners.
      if (remainder > MINIMUM_BTC_DUST) {
        var addr = Address.fromBase58Check(_changeAddress);
        var script = addr.toOutputScript();
        _tx.addOutput(script, remainder);
      }
      return Q.when(self);
    };

    // Serialize the transaction into something usable.
    var serialize = function() {
      _txBytes = _tx.toBuffer();
      return Q.when(self);
    };

    return getUnspents()
      .then(collectInputs)
      .then(getChangeAddress)
      .then(collectOutputs)
      .then(serialize);
  };

  //
  // sign
  // Sign a transaction.
  // Returns the signed transaction object.
  //
  this.sign = function(keychain) {
    if (typeof(keychain) != 'object' || typeof(keychain.xprv) != 'string') {
      throw new Error('illegal argument');
    }

    if (keychain.xpub != self.wallet.keychains[0].xpub) {
      throw new Error('incorrect keychain');
    }

    var rootExtKey = HDNode.fromBase58(keychain.xprv);
    for (var index = 0; index < _tx.ins.length; ++index) {
      var path = keychain.path + self.wallet.keychains[0].path + _unspents[index].chainPath;
      var extKey = rootExtKey.deriveFromPath(path);

      // subscript is the part of the output script after the OP_CODESEPARATOR.
      // Since we are only ever signing p2sh outputs, which do not have
      // OP_CODESEPARATORS, it is always the output script.
      var subscript  = Script.fromHex(_unspents[index].redeemScript);

      // In order to sign with bitcoinjs-lib, we must use its transaction
      // builder, confusingly named the same exact thing as our transaction
      // builder, but with inequivalent behavior.
      var txb = _TransactionBuilder.fromTransaction(_tx);
      try {
        txb.sign(index, extKey.privKey, subscript, Transaction.SIGHASH_ALL);
      } catch (e) {
        return Q.reject('Failed to sign input #' + index);
      }

      // Build the "incomplete" transaction, i.e. one that does not have all
      // the signatures (since we are only signing the first of 2 signatures in
      // a 2-of-3 multisig).
      _tx = txb.buildIncomplete();

      // bitcoinjs-lib adds one more OP_0 than we need. It creates one OP_0 for
      // every n public keys in an m-of-n multisig, and replaces the OP_0s with
      // the signature of the nth public key, then removes any remaining OP_0s
      // at the end. This behavior is not incorrect and valid for some use
      // cases, particularly if you do not know which keys will be signing the
      // transaction and the signatures may be added to the transaction in any
      // chronological order, but is not compatible with the BitGo API, which
      // assumes m OP_0s for m-of-n multisig (or m-1 after the first signature
      // is created). Thus we need to remove the superfluous OP_0.
      var chunks = _tx.ins[index].script.chunks;
      chunks.splice(2, 1); // The extra OP_0 is always the third chunk
      _tx.ins[index].script = Script.fromChunks(chunks);

      // Finally, verify that the signature is correct, and if not, throw an
      // error.
      if (verifyInputSignatures(index, subscript) !== -1) {
        throw new Error('number of signatures is invalid - something went wrong when signing');
      }
    }

    return Q.when(this);
  };

  // Verify the signature on an input.
  // If the transaction is fully signed, returns a positive number representing the number of valid signatures.
  // If the transaction is partially signed, returns a negative number representing the number of valid signatures.
  function verifyInputSignatures (inputIndex, pubScript) {
    if (inputIndex < 0 || inputIndex >= _tx.ins.length) {
      throw new Error('illegal index');
    }
    if (!(pubScript instanceof Script)) {
      throw new Error('illegal argument');
    }

    var sigScript = _tx.ins[inputIndex].script;
    var sigsNeeded = 1;
    var sigs = [];
    var pubKeys = [];

    // Check the script type to determine number of signatures, the pub keys, and the script to hash.
    switch(Scripts.classifyInput(sigScript, true)) {
      case 'scripthash':
        // Replace the pubScript with the P2SH Script.
        var p2shBytes = sigScript.chunks[sigScript.chunks.length -1];
        pubScript = Script.fromBuffer(p2shBytes);
        sigsNeeded = pubScript.chunks[0] - Opcodes.OP_1 + 1;
        for (var index = 1; index < sigScript.chunks.length -1; ++index) {
          sigs.push(sigScript.chunks[index]);
        }
        for (var index = 1; index < pubScript.chunks.length - 2; ++index) {
          pubKeys.push(pubScript.chunks[index]);
        }
        break;
      case 'pubkeyhash':
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
      if (sigs[sigIndex] == Opcodes.OP_0) {
        continue;
      }

      var hashType = sigs[sigIndex][sigs[sigIndex].length - 1];
      sigs[sigIndex] = sigs[sigIndex].slice(0, sigs[sigIndex].length - 1); // pop hash type from end
      var signatureHash = _tx.hashForSignature(inputIndex, pubScript, hashType);

      var validSig = false;

      // Enumerate the possible public keys
      for (var pubKeyIndex = 0; pubKeyIndex < pubKeys.length; ++pubKeyIndex) {
        var pubKey = ECPubkey.fromBuffer(pubKeys[pubKeyIndex]);
        var signature = ECSignature.fromDER(sigs[sigIndex]);
        validSig = pubKey.verify(signatureHash, signature);
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

  //
  // tx
  // Get the created transaction in hex format
  //
  this.tx = function() {
    return _tx.toBuffer().toString('hex');
  };

};

module.exports = TransactionBuilder;
