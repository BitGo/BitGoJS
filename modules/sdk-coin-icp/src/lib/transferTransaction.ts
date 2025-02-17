import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { Utils } from './utils';

export class TransferTransaction extends Transaction {
  constructor(_coinConfig: Readonly<CoinConfig>, utils: Utils) {
    super(_coinConfig, utils);
  }
}
