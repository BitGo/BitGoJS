/**
 * @prettier
 */
import * as utxolib from '@bitgo/utxo-lib';
import { BitGo } from '../../bitgo';
import { BaseCoin } from '../baseCoin';
import { AbstractUtxoCoin, AddressInfo, UnspentInfo, UtxoNetwork } from './abstractUtxoCoin';
import { InsightApi } from './utxo/recovery/insightApi';

export class Zec extends AbstractUtxoCoin {
  constructor(bitgo: BitGo, network?: UtxoNetwork) {
    super(bitgo, network || utxolib.networks.zcash);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Zec(bitgo);
  }

  getChain() {
    return 'zec';
  }

  getFamily() {
    return 'zec';
  }

  getFullName() {
    return 'ZCash';
  }

  supportsBlockTarget() {
    return false;
  }

  getAddressInfoFromExplorer(addressBase58: string): Promise<AddressInfo> {
    return InsightApi.forCoin(this).getAddressInfo(addressBase58);
  }

  getUnspentInfoFromExplorer(addressBase58: string): Promise<UnspentInfo[]> {
    return InsightApi.forCoin(this).getUnspentInfo(addressBase58);
  }
}
