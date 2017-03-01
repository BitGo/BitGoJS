var BaseCoin = require('../baseCoin');
var common = require('../../common');
var prova = require('../../prova');
var _ = require('lodash');

var Rmg = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Rmg.prototype;
  this.network = prova.networks.rmg;
};

Rmg.prototype.__proto__ = BaseCoin.prototype;

Rmg.prototype.isValidAddress = function(address) {
  return prova.Address.validateBase58(address, this.network);
};

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Rmg.prototype.signTransaction = function(params) {
  var txPrebuild = params.txPrebuild;
  var userPrv = params.prv;

  var transaction = prova.Transaction.fromHex(txPrebuild.txHex);

  if (transaction.ins.length !== txPrebuild.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  var keychain = prova.HDNode.fromBase58(userPrv, this.network);
  var hdPath = keychain.hdPath();

  for (var index = 0; index < transaction.ins.length; ++index) {
    var currentUnspent = txPrebuild.txInfo.unspents[index];
    var path = "m/0/0/" + currentUnspent.chain + "/" + currentUnspent.index;
    var privKey = hdPath.deriveKey(path);

    var unspentAddress = prova.Address.fromBase58(currentUnspent.address);
    var subscript = unspentAddress.toScript();
    var txb = prova.TransactionBuilder.fromTransaction(transaction, this.network);
    try {
      txb.sign(index, privKey, subscript, currentUnspent.value);
    } catch (e) {
      throw new Error('Failed to sign input #' + index);
    }

    transaction = txb.buildIncomplete();
  }

  return {
    txHex: transaction.toHex()
  };
};

module.exports = Rmg;
