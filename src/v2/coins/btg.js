const Btc = require('./btc');
const bitcoin = require('bitgo-bitcoinjs-lib');
const Promise = require('bluebird');
const request = require('superagent');
const co = Promise.coroutine;
const common = require('../../common');

const _ = require('lodash');

class Btg extends Btc {
  constructor() {
    super();
    this.network = bitcoin.networks.bitcoingold;
  }

  getChain() {
    return 'btg';
  }

  getFamily() {
    return 'btg';
  }

  getFullName() {
    return 'Bitcoin Gold';
  }

  supportsBlockTarget() {
    return false;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @returns {{txHex}}
   */
  signTransaction(params) {
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
  }

  /**
   * Apply signatures to a funds recovery transaction using user + backup key
   * @param txb {Object} a transaction builder object (with inputs and outputs)
   * @param unspents {Array} the unspents to use in the transaction
   * @param addresses {Array} the address and redeem script info for the unspents
   */
  signRecoveryTransaction(txb, unspents, addresses) {
    const sigHashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143;
    txb.enableBitcoinGold(true);
    txb.setVersion(2);

    // sign the inputs
    const signatureIssues = [];
    unspents.forEach((unspent, i) => {
      const address = addresses[unspent.address];
      const backupPrivateKey = address.backupKey.keyPair;
      const userPrivateKey = address.userKey.keyPair;
      // force-override networks
      backupPrivateKey.network = this.network;
      userPrivateKey.network = this.network;

      const currentSignatureIssue = {
        inputIndex: i,
        unspent: unspent
      };

      try {
        txb.sign(i, backupPrivateKey, address.redeemScript, sigHashType, unspent.amount);
      } catch (e) {
        currentSignatureIssue.error = e;
        signatureIssues.push(currentSignatureIssue);
      }

      try {
        txb.sign(i, userPrivateKey, address.redeemScript, sigHashType, unspent.amount);
      } catch (e) {
        currentSignatureIssue.error = e;
        signatureIssues.push(currentSignatureIssue);
      }
    });

    if (signatureIssues.length > 0) {
      const failedIndices = signatureIssues.map(currentIssue => currentIssue.inputIndex);
      const error = new Error(`Failed to sign inputs at indices ${failedIndices.join(', ')}`);
      error.code = 'input_signature_failure';
      error.signingErrors = signatureIssues;
      throw error;
    }

    return txb;
  }

  recoveryBlockchainExplorerUrl(url) {
    const baseUrl = common.Environments[this.bitgo.env].btgExplorerBaseUrl;

    if (!baseUrl) {
      throw new Error(`Recoveries not supported for ${this.getChain()} - no explorer available`);
    }

    return common.Environments[this.bitgo.env].btgExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58) {
    return co(function *getAddressInfoFromExplorer() {
      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}`)).result();

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58) {
    return co(function *getUnspentInfoFromExplorer() {
      const unspents = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${addressBase58}/utxo`)).result();

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }

}

module.exports = Btg;
