const AbstractUtxoCoin = require('./abstractUtxoCoin');
const zcashjs = require('bitcoinjs-lib-zcash');

class Zec extends AbstractUtxoCoin {
  constructor() {
    super();

    // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp#L140
    this.network = {
      messagePrefix: '\x19ZCash Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
      },
      pubKeyHash: 0x1cb8,
      scriptHash: 0x1cbd,
      wif: 0x80,
      dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
      dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
      feePerKb: 100000 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
    };
  }

  getChain() {
    return 'zec';
  }

  getFamily() {
    return 'zec';
  }

  getCoinLibrary() {
    return zcashjs;
  }

  getFullName() {
    return 'ZCash';
  }

  supportsBlockTarget() {
    return false;
  }

}

module.exports = Zec;
