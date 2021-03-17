import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { BuildTransactionError, InvalidTransactionError, ParseTransactionError, SigningError, NotImplementedError } from '../baseCoin/errors';
import { BaseAddress, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { promises } from 'dns';
import { Key } from './iface';
import * as EosJs from 'eosjs';
import { Buffer } from 'buffer';

export class TransactionBuilder extends BaseTransactionBuilder {
  private _transaction: Transaction;
  private _serializedTransaction: string;
  private _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.Send;
    // this._transaction = new Transaction(_coinConfig);
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    throw new NotImplementedError('initBuilder not implemented');
  }

  protected fromImplementation(rawTransaction: string): Transaction {
    // Decoding the transaction is an async operation, so save it and leave the decoding for the
    // build step
    this._serializedTransaction = rawTransaction;
    return new Transaction(this._coinConfig);
  }



  protected async buildImplementation(): Promise<Transaction> {
    // const eosClient = new EosJs({ });

    // If the from() method was called, use the serialized transaction as a base
    if (this._serializedTransaction) {
      console.log('SERIALIZED', this._serializedTransaction)

        const eosClient = new EosJs({ });
        const eosTxStruct = eosClient.fc.structs.transaction;
        const serializedBuffer = Buffer.from(this._serializedTransaction, 'hex');
        const finalTransaction =  EosJs.modules.Fcbuffer.fromBuffer(eosTxStruct, serializedBuffer);
        return finalTransaction;

    } else {

      return Promise.resolve(new Transaction(this._coinConfig));
    }
    this.transaction = new Transaction(this._coinConfig);
    return this.transaction;
  }

  protected signImplementation(key: Key): Transaction {
    // const signer = new KeyPair({ prv: key.key });
    // // Currently public key revelation is the only type of account update tx supported in Tezos
    // if (this._type === TransactionType.AccountUpdate && !this._publicKeyToReveal) {
    //   throw new SigningError('Cannot sign a public key revelation transaction without public key');
    // }
    return new Transaction(this._coinConfig);
  }
  // region Getters and Setters
  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new NotImplementedError('validateAddress not implemented');
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    throw new NotImplementedError('validateKey not implemented');
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Raw transaction is empty');
    }
    if (typeof rawTransaction !== 'string' || /^[0-9a-fA-F]+$/.test(rawTransaction) === false) {
      throw new InvalidTransactionError('Transaction is not a hex string');
    } 
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    //MAYBE NEED THIS
    // if(!Transaction) {
    //   throw new NotImplementedError('validateTransaction not implemented'); // CHANGE
    // }
    // TODO: validate all required fields are present in the builder before buildImplementation
    switch (this._type) {
      case TransactionType.WalletInitialization:
        break;
      case TransactionType.Send:
        break;
      case TransactionType.SingleSigSend:
        break;
      case TransactionType.AccountUpdate:
        break;
      case TransactionType.AddressInitialization:
        break;
      default:
        throw new BuildTransactionError('Transaction type not supported');
    }

  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    throw new NotImplementedError('validateValue not implemented');
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
  // endregion
}
