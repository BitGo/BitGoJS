/**
 * Ethereum transaction model
 */
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { InvalidTransactionError, SigningError } from '../baseCoin/errors';
import { KeyPair } from './keyPair';
import { TxData } from './iface';
import { EthTransaction } from './types';

export class Transaction extends BaseTransaction {
  protected _ethTransaction?: EthTransaction;

  /**
   * return a new Transaction initialized with the serialized tx string
   *
   * @param coinConfig The coin configuration object
   * @param serializedTx The serialized tx string with which to initialize the transaction
   * @returns a new transaction object
   */
  public static fromSerialized(coinConfig: Readonly<CoinConfig>, serializedTx: string): Transaction {
    return new Transaction(coinConfig, EthTransaction.fromSerialized(serializedTx).toJson());
  }

  /**
   * Public constructor.
   *
   * @param {Readonly<CoinConfig>} coinConfig
   * @param {TxData} txData The object transaction data or encoded transaction data
   */
  constructor(coinConfig: Readonly<CoinConfig>, txData?: TxData) {
    super(coinConfig);
    if (txData) {
      this._ethTransaction = EthTransaction.fromJson(txData);
    }
  }

  /**
   * Set the transaction data
   *
   * @param {TxData} txData The transaction data to set
   */
  setTransactionData(txData: TxData): void {
    this._ethTransaction = EthTransaction.fromJson(txData);
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
    if (!this._ethTransaction) {
      throw new InvalidTransactionError('No transaction data to sign');
    }
    if (!keyPair.getKeys().prv) {
      throw new SigningError('Missing private key');
    }
    this._ethTransaction.sign(keyPair);
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (this._ethTransaction) {
      return this._ethTransaction.toSerialized();
    }
    throw new InvalidTransactionError('No transaction data to format');
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (this._ethTransaction) {
      return this._ethTransaction.toJson();
    }
    throw new InvalidTransactionError('Empty transaction');
  }
}
