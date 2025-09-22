import { AbstractLightningCoin } from '@bitgo-beta/abstract-lightning';
import { BitGoBase, BaseCoin } from '@bitgo-beta/sdk-core';
import * as utxolib from '@bitgo-beta/utxo-lib';

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
    return 'Lightning Bitcoin';
  }
}
