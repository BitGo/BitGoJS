import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { Eth } from '../../index';
import { getCommon } from './utils';
import { Transaction } from './';

export class TransactionBuilder extends Eth.TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network.type);
    this.transaction = new Transaction(this._coinConfig, this._common);
  }
}
