const btcPrototype = require('./btc').prototype;
const bitcoin = require('bitgo-bitcoinjs-lib');
const _ = require('lodash');

const Btg = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.network = bitcoin.networks.bitcoingold;
};

Btg.prototype = Object.create(btcPrototype);
Btg.constructor = Btg;

Btg.prototype.getChain = function() {
  return 'btg';
};
Btg.prototype.getFamily = function() {
  return 'btg';
};

Btg.prototype.getFullName = function() {
  return 'Bitcoin Gold';
};

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Btg.prototype.signTransaction = function(params) {
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

  const txb = bitcoin.TransactionBuilder.fromTransaction(transaction);
  txb.enableBitcoinGold(true);
  txb.setVersion(2);

  const signatureIssues = [];

  for (let index = 0; index < transaction.ins.length; ++index) {
    const currentUnspent = txPrebuild.txInfo.unspents[index];
    const path = 'm/0/0/' + txPrebuild.txInfo.unspents[index].chain + '/' + txPrebuild.txInfo.unspents[index].index;
    const privKey = hdPath.deriveKey(path);

    const currentSignatureIssue = {
      inputIndex: index,
      unspent: currentUnspent,
      path: path
    };

    const subscript = new Buffer(txPrebuild.txInfo.unspents[index].redeemScript, 'hex');
    const isSegwit = !!currentUnspent.witnessScript;
    let witnessScript;
    if (isSegwit) {
      witnessScript = Buffer.from(currentUnspent.witnessScript, 'hex');
    }
    try {
      txb.sign(index, privKey, subscript, sigHashType, currentUnspent.value, witnessScript);
    } catch (e) {
      currentSignatureIssue.error = e;
      signatureIssues.push(currentSignatureIssue);
      continue;
    }

    transaction = txb.buildIncomplete();
  }

  if (signatureIssues.length > 0) {
    const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex);
    const error = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
    error.code = 'input_signature_failure';
    error.signingErrors = signatureIssues;
    throw error;
  }

  return {
    txHex: transaction.toBuffer().toString('hex')
  };
};

module.exports = Btg;
