const AbstractUtxoCoin = require('./abstractUtxoCoin');
const bitcoin = require('bitgo-bitcoinjs-lib');
const request = require('superagent');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../common');
const cashaddress = require('cashaddress');
const _ = require('lodash');
const RecoveryTool = require('../recovery');

const VALID_ADDRESS_VERSIONS = {
  base58: 'base58',
  bech32: 'bech32'
};

const containsMixedCaseCharacters = (str) => {
  return str !== _.toLower(str) && str !== _.toUpper(str);
};

class Bch extends AbstractUtxoCoin {

  constructor() {
    super();
    this.network = this.network = bitcoin.networks.bitcoin;
    this.bchPrefix = 'bitcoincash';
  }

  getChain() {
    return 'bch';
  }

  getFamily() {
    return 'bch';
  }

  getFullName() {
    return 'Bitcoin Cash';
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
    txb.enableBitcoinCash(true);
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
      try {
        txb.sign(index, privKey, subscript, sigHashType, currentUnspent.value);
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
   * Canonicalize a Bitcoin Cash address for a specific version
   *
   * Starting on January 14th, 2018 Bitcoin Cash's bitcoin-abc node switched over to using bech32
   * encoding for all of their addresses in order to distinguish them from Bitcoin Core's
   * https://www.bitcoinabc.org/cashaddr. We're sticking with the old base58 format because
   * migrating over to the new format will be laborious, and we want to see how the space evolves
   *
   * @param address
   * @param version the version of the desired address, 'base58' or 'bech32' defaulting to 'base58'
   * @returns {*} address string
   */
  canonicalAddress(address, version = 'base58') {
    if (!_.includes(_.keys(VALID_ADDRESS_VERSIONS), version)) {
      throw new Error('version needs to be either bech32 or base58');
    }

    const originalAddress = address; // used for error message

    let isValidBase58Address;
    let isValidBech32Address;
    try {
      isValidBase58Address = this.isValidAddress(address, true);
    } catch (e) {
      // ignore
    }
    try {
      isValidBech32Address = !!cashaddress.decode(address);
    } catch (e) {
      // try to coerce the address into a valid BCH bech32 address if we know it's not a base58 address
      // We do this to remain compliant with the spec at https://github.com/Bitcoin-UAHF/spec/blob/master/cashaddr.md,
      // which says addresses do not need the prefix, and can be all lowercase XOR all uppercase
      if (!isValidBase58Address) {
        if (!_.startsWith(address, this.bchPrefix + ':')) {
          address = this.bchPrefix + ':' + address;
        }
        if (containsMixedCaseCharacters(address.split(':')[1])) {
          // we should reject these addresses
        } else {
          address = _.toLower(address);

          try {
            isValidBech32Address = !!cashaddress.decode(address);
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (!isValidBase58Address && !isValidBech32Address) {
      throw new Error('invalid address: ' + originalAddress);
    }

    // mapping to cashaddress's script versions
    const versionMap = {
      [this.network.pubKeyHash]: 'pubkeyhash',
      [this.network.scriptHash]: 'scripthash'
    };
    // another mapping to cashaddress's script versions
    const scriptVersionMap = {
      pubkeyhash: 'pubKeyHash',
      scripthash: 'scriptHash'
    };

    // convert from base58
    if (isValidBase58Address) {
      if (version === VALID_ADDRESS_VERSIONS.base58) {
        // no conversion needed
        return address;
      }
      const addressDetails = bitcoin.address.fromBase58Check(address);

      // JS annoyingly converts JSON Object variable keys to Strings, so we have to do so as well
      const addressVersionString = String(addressDetails.version);

      if (!_.includes(_.keys(versionMap), addressVersionString)) {
        throw new Error('invalid address version: ' + addressVersionString + '. Expected one of ' + _.keys(versionMap));
      }

      return cashaddress.encode(this.bchPrefix, versionMap[addressVersionString], addressDetails.hash);
    }

    // convert from bech32
    if (version === VALID_ADDRESS_VERSIONS.bech32) {
      // no conversion needed
      return address;
    }

    const rawBytes = cashaddress.decode(address);
    return bitcoin.address.toBase58Check(rawBytes.hash, this.network[scriptVersionMap[rawBytes.version]]);
  }

  /**
   * Apply signatures to a funds recovery transaction using user + backup key
   * @param txb {Object} a transaction builder object (with inputs and outputs)
   * @param unspents {Array} the unspents to use in the transaction
   * @param addresses {Array} the address and redeem script info for the unspents
   */
  signRecoveryTransaction(txb, unspents, addresses) {
    const sigHashType = bitcoin.Transaction.SIGHASH_ALL | bitcoin.Transaction.SIGHASH_BITCOINCASHBIP143;
    txb.enableBitcoinCash(true);
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
    return common.Environments[this.bitgo.env].bchExplorerBaseUrl + url;
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

  /**
   * Recover BCH that was sent to the wrong chain
   * @param coin {String} the coin type of the wallet that received the funds
   * @param walletId {String} the wallet ID of the wallet that received the funds
   * @param txid {String} The txid of the faulty transaction
   * @param recoveryAddress {String} address to send recovered funds to
   * @param walletPassphrase {String} the wallet passphrase
   * @param xprv {String} the unencrypted xprv (used instead of wallet passphrase)
   * @returns {{version: number, sourceCoin: string, recoveryCoin: string, walletId: string, recoveryAddres: string, recoveryAmount: number, txHex: string, txInfo: Object}}
   */
  recoverFromWrongChain(params, callback) {
    return co(function *recoverFromWrongChain() {
      const {
        txid,
        recoveryAddress,
        wallet,
        coin,
        walletPassphrase,
        xprv
      } = params;

      const allowedRecoveryCoins = ['btc'];

      if (!allowedRecoveryCoins.includes(coin)) {
        throw new Error(`bch recoveries not supported for ${coin}`);
      }

      const recoveryTool = new RecoveryTool({
        bitgo: this.bitgo,
        sourceCoin: this.getFamily(),
        recoveryType: coin,
        test: !(this.bitgo.env === 'prod'),
        logging: false
      });

      yield recoveryTool.buildTransaction({
        wallet: wallet,
        faultyTxId: txid,
        recoveryAddress: recoveryAddress
      });

      yield recoveryTool.signTransaction({ passphrase: walletPassphrase, prv: xprv });

      return recoveryTool.export();
    }).call(this).asCallback(callback);
  }

}

module.exports = Bch;
