import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { AccountId } from '@hashgraph/sdk';
import { BaseTransactionBuilder } from '../baseCoin';
import {
  BuildTransactionError,
  InvalidParameterValueError,
  ParseTransactionError,
  SigningError,
  NotImplementedError
} from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import {KeyPair} from './keyPair'
// import { isValidAddress, isValidRawTransactionFormat } from './utils';

export const DEFAULT_M = 3;
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _source: BaseAddress;
  private _fee: BaseFee;
  private _transaction: Transaction;


  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    
    throw new NotImplementedError('buildImplementation not implemented');

    // return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    throw new NotImplementedError('fromImplementation not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('signImplementation not implemented');
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    throw new NotImplementedError('initBuilder not implemented');
  }

  // endregion

  // region Common builder methods

  /**
   * Set the transaction fees
   *
   * @param {BaseFee} fee The maximum gas to pay
   * @returns {TransactionBuilder} This transaction builder
   */
  fee(fee: BaseFee): this {
    this.validateValue(new BigNumber(fee.fee));
    this._fee = fee;
    return this;
  }

  /**
   * Set the transaction source
   *
   * @param {BaseAddress} address The source account
   * @returns {TransactionBuilder} This transaction builder
   */
  source(address: BaseAddress): this {
    this.validateAddress(address);
    this._source = address;
    return this;
  }

  /**
   * Set an external transaction signature
   *
   * @param signature Hex encoded signature string
   * @param keyPair The public key keypair that was used to create the signature
   * @returns This transaction builder
   */
  signature(signature: string, keyPair: KeyPair): this {
    throw new NotImplementedError('initializeBuilder not implemented');
  }

  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    // if (!isValidAddress(address.address)) {
    //   throw new BuildTransactionError('Invalid address ' + address.address);
    // }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!new KeyPair({ prv: key.key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    // if (!isValidRawTransactionFormat(rawTransaction)) {
    //   throw new ParseTransactionError('Invalid raw transaction');
    // }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateMandatoryFields();
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  validateMandatoryFields(): void {
    throw new NotImplementedError('validateMandatoryFields not implemented');
    // if (this._fee === undefined) {
    //   throw new BuildTransactionError('Invalid transaction: missing fee');
    // }
    // if (this._source === undefined) {
    //   throw new BuildTransactionError('Invalid transaction: missing source');
    // }
  }

  /**
   * Validates that the given key is not already in this._multiSignerKeyPairs
   *
   * @param {BaseKey} key - The key to check
   */
  private checkDuplicatedKeys(key: BaseKey) {
    throw new NotImplementedError('checkDuplicatedKeys not implemented');
    // this._multiSignerKeyPairs.forEach(_sourceKeyPair => {
    //   if (_sourceKeyPair.getKeys().prv === key.key) {
    //     throw new SigningError('Repeated sign: ' + key.key);
    //   }
    // });
  }
  // endregion

    /** @inheritdoc */
    protected get transaction(): Transaction {
      return this._transaction;
    }
  
    /** @inheritdoc */
    protected set transaction(transaction: Transaction) {
      this._transaction = transaction;
    }
}
