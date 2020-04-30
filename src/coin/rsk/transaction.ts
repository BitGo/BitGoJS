import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { Eth } from '../../index';

export class Transaction extends Eth.Transaction {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
}
