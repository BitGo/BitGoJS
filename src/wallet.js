//
// Wallet Object
// BitGo accessor for a specific wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var TransactionBuilder = require('./transactionBuilder');
var Address = require('bitcoinjs-lib/src/address');
var HDNode = require('./hdnode');
var Keychains = require('./keychains');
var ECKey = require('bitcoinjs-lib/src/eckey');
var BufferUtils = require('bitcoinjs-lib/src/bufferutils');
var Scripts = require('bitcoinjs-lib/src/scripts');
var Util = require('./util');
var Crypto = require('bitcoinjs-lib/src/crypto');
var common = require('./common');
var networks = require('bitcoinjs-lib/src/networks');
var _ = require('lodash');

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

Wallet.prototype.toJSON = function() {
  return this.wallet;
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
// get
// Refetches this wallet and returns it
//
Wallet.prototype.get = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var self = this;

  return this.bitgo.get(this.url())
  .result()
  .then(function(res) {
    self.wallet = res;
    return self;
  })
  .nodeify(callback);
};

//
// createAddress
// Creates a new address for use with this wallet.
//
Wallet.prototype.createAddress = function(params, callback) {
  var self = this;
  params = params || {};
  common.validateParams(params, [], ['allowExisting'], callback);
  if (this.type() === 'safe') {
    throw new Error('cannot create an address for safe wallet; use .id()');
  }

  // Default to client-side address validation on, for safety. Use validate=false to disable.
  var shouldValidate = true;
  if (typeof(params.validate) === 'boolean') {
    shouldValidate = params.validate;
  }

  var chain = params.chain || 0;
  return this.bitgo.post(this.url('/address/' + chain))
  .send(params)
  .result()
  .then(function(addr) {
    if (shouldValidate) {
      self.validateAddress(addr);
    }
    return addr;
  })
  .nodeify(callback);
};

//
// validateAddress
// Validates an address and path by calculating it locally from the keychain xpubs
//
Wallet.prototype.validateAddress = function(params) {
  common.validateParams(params, ['address', 'path'], []);
  var self = this;

  // Function to calculate the address locally, to validate that what the server
  // gives us is an address in this wallet.
  var calcAddress = function(path) {
    var re = /^\/[01]\/\d+$/;
    if (!path.match(re)) {
      throw new Error('unsupported path: ' + path);
    }

    var pubKeys = self.keychains.map(function(k) {
      var hdnode = HDNode.fromBase58(k.xpub);
      hdnode = hdnode.deriveFromPath('m' + k.path + path);
      return hdnode.pubKey;
    });
    // TODO: use wallet 'm' value, when exposed
    var script = Util.p2shMultisigOutputScript(2, pubKeys);
    var network = networks[common.getNetwork()];
    return Address.fromOutputScript(script, network).toBase58Check();
  };

  var localAddress = calcAddress(params.path);
  if (localAddress !== params.address) {
    throw new Error('address validation failure: ' + params.address + ' vs. ' + localAddress);
  }
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
// freeze
// Freeze the wallet for a duration of choice, stopping BitGo from signing any transactions
// Parameters include:
//   limit:  the duration to freeze the wallet for in seconds, defaults to 3600
//
Wallet.prototype.freeze = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  if (params.duration) {
    if (typeof(params.duration) != 'number') {
      throw new Error('invalid duration - should be number of seconds');
    }
  }

  return this.bitgo.post(this.url('/freeze'))
  .send(params)
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
// labels
// List the labels for the addresses in a given wallet
//
Wallet.prototype.labels = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var url = this.bitgo.url('/labels/' + this.id());

  return this.bitgo.get(url)
  .result('labels')
  .nodeify(callback);
};

//
// setLabel
// Sets a label on the provided address
//
Wallet.prototype.setLabel = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address', 'label'], [], callback);

  var self = this;

  if (!self.bitgo.verifyAddress({ address: params.address })) {
    throw new Error('Invalid bitcoin address: ' + params.address);
  }

  var url = this.bitgo.url('/labels/' + this.id() + '/' + params.address);

  return this.bitgo.put(url)
  .send({'label': params.label})
  .result()
  .nodeify(callback);
};

//
// deleteLabel
// Deletes the label associated with the provided address
//
Wallet.prototype.deleteLabel = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], [], callback);

  var self = this;

  if (!self.bitgo.verifyAddress({ address: params.address })) {
    throw new Error('Invalid bitcoin address: ' + params.address);
  }

  var url = this.bitgo.url('/labels/' + this.id() + '/' + params.address);

  return this.bitgo.del(url)
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
  if (params.target) {
    if (typeof(params.target) != 'number') {
      throw new Error('invalid argument');
    }
    url += '?target=' + params.target;
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
  if (params.minHeight) {
    if (typeof(params.minHeight) != 'number') {
      throw new Error('invalid minHeight argument, expecting number');
    }
    args.push('minHeight=' + params.minHeight);
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
// transaction
// Get a transaction by ID for a given wallet
Wallet.prototype.getTransaction = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['id'], [], callback);

  var url = this.url('/tx/' + params.id);

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
// Create a transaction (unsigned). To sign it, do signTransaction
// Parameters:
//   recipients - object of recipient addresses and the amount to send to each e.g. {address:1500, address2:1500}
//   fee      - the blockchain fee to send (optional)
//   feeRate  - the fee per kb to send (optional)
//   minConfirms - minimum number of confirms to use when gathering unspents
// Returns:
//   callback(err, { transactionHex: string, unspents: [inputs], fee: satoshis })
Wallet.prototype.createTransaction = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var self = this;

  if ((typeof(params.fee) != 'number' && typeof(params.fee) != 'undefined') ||
      (typeof(params.feeRate) != 'number' && typeof(params.feeRate) != 'undefined') ||
      (typeof(params.minConfirms) != 'number' && typeof(params.minConfirms) != 'undefined')) {
    throw new Error('invalid argument');
  }

  if (typeof(params.keychain) == 'object') {
    throw new Error('createTransaction no longer takes a keychain to perform signing - please use signTransaction to sign');
  }

  if (typeof(params.recipients) != 'object') {
    throw new Error('expecting recipients object');
  }

  if (Object.keys(params.recipients).length === 0) {
    throw new Error('must have at least one recipient');
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

  return TransactionBuilder.createTransaction(
    this,
    params.recipients,
    params.fee || undefined,
    params.feeRate || undefined,
    params.minConfirms || undefined)
  .nodeify(callback);
};


//
// signTransaction
// Sign a previously created transaction with a keychain
// Parameters:
// transactionHex - serialized form of the transaction in hex
// unspents - array of unspent information, where each unspent is a chainPath
//            and redeemScript with the same index as the inputs in the
//            transactionHex
// keychain - Keychain containing the xprv to sign with.
// signingKey - For legacy safe wallets, the private key string.
// Returns:
//   callback(err, transaction)
Wallet.prototype.signTransaction = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['transactionHex'], [], callback);

  var self = this;

  if (!Array.isArray(params.unspents)) {
    throw new Error('expecting the unspents array');
  }

  if (typeof(params.keychain) != 'object' || !params.keychain.xprv) {
    if (typeof(params.signingKey) === 'string') {
      // allow passing in a WIF private key for legacy safe wallet support
    } else {
      throw new Error('expecting keychain object with xprv');
    }
  }

  return TransactionBuilder.signTransaction(params.transactionHex, params.unspents, params.keychain, params.signingKey)
  .then(function(result) {
    return {
      tx: result.transactionHex
    };
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

Wallet.prototype.createShare = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['user', 'permissions'], [], callback);

  if (params.keychain && !_.isEmpty(params.keychain)) {
    if (!params.keychain.xpub || !params.keychain.encryptedXprv || !params.keychain.fromPubKey ||
      !params.keychain.toPubKey || !params.keychain.path) {
      throw new Error('requires keychain parameters - xpub, encryptedXprv, fromPubKey, toPubKey, path');
    }
  }

  var self = this;
  return this.bitgo.post(this.url('/share'))
  .send(params)
  .result()
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

  params.recipients = {};
  params.recipients[params.address] = params.amount;

  return this.sendMany(params)
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

  if (params.fee && typeof(params.fee) != 'number') {
    throw new Error('invalid argument for fee - number expected');
  }

  if (params.feeRate && typeof(params.feeRate) != 'number') {
    throw new Error('invalid argument for feeRate - number expected');
  }

  if (Object.keys(params.recipients).length === 0) {
    throw new Error('must have at least one recipient');
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

  var keychain;
  var fee;

  // Get the user keychain
  return this.getEncryptedUserKeychain()
  .then(
  function(result) {
    keychain = result;
    // Decrypt the user key with a passphrase
    try {
      keychain.xprv = self.bitgo.decrypt({ password: params.walletPassphrase, input: keychain.encryptedXprv });
    } catch (e) {
      throw new Error('Unable to decrypt user keychain');
    }
  },
  function(err) {
    throw new Error('Unable to get the keychain for the wallet ' + err);
  }
  )
  .then(function() {
    // Create unsigned transaction
    return self.createTransaction({
      recipients: params.recipients,
      minConfirms: params.minConfirms,
      fee: params.fee,
      feeRate: params.feeRate
    });
  })
  .then(function(result) {
    fee = result.fee;
    // Sign the transaction
    result.keychain = keychain;
    return self.signTransaction(result);
  })
  .then(function(transaction) {
    // Send the transaction
    return self.sendTransaction({ tx: transaction.tx, message: params.message });
  })
  .then(function(result) {
    return {
      tx: result.tx,
      hash: result.hash,
      fee: fee
    };
  })
  .nodeify(callback);
};

Wallet.prototype.shareWallet = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['email', 'permissions'], ['walletPassphrase', 'message'], callback);

  if (params.reshare !== undefined && typeof(params.reshare) != 'boolean') {
    throw new Error('Expected reshare to be a boolean.');
  }

  if (params.skipKeychain !== undefined && typeof(params.skipKeychain) != 'boolean') {
    throw new Error('Expected skipKeychain to be a boolean. ');
  }
  var needsKeychain = !params.skipKeychain && params.permissions.indexOf('spend') !== -1;

  var self = this;
  var sharing;
  var sharedKeychain;
  return this.bitgo.getSharingKey({email: params.email})
  .then(function(result) {
    sharing = result;

    if (needsKeychain) {
      return self.getEncryptedUserKeychain({})
      .then(function(keychain) {
        // Decrypt the user key with a passphrase
        if (keychain.encryptedXprv) {
          if (!params.walletPassphrase) {
            throw new Error('Missing walletPassphrase argument');
          }
          try {
            keychain.xprv = self.bitgo.decrypt({ password: params.walletPassphrase, input: keychain.encryptedXprv });
          } catch (e) {
            throw new Error('Unable to decrypt user keychain');
          }

          var eckey = ECKey.makeRandom();
          var secret = self.bitgo.getECDHSecret({ eckey: eckey, otherPubKeyHex: sharing.pubkey });
          var newEncryptedXprv = self.bitgo.encrypt({password: secret, input: keychain.xprv});

          sharedKeychain = {
            xpub: keychain.xpub,
            encryptedXprv: newEncryptedXprv,
            fromPubKey: eckey.pub.toHex(),
            toPubKey: sharing.pubkey,
            path: sharing.path
          };
        }
      });
    }
  })
  .then(function() {
    var options = {
      user: sharing.userId,
      permissions: params.permissions,
      reshare: params.reshare,
      message: params.message
    };
    if (sharedKeychain) {
      options.keychain = sharedKeychain;
    } else if (params.skipKeychain) {
      options.keychain = {};
    }

    return self.createShare(options, callback);
  })
  .nodeify(callback);
};

Wallet.prototype.listWebhooks = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.get(this.url('/webhooks'))
  .send()
  .result()
  .nodeify(callback);
};

Wallet.prototype.addWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return this.bitgo.post(this.url('/webhooks'))
  .send(params)
  .result()
  .nodeify(callback);
};

Wallet.prototype.removeWebhook = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['url', 'type'], [], callback);

  return this.bitgo.del(this.url('/webhooks'))
  .send(params)
  .result()
  .nodeify(callback);
};

module.exports = Wallet;
