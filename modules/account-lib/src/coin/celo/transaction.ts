import { BaseCoin as CoinConfig } from '@bitgo/statics';
import EthereumCommon from 'ethereumjs-common';
import * as Eth from '../eth';
import { TxData } from '../eth/iface';
import { CeloTransactionData } from './types';
import * as Utils from './utils';

export class Transaction extends Eth.Transaction {
  setTransactionData(txData: TxData): void {
    this._transactionData = CeloTransactionData.fromJson(txData);
    this.updateFields();
  }

  /** @inheritdoc */
  public static fromSerialized(
    coinConfig: Readonly<CoinConfig>,
    common: EthereumCommon,
    serializedTx: string,
  ): Transaction {
    return new Transaction(coinConfig, common, Utils.deserialize(serializedTx));
  }
}
