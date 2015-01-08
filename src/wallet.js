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
// id
// Get the id of this wallet.
//
Wallet.prototype.id = function() {
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
// confirmedBalance
// Get the confirmedBalance of this wallet.
//
Wallet.prototype.confirmedBalance = function() {
  return this.wallet.confirmedBalance;
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
  return this.bitgo.url('/wallet/' + this.id() + extra);
};

//
// createAddress
// Creates a new address for use with this wallet.
//
Wallet.prototype.createAddress = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['allowExisting'], callback);

  var chain = params.chain || 0;
  return this.bitgo.post(this.url('/address/' + chain))
  .send(params)
  .result()
  .nodeify(callback);
};

//
// addresses
// Gets the addresses of a HD wallet.
// Options include:
//  limit: the number of addresses to get
//
Wallet.prototype.addresses = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var args = [];
  if (params.details) {
    args.push('details=1');
  }
  if (typeof(params.chain) != 'undefined') {
    if (params.chain !== 0 && params.chain !== 1) {
      throw new Error('invalid chain argument, expecting 0 or 1');
    }
    args.push('chain=' + params.chain);
  }
  if (params.limit) {
    if (typeof(params.limit) != 'number') {
      throw new Error('invalid limit argument, expecting number');
    }
    args.push('limit=' + params.limit);
  }
  if (params.skip) {
    if (typeof(params.skip) != 'number') {
      throw new Error('invalid skip argument, expecting number');
    }
    args.push('skip=' + params.skip);
  }
  var query = '';
  if (args.length) {
    query = '?' + args.join('&');
  }
  var url = this.url('/addresses' + query);

  return this.bitgo.get(url)
  .result()
  .nodeify(callback);
};


//
// delete
// Deletes the wallet
//
Wallet.prototype.delete = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.del(this.url())
  .result()
  .nodeify(callback);
};

//
// unspents
// List the unspents for a given wallet
// Parameters include:
//   limit:  the optional limit of unspents to collect in BTC.
//
Wallet.prototype.unspents = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var url = this.url('/unspents');
  if (params.btcLimit) {
    if (typeof(params.limit) != 'number') {
      throw new Error('invalid argument');
    }
    url += '?limit=' + (params.limit * 1e8);
  }

  return this.bitgo.get(url)
  .result('unspents')
  .nodeify(callback);
};

//
// transactions
// List the transactions for a given wallet
// Options include:
//     TODO:  Add iterators for start/count/etc
Wallet.prototype.transactions = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var args = [];
  if (params.limit) {
    if (typeof(params.limit) != 'number') {
      throw new Error('invalid limit argument, expecting number');
    }
    args.push('limit=' + params.limit);
  }
  if (params.skip) {
    if (typeof(params.skip) != 'number') {
      throw new Error('invalid skip argument, expecting number');
    }
    args.push('skip=' + params.skip);
  }
  var query = '';
  if (args.length) {
    query = '?' + args.join('&');
  }

  var url = this.url('/tx' + query);

  return this.bitgo.get(url)
  .result()
  .nodeify(callback);
};

//
// Key chains
// Gets the user key chain for this wallet
// The user key chain is typically the first keychain of the wallet and has the encrypted xpriv stored on BitGo.
// Useful when trying to get the users' keychain from the server before decrypting to sign a transaction.
Wallet.prototype.getEncryptedUserKeychain = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);
  var self = this;

  var tryKeyChain = function(index) {
    if (!self.keychains || index >= self.keychains.length) {
      return self.bitgo.reject('No encrypted keychains on this wallet.', callback);
    }

    var params = { "xpub": self.keychains[index].xpub };

    return self.bitgo.keychains().get(params)
    .then(function(keychain) {
      // If we find the xpriv, then this is probably the user keychain we're looking for
      if (keychain.encryptedXprv) {
        return keychain;
      }
      return tryKeyChain(index + 1);
    })
    .nodeify(callback);
  };

  return tryKeyChain(0);
};

//
// createTransaction
// Create and sign a transaction
// TODO: Refactor into create and sign seperately after integrating with new bitcoinjs-lib
// Parameters:
//   address  - the address to send to
//   recipients - object of recipient addresses and the amount to send to each e.g. {address:1500, address2:1500}
//   fee      - the blockchain fee to send (optional)
// Returns:
//   callback(err, transaction)
Wallet.prototype.createTransaction = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var self = this;

  if ((typeof(params.fee) != 'number' && typeof(params.fee) != 'undefined') ||
    typeof(params.keychain) != 'object') {
    throw new Error('invalid argument');
  }

  if (typeof(params.recipients) != 'object') {
    throw new Error('expecting recipients object');
  }

  Object.keys(params.recipients).forEach(function(destinationAddress) {
    var amount = params.recipients[destinationAddress];

    if (typeof(destinationAddress) != 'string' ||
      !self.bitgo.verifyAddress({ address: destinationAddress })) {
      throw new Error('invalid bitcoin address: ' + destinationAddress);
    }
    if (typeof(amount) != 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('invalid amount for ' + destinationAddress + ': ' + amount);
    }
  });

  return new TransactionBuilder(this, params.recipients, params.fee).prepare()
  .then(function(tb) {
    return tb.sign(params.keychain);
  })
  .then(function(tb) {
    if (tb) {
      return {
        tx: tb.tx(),
        fee: tb.fee
      };
    }
  })
  .nodeify(callback);
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
  common.validateParams(params, ['tx'], ['message'], callback);

  var self = this;
  return this.bitgo.post(this.bitgo.url('/tx/send'))
  .send(params)
  .result()
  .then(function(body) {
    return {
      tx: body.transaction,
      hash: body.transactionHash
    };
  })
  .nodeify(callback);
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
//   message - optional message to attach to transaction
//   walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
// Returns:
//
Wallet.prototype.sendCoins = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address', 'walletPassphrase'], ['message'], callback);

  if (typeof(params.amount) != 'number') {
    throw new Error('invalid argument for amount - number expected');
  }

  if (params.amount <= 0) {
    throw new Error('must send positive number of Satoshis!');
  }

  var self = this;
  var transaction;

  // Get the user keychain
  return this.getEncryptedUserKeychain()
  .then(function(keychain) {
    // Decrypt the user key with a passphrase
    try {
      keychain.xprv = self.bitgo.decrypt({ password: params.walletPassphrase, opaque: keychain.encryptedXprv });
    } catch (e) {
      return self.bitgo.reject('Unable to decrypt user keychain', callback);
    }

    // Create and sign the transaction
    var recipients = {};
    recipients[params.address] = params.amount;

    return self.createTransaction({
      recipients: recipients,
      keychain: keychain
    });
  })
  .then(function(result) {
    transaction = result;
    // Send the transaction
    return self.sendTransaction({ tx: transaction.tx, message: params.message });
  })
  .then(function(result) {
    return {
      tx: result.tx,
      hash: result.hash,
      fee: transaction.fee
    };
  })
  .nodeify(callback);
};

//
// sendMany
// Send coins to multiple destination addresses from this wallet using the user key.
// 1. Gets the user keychain by checking the wallet for a key which has an encrypted xpriv
// 2. Decrypts user key
// 3. Creates the transaction with default fee
// 4. Signs transaction with decrypted user key
// 3. Sends the transaction to BitGo
//
// Parameters:
//   address - the destination address
//   recipients - array of { address, amount } to send to
//   walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
// Returns:
//
Wallet.prototype.sendMany = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['walletPassphrase'], ['message'], callback);
  var self = this;

  if (typeof(params.recipients) != 'object') {
    throw new Error('expecting recipients object');
  }

  Object.keys(params.recipients).forEach(function(destinationAddress) {
    var amount = params.recipients[destinationAddress];

    if (typeof(destinationAddress) != 'string' ||
      !self.bitgo.verifyAddress({ address: destinationAddress })) {
      throw new Error('invalid bitcoin address: ' + destinationAddress);
    }
    if (typeof(amount) != 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('invalid amount for ' + destinationAddress + ': ' + amount);
    }
  });

  var transaction;

  // Get the user keychain
  return this.getEncryptedUserKeychain()
  .then(function(keychain) {
    // Decrypt the user key with a passphrase
    try {
      keychain.xprv = self.bitgo.decrypt({ password: params.walletPassphrase, opaque: keychain.encryptedXprv });
    } catch (e) {
      return self.bitgo.reject('Unable to decrypt user keychain', callback);
    }

    // Create and sign the transaction
    return self.createTransaction({
      recipients: params.recipients,
      keychain: keychain
    });
  })
  .then(function(result) {
    transaction = result;
    // Send the transaction
    return self.sendTransaction({ tx: transaction.tx, message: params.message });
  })
  .then(function(result) {
    return {
      tx: result.tx,
      hash: result.hash,
      fee: transaction.fee
    };
  })
  .nodeify(callback);
};

module.exports = Wallet;
