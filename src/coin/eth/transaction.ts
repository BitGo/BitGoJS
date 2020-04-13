/**
 * Ethereum transaction model
 */
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError } from '../baseCoin/errors';
import { KeyPair } from './keyPair';
import { TxData } from './iface';
import { Utils } from './';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

export class Transaction extends BaseTransaction {
  private _parsedTransaction?: TxData; // transaction in JSON format
  private _encodedTransaction?: string; // transaction in hex format
  private _source: string;

  /**
   * Public constructor.
   *
   * @param {Readonly<CoinConfig>} coinConfig
   * @param {TxData} transactionData
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  /**
   * Set the transaction data
   *
   * @param {TxData} transactionData The transaction data to set
   */
  setTransactionData(transactionData: TxData): void {
    this._parsedTransaction = transactionData;
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    //TODO: implement this validation for the ethereum network
    return true;
  }

  /**
   * Sign the transaction with the provided key. It does not check if the signer is allowed to sign
   * it or not.
   *
   * @param {KeyPair} keyPair The key to sign the transaction with
   */
  async sign(keyPair: KeyPair): Promise<void> {
    // Check if there is a transaction to sign
    if (!this._parsedTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    this._encodedTransaction = await Utils.sign(this._parsedTransaction, keyPair);
  }

  /** @inheritdoc */
  toBroadcastFormat(): any {
    if (!this._encodedTransaction) {
      throw new InvalidTransactionError('Missing encoded transaction');
    }
    return '0x' + this._encodedTransaction;
  }

  /** @inheritdoc */
  toJson(): any {
    if (!this._parsedTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this._parsedTransaction;
  }
}
