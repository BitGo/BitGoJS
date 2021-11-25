/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';

import { AddressInfo, UnspentInfo, UtxoNetwork } from './abstractUtxoCoin';
import { BaseCoin } from '../baseCoin';
import { Bch } from './bch';
import { BitGo } from '../../bitgo';
import { BlockchairApi } from './utxo/recovery/blockchairApi';

export class Bsv extends Bch {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.bitcoinsv);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Bsv(bitgo);
  }

  getChain(): string {
    return 'bsv';
  }

  getFamily(): string {
    return 'bsv';
  }

  getFullName(): string {
    return 'Bitcoin SV';
  }

  getAddressInfoFromExplorer(addressBase58: string, apiKey?: string): Promise<AddressInfo> {
    const explorer = new BlockchairApi(this.bitgo, 'bitcoin-sv', apiKey);
    return explorer.getAccountInfo(addressBase58);
  }

  getUnspentInfoFromExplorer(addressBase58: string, apiKey?: string): Promise<UnspentInfo[]> {
    const explorer = new BlockchairApi(this.bitgo, 'bitcoin-sv', apiKey);
    return explorer.getUnspents(addressBase58);
  }
}
