import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Eth } from '../../index';
import { TxData } from '../eth/iface';
import { CgldTransactionData } from './types';
import * as Utils from './utils';

export class Transaction extends Eth.Transaction {
  constructor(_coinConfig: Readonly<CoinConfig>, txData?: TxData) {
    super(_coinConfig, txData);
  }

  setTransactionData(txData: TxData): void {
    this._transactionData = CgldTransactionData.fromJson(txData);
  }

  /**@inheritdoc */
  public static fromSerialized(coinConfig: Readonly<CoinConfig>, serializedTx: string): Transaction {
    const tx = new Transaction(coinConfig, Utils.deserialize(serializedTx));
    return tx;
  }
}
