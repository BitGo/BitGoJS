const Dash = require('./dash');

class Tdash extends Dash {
  constructor() {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    super({
      messagePrefix: '\x19Dash Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4
      },
      pubKeyHash: 0x8c,
      scriptHash: 0x13,
      wif: 0xef,
      dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
      dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
      feePerKb: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
      coin: 'dash'
    });
  }

  getChain() {
    return 'tdash';
  }

  getFullName() {
    return 'Testnet Dash';
  }

}

module.exports = Tdash;
