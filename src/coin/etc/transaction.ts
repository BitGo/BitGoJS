import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { Eth } from '../../index';
import { TxJson } from '../eth/iface';

export class Transaction extends Eth.Transaction {
  constructor(_coinConfig: Readonly<CoinConfig>, txData?: TxJson) {
    super(_coinConfig, txData);
  }
}
