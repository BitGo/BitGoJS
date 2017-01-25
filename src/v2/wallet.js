var common = require('../common');
var Q = require('q');

var Wallet = function(bitgo, baseCoin, walletData) {
  this.bitgo = bitgo;
  this.baseCoin = baseCoin;
  this._wallet = walletData;
};

Wallet.prototype.balance = function() {
  return 'base balance';
};

/**
 * List the transactions for a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.transactions = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/tx'))
  .result()
  .nodeify(callback);
};

/**
 * List the transfers for a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.transfers = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/transfer'))
  .result()
  .nodeify(callback);
};

/**
 * List the addresses for a given wallet
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.addresses = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], [], callback);

  var query = {};

  if (params.mine) {
    query.mine = !!params.mine;
  }

  if(params.prevId){
    if (typeof(params.prevId) != 'number') {
      throw new Error('invalid prevId argument, expecting number');
    }
    query.prevId = params.prevId;
  }

  return this.bitgo.get(this.baseCoin.url('/wallet/' + this._wallet.id + '/addresses'))
  .query(query)
  .result()
  .nodeify(callback);
};

/**
 * Create a new address for use with this wallet
 *
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.createAddress = function(params, callback) {
  var self = this;
  params = params || {};
  common.validateParams(params, [], [], callback);

  params.chain = params.chain || 0;
  return this.bitgo.post(this.baseCoin.url('/wallet/' + this._wallet.id + '/address'))
  .send(params)
  .result()
  .nodeify(callback);
};

/**
 * Send coins to a recipient
 * @param params
 * address - the destination address
 * amount - the amount in satoshis to be sent
 * message - optional message to attach to transaction
 * walletPassphrase - the passphrase to be used to decrypt the user key on this wallet
 * prv - the private key in string form, if walletPassphrase is not available
 * @param callback
 * @returns {*}
 */
Wallet.prototype.send = function(params, callback) {
  params = params || {};
  common.validateParams(params, ['address'], ['message'], callback);

  if (typeof(params.amount) != 'number') {
    throw new Error('invalid argument for amount - number expected');
  }

  params.recipients = [{
    address: params.address,
    amount: params.amount
  }];

  return this.sendMany(params)
  .nodeify(callback);
};

/**
 * Send money to multiple recipients
 * 1. Gets the user keychain by checking the wallet for a key which has an encrypted prv
 * 2. Decrypts user key
 * 3. Creates the transaction with default fee
 * 4. Signs transaction with decrypted user key
 * 5. Sends the transaction to BitGo
 * @param params
 * @param callback
 * @returns {*}
 */
Wallet.prototype.sendMany = function(params, callback) {
  params = params || {};
  common.validateParams(params, [], ['message', 'otp'], callback);
  var self = this;

  if (!(params.recipients instanceof Array)) {
    throw new Error('expecting recipients array');
  }

  var txPrebuildPromise = self.bitgo.post(self.baseCoin.url('/wallet/' + self._wallet.id + '/tx/build'))
  .send({ recipients: params.recipients })
  .result();

  var userKeychainPromise = self.baseCoin.keychains().get({ id: self._wallet.keys[0] });

  return Q.all([txPrebuildPromise, userKeychainPromise, params])
  // preserve the "this"-reference in signTransaction
  .spread(self.baseCoin.signTransaction.bind(self.baseCoin))
  .then(function(halfSignedTransaction) {
    return self.bitgo.post(self.baseCoin.url('/wallet/' + self._wallet.id + '/tx/send'))
    .send(halfSignedTransaction)
    .result();
  })
  .nodeify(callback);
};

module.exports = Wallet;
