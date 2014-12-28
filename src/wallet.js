//
// Wallet Object
// BitGo accessor for a specific wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var TransactionBuilder = require('./transactionBuilder');
var Keychains = require('./keychains');
var common = require('./common');

//
// Constructor
//
var Wallet = function(bitgo, wallet) {
  this.bitgo = bitgo;
  this.wallet = wallet;
  this.keychains = [];
  if (wallet.private) {
    this.keychains = wallet.private.keychains;
  }
};

//
// address
// Get the address of this wallet.
//
Wallet.prototype.address = function() {
  return this.wallet.id;
};

//
// label
// Get the label of this wallet.
//
Wallet.prototype.label = function() {
  return this.wallet.label;
};

//
// balance
// Get the balance of this wallet.
//
Wallet.prototype.balance = function() {
  return this.wallet.balance;
};

//
// pendingBalance
// Get the pendingBalance of this wallet.
//
Wallet.prototype.pendingBalance = function() {
  return this.wallet.pendingBalance;
};

//
// availableBalance
// Get the availableBalance of this wallet.
//
Wallet.prototype.availableBalance = function() {
  return this.wallet.availableBalance;
};

//
// type
// Get the type of this wallet, e.g. 'safehd'
//
Wallet.prototype.type = function() {
  return this.wallet.type;
};

Wallet.prototype.url = function(extra) {
  extra = extra || '';
  return this.bitgo.url('/wallet/' + this.address() + extra);
};

//
// createAddress
// Creates a new address for use with this wallet.
//
Wallet.prototype.createAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var chain = params.chain || 0;
  var self = this;
  this.bitgo.post(this.url('/address/' + chain))
  .send({})
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    // TODO:  Should we return a Wallet object here?
    callback(null, res.body);
  });
};

//
// addresses
// Gets the addresses of a HD wallet.
// Options include:
//  limit: the number of addresses to get
//
Wallet.prototype.addresses = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  // TODO: Allow limits and starting from non-zero point in addresses list
  var self = this;
  var url = this.url('/addresses');

  if (params.limit) {
    if (typeof(params.limit) != 'number') {
      throw new Error('invalid limit argument, expecting number');
    }
    url += '?limit=' + (params.limit);
  }

  this.bitgo.get(url)
  .send()
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, res.body);
  });
};


//
// delete
// Deletes the wallet
//
Wallet.prototype.delete = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var self = this;
  this.bitgo.del(this.url())
  .send()
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, {});
  });
};

//
// unspents
// List the unspents for a given wallet
// Parameters include:
//   limit:  the optional limit of unspents to collect in BTC.
//
Wallet.prototype.unspents = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var url = this.url('/unspents');
  if (params.btcLimit) {
    if (typeof(params.limit) != 'number') {
      throw new Error('invalid argument');
    }
    url += '?limit=' + (params.limit * 1e8);
  }
  var self = this;
  this.bitgo.get(url)
  .send()
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, res.body.unspents);
  });
};

//
// transactions
// List the transactions for a given wallet
// Options include:
//     TODO:  Add iterators for start/count/etc
Wallet.prototype.transactions = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var self = this;
  this.bitgo.get(this.url('/tx'))
  .send()
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    // TODO:  Get the address labels and prettify these?
    callback(null, res.body);
  });
};

//
// Key chains
// Gets the user key chain for this wallet
// The user key chain is typically the first keychain of the wallet and has the encrypted xpriv stored on BitGo.
// Useful when trying to get the users' keychain from the server before decrypting to sign a transaction.
Wallet.prototype.getEncryptedUserKeychain = function(params, callback) {
  params = params || {};
  common.validateParams(params);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var self = this;

  var tryKeyChain = function(index) {
    if (!self.keychains || index >= self.keychains.length) {
      return callback(new Error('No encrypted keychains on this wallet.'));
    }

    var params = { "xpub": self.keychains[index].xpub };
    self.bitgo.keychains().get(params, function(err, keychain) {

      if (err) {
        return callback(err);
      }

      // If we find the xpriv, then this is probably the user keychain we're looking for
      if (keychain.encryptedXprv) {
        return callback(null, keychain);
      } else {
        // Try next index
        tryKeyChain(index + 1);
      }
    });
  };

  tryKeyChain(0);
};

//
// createTransaction
// Create and sign a transaction
// TODO: Refactor into create and sign seperately after integrating with new bitcoinjs-lib
// Parameters:
//   address  - the address to send to
//   amount   - the amount to send, in satoshis
//   keychain - the decrypted keychain to use for signing
//   fee      - the blockchain fee to send (optional)
// Returns:
//   callback(err, transaction)
Wallet.prototype.createTransaction = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], []);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  if (typeof(params.amount) != 'number' ||
    (typeof(params.fee) != 'number' && typeof(params.fee) != 'undefined')
    || typeof(params.keychain) != 'object') {
    throw new Error('invalid argument');
  }

  if (params.amount <= 0) {
    throw new Error('must send positive number of Satoshis!');
  }

  new TransactionBuilder(this, { address: params.address, amount: params.amount }, params.fee).prepare()
  .then(function(tb) {
    return tb.sign(params.keychain);
  })
  .then(function(tb) {
    if (tb) {
      callback(null, {tx: tb.tx(), fee: tb.fee});
    }
  })
  .catch(function(e) {
    return callback(e);
  })
  .done();
};

//
// send
// Send a transaction to the Bitcoin network via BitGo.
// One of the keys is typically signed, and BitGo will sign the other (if approved) and relay it to the P2P network.
// Parameters:
//   tx  - the hex encoded, signed transaction to send
// Returns:
//
Wallet.prototype.sendTransaction = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['tx'], []);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  var self = this;
  this.bitgo.post(this.bitgo.url('/tx/send'))
  .send({ tx: params.tx })
  .end(function(err, res) {
    if (self.bitgo.handleBitGoAPIError(err, res, callback)) {
      return;
    }
    callback(null, { tx: res.body.transaction, hash: res.body.transactionHash });
  });
};

//
// sendCoins
// Send coins to a destination address from this wallet using the user key.
// 1. Gets the user keychain by checking the wallet for a key which has an encrypted xpriv
// 2. Decrypts user key
// 3. Creates the transaction with default fee
// 4. Signs transaction with decrypted user key
// 3. Sends the transaction to BitGo
//
// Parameters:
//   address - the destination address
//   amount - the amount in satoshis to be sent
//   walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
// Returns:
//
Wallet.prototype.sendCoins = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address', 'walletPassphrase'], []);

  if (typeof(callback) != 'function') {
    throw new Error('invalid callback argument');
  }

  if (typeof(params.amount) != 'number') {
    throw new Error('invalid argument for amount - number expected');
  }

  if (params.amount <= 0) {
    throw new Error('must send positive number of Satoshis!');
  }

  var self = this;
  // Get the user keychain
  this.getEncryptedUserKeychain({}, function(err, keychain) {
    if (err) { return callback(err); }

    // Decrypt the user key with a passphrase
    try {
      keychain.xprv = self.bitgo.decrypt({ password: params.walletPassphrase, opaque: keychain.encryptedXprv });
    } catch (e) {
      return callback(new Error('Unable to decrypt user keychain'));
    }

    // Create and sign the transaction
    self.createTransaction(
      { address: params.address, amount: params.amount, keychain: keychain },
      function(err, transaction) {
        if (err) { return callback(err); }

        // Send the transaction
        self.sendTransaction({ tx: transaction.tx }, function(err, result) {
          if (err) { return callback(err); }
          callback(null, {tx: result.tx, hash: result.hash, fee: transaction.fee});
        });
      }
    );
  });
};

module.exports = Wallet;
