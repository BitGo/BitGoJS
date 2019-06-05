const Btg = require('./btg');

class Tbtg extends Btg {
  constructor() {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    super({
      messagePrefix: '\x18Bitcoin Signed Message:\n',
      bech32: 'tb',
      bip32: {
        public: 0x043587cf,
        private: 0x04358394
      },
      pubKeyHash: 0x6f,
      scriptHash: 0xc4,
      wif: 0xef,
      coin: 'btg'
    });
  }

  getChain() {
    return 'tbtg';
  }

  getFullName() {
    return 'Testnet Bitcoin Gold';
  }

}

module.exports = Tbtg;
