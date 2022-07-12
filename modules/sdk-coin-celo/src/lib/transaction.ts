import { BaseCoin as CoinConfig } from '@bitgo/statics';
import EthereumCommon from '@ethereumjs/common';
import { Transaction as EthTransaction, LegacyTxData } from '@bitgo/sdk-coin-eth';
import { CeloTransactionData } from './types';
import * as Utils from './utils';

export class Transaction extends EthTransaction {
  setTransactionData(txData: LegacyTxData): void {
    this._transactionData = CeloTransactionData.fromJson(txData);
    this.updateFields();
  }

  /** @inheritdoc */
  public static fromSerialized(
    coinConfig: Readonly<CoinConfig>,
    common: EthereumCommon,
    serializedTx: string
  ): Transaction {
    return new Transaction(coinConfig, common, Utils.deserialize(serializedTx));
  }
}
