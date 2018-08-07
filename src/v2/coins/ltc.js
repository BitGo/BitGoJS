const AbstractUtxoCoin = require('./abstractUtxoCoin');
const bitcoin = require('bitgo-utxo-lib');
const Promise = require('bluebird');
const co = Promise.coroutine;
const common = require('../../common');
const request = require('superagent');

class Ltc extends AbstractUtxoCoin {
  constructor() {
    super();
    this.network = {
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
      },
      bech32: 'ltc',
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

  supportsP2wsh() {
    return true;
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
}

module.exports = Ltc;
