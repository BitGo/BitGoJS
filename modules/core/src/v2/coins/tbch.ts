/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { Bch } from './bch';
import * as bitcoin from '@bitgo/utxo-lib';

export class Tbch extends Bch {
  constructor(bitgo: BitGo) {
    super(bitgo, bitcoin.networks.bitcoincashTestnet);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Tbch(bitgo);
  }

  getChain() {
    return 'tbch';
  }

  getFullName() {
    return 'Testnet Bitcoin Cash';
  }

  getAddressPrefix() {
    return 'bchtest';
  }
}
