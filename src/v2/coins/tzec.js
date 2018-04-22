const Zec = require('./zec');

class Tzec extends Zec {
  constructor() {
    super();

    // https://github.com/zcash/zcash/blob/master/src/chainparams.cpp#L295
    this.network = {
      messagePrefix: '\x19ZCash Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
      },
      pubKeyHash: 0x1d25,
      scriptHash: 0x1cba,
      wif: 0xef,
      dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
      dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
      feePerKb: 100000 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
    };
  }

  getChain() {
    return 'tzec';
  }

  getFullName() {
    return 'Testnet ZCash';
  }

}

module.exports = Tzec;
