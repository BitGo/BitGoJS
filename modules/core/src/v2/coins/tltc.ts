/**
 * @prettier
 */
import { BaseCoin } from '../baseCoin';
import { Ltc } from './ltc';
import * as bitcoin from 'bitgo-utxo-lib';

export class Tltc extends Ltc {
  constructor(bitgo) {
    // TODO: move to bitgo-utxo-lib (BG-6821)
    super(bitgo, {
      magic: 0xd9b4bef9,
      messagePrefix: '\x19Litecoin Signed Message:\n',
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
      },
      bech32: 'tltc',
      pubKeyHash: 0x6f,
      scriptHash: 0x3a,
      wif: 0xb0,
      dustThreshold: 0, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
      dustSoftThreshold: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.h#L53
      feePerKb: 100000, // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L56
      coin: 'ltc',
    });
    this.altScriptHash = bitcoin.networks.testnet.scriptHash;
    // support alt destinations on test
    this.supportAltScriptDestination = false;
  }

  static createInstance(bitgo: any): BaseCoin {
    return new Tltc(bitgo);
  }

  getChain() {
    return 'tltc';
  }

  getFullName() {
    return 'Testnet Litecoin';
  }
}
