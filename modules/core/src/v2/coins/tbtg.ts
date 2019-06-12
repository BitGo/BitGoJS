import { BaseCoin } from '../baseCoin';
import { Btg } from './btg';

export class Tbtg extends Btg {
  constructor(bitgo) {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    super(bitgo, {
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

  static createInstance(bitgo: any): BaseCoin {
    return new Tbtg(bitgo);
  }

  getChain() {
    return 'tbtg';
  }

  getFullName() {
    return 'Testnet Bitcoin Gold';
  }
}
