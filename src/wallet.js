//
// Wallet Object
// BitGo accessor for a specific wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var TransactionBuilder = require('./transactionBuilder');
var Keychains = require('./keychains');

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
Wallet.prototype.createAddress = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var chain = options.chain || 0;
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
Wallet.prototype.addresses = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  // TODO: Allow limits and starting from non-zero point in addresses list
  var self = this;
  var url = this.url('/addresses');

  if (options.limit) {
    if (typeof(options.limit) != 'number') {
      throw new Error('invalid argument');
    }
    url += '?limit=' + (options.limit);
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
Wallet.prototype.delete = function(callback) {
  if (typeof(callback) != 'function') {
    throw new Error('invalid argument');
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
// Options include:
//   limit:  the limit of unspents to collect in BTC.
//
Wallet.prototype.unspents = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var url = this.url('/unspents');
  if (options.btcLimit) {
    if (typeof(options.limit) != 'number') {
      throw new Error('invalid argument');
    }
    url += '?limit=' + (options.limit * 1e8);
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
Wallet.prototype.transactions = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
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
Wallet.prototype.getEncryptedUserKeychain = function(options, callback) {
  if (typeof(options) != 'object' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var self = this;

  var tryKeyChain = function(index) {
    if (!self.keychains || index >= self.keychains.length) {
      return callback(new Error('No encrypted keychains on this wallet.'));
    }

    var options = { "xpub": self.keychains[index].xpub };
    self.bitgo.keychains().get(options, function(err, keychain) {

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
// Inputs:
//   address  - the address to send to
//   amount   - the amount to send, in satoshis
//   fee      - the blockchain fee to send (use 'undefined' to have BitGo compute the fee)
//   keychain - the decrypted keychain to use for signing
// Returns:
//   callback(err, transaction)
Wallet.prototype.createTransaction = function(address, amount, fee, keychain, callback) {
  if (typeof(address) != 'string' || typeof(amount) != 'number' ||
      (typeof(fee) != 'number' && typeof(fee) != 'undefined') || typeof(keychain) != 'object' ||
      typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  if (amount <= 0) {
    throw new Error('must send positive number of Satoshis!');
  }

  new TransactionBuilder(this, { address: address, amount: amount }, fee).prepare()
  .then(function(tb) {
    return tb.sign(keychain);
  })
  .catch(function(e) {
    return callback(e);
  })
  .then(function(tb) {
    if (tb !== null) {
      callback(null, {tx: tb.tx(), fee: tb.fee});
    }
  });
};

//
// send
// Send a transaction to the Bitcoin network via BitGo.
// One of the keys is typically signed, and BitGo will sign the other (if approved) and relay it to the P2P network.
// Inputs:
//   tx  - the hex encoded, signed transaction to send
// Returns:
//
Wallet.prototype.sendTransaction = function(tx, callback) {
  if (typeof(tx) != 'string' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  var self = this;
  this.bitgo.post(this.bitgo.url('/tx/send'))
  .send({ tx: tx })
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
// Inputs:
//   address - the destination address
//   amount - the amount in satoshis to be sent
//   walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
// Returns:
//
Wallet.prototype.sendCoins = function(address, amount, walletPassphrase, callback) {
  if (typeof(address) != 'string' || typeof(amount) != 'number' ||
    typeof(walletPassphrase) != 'string' || typeof(callback) != 'function') {
    throw new Error('invalid argument');
  }
  if (amount <= 0) {
    throw new Error('must send positive number of Satoshis!');
  }

  var self = this;
  // Get the user keychain
  this.getEncryptedUserKeychain({}, function(err, keychain) {
    if (err) { return callback(err); }

    // Decrypt the user key with a passphrase
    try {
      keychain.xprv = self.bitgo.decrypt(walletPassphrase, keychain.encryptedXprv);
    } catch (e) {
      return callback(new Error('Unable to decrypt user keychain'));
    }

    // Create and sign the transaction
    self.createTransaction(address, amount, undefined, keychain, function(err, transaction) {
      if (err) { return callback(err); }

      // Send the transaction
      self.sendTransaction(transaction.tx, function(err, result) {
        if (err) { return callback(err); }
        callback(null, {tx: result.tx, hash: result.hash, fee: transaction.fee});
      });
    });
  });
};

module.exports = Wallet;
