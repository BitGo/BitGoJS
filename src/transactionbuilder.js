//
// TransactionBuilder
// A utility for building and signing transactions
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Q = require('q');

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

  // Sanity check the fee
  var MAX_FEE = 1e8 * 0.1;
  var DEFAULT_FEE = 0.0001 * 1e8;
  if (!fee) {
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

  // Prepare the transaction.
  // This is a multi-phase, multi-round trip operation.
  this.prepare = function() {
    _tx = new Bitcoin.Transaction();

    var deferred = $q.defer();

    // Get the unspents for the sending wallet.
    var getUnspents = function() {
      var deferred = $q.defer();

      var options = {
        limit: totalSpendSatoshis
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

    /*
    // Compute an approximated fee for this transaction
    var approximateFee = function(tx) {
      // Bitcoin fees are generally 0.0001 BTC per KB of transaction size.
      var FEE_PER_KB = 0.0001 * 1e8;
      var size = tx.serialize().length;
      return Math.ceil(size / 1024) * FEE_PER_KB;
    };
    */

    // Iterate _unspents, sum the inputs, and save _inputs with the total
    // input amound and final list of inputs to use with the transaction.
    var collectInputs = function() {
      _inputAmount = 0;
      _unspents.every(function(unspent) {
        _inputAmount += unspent.value;
        var input = new Bitcoin.TransactionIn(
          {
            outpoint: { hash: unspent.tx_hash, index: unspent.tx_output_n },
            sript: new Bitcoin.Script(unspent.script),
            sequence: 4294967295
          }
        );
        _tx.addInput(input);
        return (_inputAmount < _totalAmount);
      });
      if (totalSpendSatoshis > inputAmountSatoshis) {
        return $q.reject('Insufficient funds');
      }
      _inputs = { inputAmountSatoshis: inputAmountSatoshis, inputs: inputs };
      return $q.when(self);
    };

    // If change is needed for this transaction, compute a change address to
    // receive into.
    var getChangeAddress = function() {
      // Check if we need change.
      if (_inputAmount === _totalAmount) {
        return $q.when(self);
      }

      var deferred = $q.defer();
      wallet.createAddress({}, function(err, newAddress) {
        if (err) {
          deferred.reject(err);
          return;
        }
        _changeAddress = newAddress
        deferred.resolve(self);
      });
      return deferred.promise;
    };

    // Add the outputs for this transaction.
    var collectOutputs = function() {
      _tx.addOutput(new Bitcoin.Address(self.recipient.address, self.recipient.amount));
      var remainder = _inputAmount - _totalAmount;
      // As long as the remainder is greater than dust we send it to our change
      // address.  Otherwise, let it go to the miners.
      if (remainder > MINIMUM_BTC_DUST) {
        _tx.addOutput(new Bitcoin.Address(_changeAddress, remainder));
      }
      return $q.when(self);
    };

    return getUnspents()
      .then(collectInputs)
      .then(getChangeAddress)
      .then(collectOutputs)
      .catch(function(error) {
        deferred.reject(error);
      });
  };

  // Sign a transaction.
  this.sign = function(keychain) {
    if (typeof(keychain) != 'object' || typeof(keychain.xprv) != 'string') {
      throw new Error('illegal argument');
    }

    var address = self.sender.address;
    var rootExtKey = new Bitcoin.BIP32(key).xprv;
    for (var index = 0; index < _tx.ins.length; ++index) {
      var path = keychain.path + self.wallet.path + _unspents[index].chainPath;
      var extKey = rootExtKey.derive(path);
      var redeemScript = new Bitcoin.Script(_unspents[index].redeemScript);
      if (!_tx.signMultiSigWithKey(index2, extKey.eckey, redeemScript)) {
        return $q.reject('Failed to sign input #' + index);
      }
      _tx.verifyInputSignatures(index, redeemScript);
    }
  };

};

module.exports = TransactionBuilder;
