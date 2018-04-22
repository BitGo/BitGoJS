const AbstractUtxoCoin = require('./abstractUtxoCoin');

class Dash extends AbstractUtxoCoin {
  constructor() {
    super();

    // https://github.com/dashpay/dash/blob/master/src/chainparams.cpp#L152
    this.network = {
      messagePrefix: '\x19Dash Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
      },
      pubKeyHash: 0x4c,
      scriptHash: 0x10,
      wif: 0xcc,
      dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
      dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
      feePerKb: 100000 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
    };
  }

  getChain() {
    return 'dash';
  }

  getFamily() {
    return 'dash';
  }

  getFullName() {
    return 'Dash';
  }

  supportsBlockTarget() {
    return false;
  }

}

module.exports = Dash;
