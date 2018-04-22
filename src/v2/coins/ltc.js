const AbstractUtxoCoin = require('./abstractUtxoCoin');
const bitcoin = require('bitgo-bitcoinjs-lib');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../common');
const request = require('superagent');
const RecoveryTool = require('../recovery');

class Ltc extends AbstractUtxoCoin {
  constructor() {
    super();
    this.network = {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
      },
      pubKeyHash: 0x30,
      scriptHash: 0x32,
      wif: 0xb0,
      dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
      dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
      feePerKb: 100000 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
    };
    // use legacy script hash version, which is the current Bitcoin one
    this.altScriptHash = bitcoin.networks.bitcoin.scriptHash;
    // do not support alt destinations in prod
    this.supportAltScriptDestination = false;
  }

  getChain() {
    return 'ltc';
  }

  getFamily() {
    return 'ltc';
  }

  getFullName() {
    return 'Litecoin';
  }

  supportsBlockTarget() {
    return false;
  }


  /**
   * Canonicalize a Litecoin address for a specific scriptHash version
   * @param address
   * @param scriptHashVersion 1 or 2, where 1 is the old version and 2 is the new version
   * @returns {*} address string
   */
  canonicalAddress(address, scriptHashVersion = 2) {
    if (!this.isValidAddress(address, true)) {
      throw new Error('invalid address');
    }
    const addressDetails = bitcoin.address.fromBase58Check(address);
    if (addressDetails.version === this.network.pubKeyHash) {
      // the pub keys never changed
      return address;
    }

    if ([1, 2].indexOf(scriptHashVersion) === -1) {
      throw new Error('scriptHashVersion needs to be either 1 or 2');
    }
    const scriptHashMap = {
      // altScriptHash is the old one
      1: this.altScriptHash,
      // by default we're using the new one
      2: this.network.scriptHash
    };
    const newScriptHash = scriptHashMap[scriptHashVersion];
    return bitcoin.address.toBase58Check(addressDetails.hash, newScriptHash);
  }

  calculateRecoveryAddress(scriptHashScript) {
    const bitgoAddress = bitcoin.address.fromOutputScript(scriptHashScript, this.network);
    const blockrAddress = this.canonicalAddress(bitgoAddress, 1);
    return blockrAddress;
  }

  recoveryBlockchainExplorerUrl(url) {
    return common.Environments[this.bitgo.env].ltcExplorerBaseUrl + url;
  }

  getAddressInfoFromExplorer(addressBase58) {
    return co(function *getAddressInfoFromExplorer() {
      const address = this.canonicalAddress(addressBase58, 2);

      const addrInfo = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${address}`)).result();

      addrInfo.txCount = addrInfo.txApperances;
      addrInfo.totalBalance = addrInfo.balanceSat;

      return addrInfo;
    }).call(this);
  }

  getUnspentInfoFromExplorer(addressBase58) {
    return co(function *getUnspentInfoFromExplorer() {
      const address = this.canonicalAddress(addressBase58, 2);

      const unspents = yield request.get(this.recoveryBlockchainExplorerUrl(`/addr/${address}/utxo`)).result();

      unspents.forEach(function processUnspent(unspent) {
        unspent.amount = unspent.satoshis;
        unspent.n = unspent.vout;
      });

      return unspents;
    }).call(this);
  }

  /**
   * Recover LTC that was sent to the wrong chain
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
        throw new Error(`ltc recoveries not supported for ${coin}`);
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

module.exports = Ltc;
