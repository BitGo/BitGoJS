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

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param txPreBuild
 * @param userKeychain
 * @param params
 * @returns {{txHex}}
 */
Rmg.prototype.signTransaction = function(txPreBuild, userKeychain, params) {
  var userPrv = params.prv;
  if (!userPrv) {
    // the server is going to change to include the encryptedPrv in the response
    var userEncryptedPrv = userKeychain.encryptedPrv;
    userPrv = this.bitgo.decrypt({ input: userEncryptedPrv, password: params.walletPassphrase });
  }

  var transaction = prova.Transaction.fromHex(txPreBuild.txHex);

  if (transaction.ins.length !== txPreBuild.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  var keychain = prova.HDNode.fromBase58(userPrv, this.network);
  var hdPath = keychain.hdPath();

  for (var index = 0; index < transaction.ins.length; ++index) {
    var currentUnspent = txPreBuild.txInfo.unspents[index];
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
