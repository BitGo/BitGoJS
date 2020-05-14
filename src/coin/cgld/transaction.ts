import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Eth } from '../../index';
import { InvalidTransactionError } from '../baseCoin/errors';
import { TxData } from '../eth/iface';
import { EthTransaction } from '../eth/types';
import { KeyPair, Utils } from './';

export class Transaction extends Eth.Transaction {
  private _encodedTransaction?: string;

  /** @inheritdoc */
  constructor(_coinConfig: Readonly<CoinConfig>, txData?: TxData) {
    super(_coinConfig, txData);
  }

  /**
   * Sign the transaction with the provided key. It does not check if the signer is allowed to sign
   * it or not.
   *
   * @param {KeyPair} keyPair The key to sign the transaction with
   */
  async sign(keyPair: KeyPair): Promise<void> {
    // Check if there is a transaction to sign
    if (!this._ethTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    this._encodedTransaction = await Utils.sign(this._ethTransaction.toJson(), keyPair);
  }

  /** @inheritdoc */
  toBroadcastFormat(): any {
    if (!this._encodedTransaction) {
      return super.toBroadcastFormat();
    }
    return this._encodedTransaction;
  }

  /**@inheritdoc */
  public static fromSerialized(coinConfig: Readonly<CoinConfig>, serializedTx: string): Transaction {
    const celoTx = Utils.deserialize(serializedTx);
    console.log('fromJson', EthTransaction.fromJson(celoTx).toJson());
    const tx = new Transaction(coinConfig, EthTransaction.fromJson(celoTx).toJson());
    return tx;
  }
}
