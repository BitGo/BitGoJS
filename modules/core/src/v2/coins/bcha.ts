/**
 * @prettier
 */
import { BitGo } from '../../bitgo';
import { Bch } from './bch';
import * as Bluebird from 'bluebird';
import { BaseCoin } from '../baseCoin';
import { AddressInfo, UnspentInfo } from './abstractUtxoCoin';
import { BlockchairApi } from '../recovery/blockchairApi';

export class Bcha extends Bch {
  static createInstance(bitgo: BitGo): BaseCoin {
    return new Bcha(bitgo);
  }

  getChain(): string {
    return 'bcha';
  }

  getFamily(): string {
    return 'bcha';
  }

  getFullName(): string {
    return 'Bitcoin ABC';
  }

  getAddressInfoFromExplorer(addressBase58: string, apiKey: string): Bluebird<AddressInfo> {
    const explorer = new BlockchairApi(this.bitgo, 'ecash', apiKey);
    return Bluebird.resolve(explorer.getAccountInfo(addressBase58));
  }

  getUnspentInfoFromExplorer(addressBase58: string, apiKey: string): Bluebird<UnspentInfo[]> {
    const explorer = new BlockchairApi(this.bitgo, 'ecash', apiKey);
    return Bluebird.resolve(explorer.getUnspents(addressBase58));
  }
}
