const btcPrototype = require('./btc').prototype;
const bitcoin = require('bitcoinjs-lib');
const _ = require('lodash');

const Bch = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = this.network = bitcoin.networks.bitcoin;
};

Bch.prototype = Object.create(btcPrototype);
Bch.constructor = Bch;

Bch.prototype.getChain = function() {
  return 'bch';
};
Bch.prototype.getFamily = function() {
  return 'bch';
};

Bch.prototype.getFullName = function() {
  return 'Bitcoin Cash';
};

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Bch.prototype.signTransaction = function(params) {
  const txPrebuild = params.txPrebuild;
  const userPrv = params.prv;

  if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
    if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }
    throw new Error('missing txPrebuild parameter');
  }

  let transaction = bitcoin.Transaction.fromHex(txPrebuild.txHex);

  if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
    if (!_.isUndefined(userPrv) && !_.isString(userPrv)) {
      throw new Error(`prv must be a string, got type ${typeof userPrv}`);
    }
    throw new Error('missing prv parameter to sign transaction');
  }

  const sigHashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143;
  const keychain = bitcoin.HDNode.fromBase58(userPrv);
  const hdPath = bitcoin.hdPath(keychain);

  for (let index = 0; index < transaction.ins.length; ++index) {
    const path = 'm/0/0/' + txPrebuild.txInfo.unspents[index].chain + '/' + txPrebuild.txInfo.unspents[index].index;
    const privKey = hdPath.deriveKey(path);
    const value = txPrebuild.txInfo.unspents[index].value;

    const txb = bitcoin.TransactionBuilder.fromTransaction(transaction);
    txb.enableBitcoinCash(true);
    // TODO (arik): Figure out if version 2 is actually necessary
    txb.setVersion(2);
    const subscript = new Buffer(txPrebuild.txInfo.unspents[index].redeemScript, 'hex');
    try {
      txb.sign(index, privKey, subscript, sigHashType, value);
    } catch (e) {
      throw new Error('Failed to sign input #' + index);
    }

    transaction = txb.buildIncomplete();
  }

  return {
    txHex: transaction.toBuffer().toString('hex')
  };
};

module.exports = Bch;
