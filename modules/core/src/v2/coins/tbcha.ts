/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { Bcha } from './bcha';
import * as bitcoin from '@bitgo/utxo-lib';
import { BaseCoin } from '../baseCoin';

export class Tbcha extends Bcha {
  constructor(bitgo: BitGo) {
    super(bitgo, bitcoin.networks.bitcoincashTestnet);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tbcha(bitgo);
  }

  getChain(): string {
    return 'tbcha';
  }

  getFullName(): string {
    return 'Testnet Bitcoin ABC';
  }
}
