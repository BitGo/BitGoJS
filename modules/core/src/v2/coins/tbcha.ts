/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { Bcha } from './bcha';
import * as bitcoin from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
import { BaseCoin } from '../baseCoin';
import { UtxoNetwork } from './abstractUtxoCoin';
const co = Bluebird.coroutine;

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
