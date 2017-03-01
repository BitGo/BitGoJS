var BaseCoin = require('../baseCoin');
var common = require('../../common');
var bitcoin = require('bitcoinjs-lib');
var _ = require('lodash');

var Btc = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Btc.prototype;
  this.network = bitcoin.networks.bitcoin;
};

Btc.prototype.__proto__ = BaseCoin.prototype;

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Btc.prototype.signTransaction = function(params) {
  var txPrebuild = params.txPrebuild;
  var userPrv = params.prv;

  var transaction = bitcoin.Transaction.fromHex(txPrebuild.txHex);

  if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  var keychain = bitcoin.HDNode.fromBase58(userPrv);
  var hdPath = bitcoin.hdPath(keychain);

  for (var index = 0; index < transaction.ins.length; ++index) {
    var path = "m/0/0/" + txPrebuild.txInfo.unspents[index].chain + "/" + txPrebuild.txInfo.unspents[index].index;
    var privKey = hdPath.deriveKey(path);

    var subscript = new Buffer(txPrebuild.txInfo.unspents[index].redeemScript, 'hex');
    var txb = bitcoin.TransactionBuilder.fromTransaction(transaction, this.network);
    try {
      txb.sign(index, privKey, subscript, bitcoin.Transaction.SIGHASH_ALL);
    } catch (e) {
      throw new Error('Failed to sign input #' + index);
    }

    transaction = txb.buildIncomplete();
  }

  return {
    txHex: transaction.toBuffer().toString('hex')
  };
};

module.exports = Btc;
