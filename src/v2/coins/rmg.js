var BaseCoin = require('../baseCoin');
var common = require('../../common');
var rmgjs = require('rmgjs-lib');
var _ = require('lodash');

var Rmg = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Rmg.prototype;
  this.network = rmgjs.networks.aztec;
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

  var transaction = rmgjs.Transaction.fromHex(txPreBuild.txHex);

  if (transaction.ins.length !== txPreBuild.txInfo.unspents.length) {
    throw new Error('length of unspents array should equal to the number of transaction inputs');
  }

  var keychain = rmgjs.HDNode.fromBase58(userPrv);
  var hdPath = rmgjs.hdPath(keychain);

  for (var index = 0; index < transaction.ins.length; ++index) {
    var currentUnspent = txPreBuild.txInfo.unspents[index];
    var path = "m/0/0/" + currentUnspent.chain + "/" + currentUnspent.index;
    var privKey = hdPath.deriveKey(path);

    var unspentAddress = rmgjs.AztecAddress.fromBase58(currentUnspent.address);
    var subscript = unspentAddress.toScript();
    var txb = rmgjs.TransactionBuilder.fromTransaction(transaction, this.network);
    try {
      txb.sign(index, privKey, subscript, currentUnspent.value);

      // temporary second signature
      var serverKey = rmgjs.ECPair.fromPrivateKeyBuffer(new Buffer('eaf02ca348c524e6392655ba4d29603cd1a7347d9d65cfe93ce1ebffdca22694', 'hex'), this.network);
      txb.sign(index, serverKey, subscript, currentUnspent.value);

    } catch (e) {
      throw new Error('Failed to sign input #' + index);
    }

    transaction = txb.buildIncomplete();
  }

  return {
    txHex: transaction.toBuffer().toString('hex')
  };
};

module.exports = Rmg;
