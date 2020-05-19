import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Eth } from '../../index';
import { TxData } from '../eth/iface';

export class Transaction extends Eth.Transaction {
  constructor(_coinConfig: Readonly<CoinConfig>, txData?: TxData) {
    super(_coinConfig, txData);
  }
}
