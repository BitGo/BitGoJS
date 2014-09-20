//
// TransactionBuilder
// A utility for building and signing transactions
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Q = require('q');
var Address = require('./bitcoin/address');
var BIP32 = require('./bitcoin/bip32');
var Transactions = require('./bitcoin/transaction');
var Script = require('./bitcoin/script');
var Util = require('./bitcoin/util');

var Transaction = Transactions.Transaction;
var TransactionIn = Transactions.TransactionIn;
var TransactionOut = Transactions.TransactionOut;

// Setup some fee constants.
var MAX_FEE = 1e8 * 0.1;        // The maximum fee we'll allow before declaring an error
var FEE_PER_KB = 0.0001 * 1e8;  // The blockchain required fee-per-kb of transaction size
var DEFAULT_FEE = 0.0001 * 1e8; // Our default fee
var MINIMUM_BTC_DUST = 5460;    // The blockchain will reject any output for less than this. (dust - give it to the miner)


//
// TransactionBuilder
// Inputs
//   wallet:  a wallet object to send from
//   recipient: {
//     address:  the address to send to
//     amount: the amount to send (in satoshis)
//   }
//   fee: the fee to use with this transaction.  if not provided, a default, minimum fee will be used.
var TransactionBuilder = function(wallet, recipient, fee) {
  // Sanity check the arguments passed in
  if (typeof(wallet) != 'object' || typeof(recipient) != 'object' ||
      (fee && typeof(fee) != 'number') ) {
    throw new Error('invalid argument');
  }

  // Sanity check the recipient.
  if (typeof(recipient.address) != 'string' || typeof(recipient.amount) != 'number') {
    throw new Error('invalid recipient');
  }

  try {
    var address = new Address(recipient.address);
  } catch (e) {
    throw new Error('invalid recipient address');
  }

  // Flag indicating whether this class will compute the fee
  this.shouldComputeBestFee = (typeof(fee) == 'undefined');

  // Sanity check the fee
  if (typeof(fee) == 'undefined') {
    fee = DEFAULT_FEE;
  }
  if (fee > MAX_FEE) {
    throw new Error('fee too generous');  // Protection against bad inputs
  }

  var self = this;
  this.wallet = wallet;
  this.recipient = recipient;
  this.fee = fee;

  // The total amount needed for this transaction.
  var _totalAmount = self.fee + self.recipient.amount;

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

      var options = {
        limit: _totalAmount
      };
      self.wallet.unspents(options, function(err, unspents) {
        if (err) {
          deferred.reject(error);
          return;
        }

        _unspents = unspents;
        deferred.resolve(self);
      });
      return deferred.promise;
    };

    // Approximate the fee based on number of inputs
    var approximateBlockchainFee = function() {
      // Tx size is dominated by signatures.
      // Use the rough formula of 6 signatures per KB.
      var signaturesPerInput = 2;  // 2-of-3 wallets
      return Math.ceil(_tx.ins.length * signaturesPerInput / 6) * FEE_PER_KB;
    };

    // Iterate _unspents, sum the inputs, and save _inputs with the total
    // input amound and final list of inputs to use with the transaction.
    var collectInputs = function() {
      _inputAmount = 0;
      _unspents.every(function(unspent) {
        _inputAmount += unspent.value;
        var input = new TransactionIn(
          {
            outpoint: { hash: unspent.tx_hash, index: unspent.tx_output_n },
            script: new Script(unspent.script),
            sequence: 4294967295
          }
        );
        _tx.addInput(input);
        return (_inputAmount < _totalAmount);
      });
      if (_totalAmount > _inputAmount) {
        return Q.reject('Insufficient funds');
      }
      if (self.shouldComputeBestFee) {
        var approximateFee = approximateBlockchainFee();
        if (approximateFee > self.fee) {
          self.fee = approximateFee;
          _inputAmount = 0;
          _tx.clearInputs();
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
      wallet.createAddress({}, function(err, newAddress) {
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
      _tx.addOutput(new Address(self.recipient.address), self.recipient.amount);
      var remainder = _inputAmount - _totalAmount;
      // As long as the remainder is greater than dust we send it to our change
      // address.  Otherwise, let it go to the miners.
      if (remainder > MINIMUM_BTC_DUST) {
        _tx.addOutput(new Address(_changeAddress), remainder);
      }
      return Q.when(self);
    };

    // Serialize the transaction into something usable.
    var serialize = function() {
      _txBytes = _tx.serialize();
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

    var rootExtKey = new BIP32(keychain.xprv);
    for (var index = 0; index < _tx.ins.length; ++index) {
      var path = keychain.path + self.wallet.keychains[0].path + _unspents[index].chainPath;
      var extKey = rootExtKey.derive(path);
      var redeemScript = new Script(_unspents[index].redeemScript);
      if (!_tx.signMultiSigWithKey(index, extKey.eckey, redeemScript)) {
        return Q.reject('Failed to sign input #' + index);
      }
      _tx.verifyInputSignatures(index, redeemScript);
    }
    return Q.when(this);
  };

  //
  // tx
  // Get the created transaction in hex format
  //
  this.tx = function() {
    return Util.bytesToHex(_tx.serialize());
  };

};

module.exports = TransactionBuilder;
