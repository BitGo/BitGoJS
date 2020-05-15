import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Eth } from '../../index';
import { TxData } from '../eth/iface';
import { CgldTransaction } from './types';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TxData } from '../eth/iface';
import { KeyPair, Utils } from './';

export class Transaction extends Eth.Transaction {
  /** @inheritdoc */
  constructor(_coinConfig: Readonly<CoinConfig>, txData?: TxData) {
    super(_coinConfig, txData);
  }

  setTransactionData(txData: TxData): void {
    this._ethTransaction = CgldTransaction.fromJson(txData);
  }

  /**@inheritdoc */
  public static fromSerialized(coinConfig: Readonly<CoinConfig>, serializedTx: string): Transaction {
    const tx = new Transaction(coinConfig, Utils.deserialize(serializedTx));
    return tx;
  }
}
