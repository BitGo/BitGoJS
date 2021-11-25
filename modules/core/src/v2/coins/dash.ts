/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, AddressInfo, UnspentInfo, UtxoNetwork } from './abstractUtxoCoin';
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { InsightApi } from './utxo/recovery/insightApi';

export class Dash extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.dash);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Dash(bitgo);
  }

  getChain(): string {
    return 'dash';
  }

  getFamily(): string {
    return 'dash';
  }

  getFullName(): string {
    return 'Dash';
  }

  supportsBlockTarget(): boolean {
    return false;
  }

  getAddressInfoFromExplorer(addressBase58: string): Promise<AddressInfo> {
    return InsightApi.forCoin(this).getAddressInfo(addressBase58);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Promise<UnspentInfo[]> {
    return InsightApi.forCoin(this).getUnspentInfo(addressBase58);
  }
}
