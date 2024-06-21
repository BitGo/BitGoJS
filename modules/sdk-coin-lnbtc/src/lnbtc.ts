import { AbstractLightningCoin } from '@bitgo/abstract-lightning';
import { BitGoBase, BaseCoin } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

export class Lnbtc extends AbstractLightningCoin {
  constructor(bitgo: BitGoBase, network?: utxolib.Network) {
    super(bitgo, network || utxolib.networks.bitcoin);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Lnbtc(bitgo);
  }

  getChain(): string {
    return 'lnbtc';
  }

  getFamily(): string {
    return 'lnbtc';
  }

  getFullName(): string {
    return 'LightningBitcoin';
  }
}
