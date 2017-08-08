var Btc = require('./btc');
var bitcoin = require('bcashjs-lib');
var _ = require('lodash');

var Bch = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Bch.prototype;
  this.network = this.network = bitcoin.networks.bitcoin;
};

Bch.prototype.__proto__ = Btc.prototype;

Bch.prototype.getChain = function() {
  return 'bch';
};
Bch.prototype.getFamily = function() {
  return 'bch';
};

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Bch.prototype.signTransaction = function(params) {
  var txPrebuild = params.txPrebuild;
  var userPrv = params.prv;

  var transaction = bitcoin.Transaction.fromHex(txPrebuild.txHex);

  if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  const sigHashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143;
  var keychain = bitcoin.HDNode.fromBase58(userPrv);
  var hdPath = bitcoin.hdPath(keychain);

  for (var index = 0; index < transaction.ins.length; ++index) {
    var path = 'm/0/0/' + txPrebuild.txInfo.unspents[index].chain + '/' + txPrebuild.txInfo.unspents[index].index;
    var privKey = hdPath.deriveKey(path);
    var value = txPrebuild.txInfo.unspents[index].value;

    var txb = bitcoin.TransactionBuilder.fromTransaction(transaction);
    txb.enableBitcoinCash(true);
    // TODO (arik): Figure out if version 2 is actually necessary
    txb.setVersion(2);
    var subscript = new Buffer(txPrebuild.txInfo.unspents[index].redeemScript, 'hex');
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
