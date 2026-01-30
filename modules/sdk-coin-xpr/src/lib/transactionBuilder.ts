/**
 * Proton (XPR Network) Transaction Builder base class
 */

import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  Transaction as EosioTransaction,
  Action,
  Name,
  Asset,
  Serializer,
  UInt16,
  UInt32,
  TimePointSec,
  Struct,
} from '@greymass/eosio';
import BigNumber from 'bignumber.js';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { isValidAddress, isValidRawTransaction } from './utils';
import {
  MAINNET_CHAIN_ID,
  TESTNET_CHAIN_ID,
  TOKEN_CONTRACT,
  XPR_SYMBOL,
  XPR_PRECISION,
  DEFAULT_EXPIRATION_SECONDS,
} from './constants';

/**
 * Define the transfer struct for eosio.token
 */
class Transfer extends Struct {
  static abiName = 'transfer';
  static abiFields = [
    { name: 'from', type: Name },
    { name: 'to', type: Name },
    { name: 'quantity', type: Asset },
    { name: 'memo', type: 'string' },
  ];
}

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _sender: string;
  protected _expiration: string;
  protected _refBlockNum: number;
  protected _refBlockPrefix: number;
  protected _signers: KeyPair[] = [];
  protected _chainId: string;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._transaction = new Transaction(coinConfig);
    this._chainId = coinConfig.name === 'txpr' ? TESTNET_CHAIN_ID : MAINNET_CHAIN_ID;
  }

  /**
   * The transaction type
   */
  protected abstract get transactionType(): TransactionType;

  /**
   * Initialize the builder from an existing transaction
   */
  initBuilder(tx: Transaction): void {
    const json = tx.toJson();
    this._sender = json.sender;
    this._expiration = json.expiration;
    this._refBlockNum = json.refBlockNum;
    this._refBlockPrefix = json.refBlockPrefix;
    this._transaction = tx;
  }

  /**
   * Set the sender account
   */
  sender(address: string): this {
    if (!isValidAddress(address)) {
      throw new BuildTransactionError(`Invalid sender address: ${address}`);
    }
    this._sender = address;
    return this;
  }

  /**
   * Set the transaction expiration
   * @param expiration - ISO date string or seconds from now
   */
  expiration(expiration: string | number): this {
    if (typeof expiration === 'number') {
      const date = new Date(Date.now() + expiration * 1000);
      this._expiration = date.toISOString().split('.')[0];
    } else {
      this._expiration = expiration;
    }
    return this;
  }

  /**
   * Set the reference block number
   */
  refBlockNum(refBlockNum: number): this {
    this._refBlockNum = refBlockNum & 0xffff; // Only use lower 16 bits
    return this;
  }

  /**
   * Set the reference block prefix
   */
  refBlockPrefix(refBlockPrefix: number): this {
    this._refBlockPrefix = refBlockPrefix;
    return this;
  }

  /**
   * Set the chain ID
   */
  chainId(chainId: string): this {
    this._chainId = chainId;
    this._transaction.chainId = chainId;
    return this;
  }

  /**
   * Build the transaction from a raw transaction string
   */
  protected fromImplementation(rawTransaction: string): Transaction {
    this.validateRawTransaction(rawTransaction);
    const tx = new Transaction(this._coinConfig);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return tx;
  }

  /**
   * Sign the transaction
   */
  protected signImplementation(key: BaseKey): Transaction {
    this.validateKey(key);
    const keyPair = new KeyPair({ prv: key.key });
    this._signers.push(keyPair);
    return this._transaction;
  }

  /**
   * Build the transaction
   */
  protected async buildImplementation(): Promise<Transaction> {
    this.validateTransaction();

    // Set default expiration if not set
    if (!this._expiration) {
      this.expiration(DEFAULT_EXPIRATION_SECONDS);
    }

    // Build the EOSIO transaction
    const eosioTx = this.buildEosioTransaction();
    this._transaction.eosioTransaction = eosioTx;
    this._transaction.chainId = this._chainId;
    this._transaction.setTransactionType(this.transactionType);

    // Sign with all signers
    for (const signer of this._signers) {
      await this._transaction.sign(signer);
    }

    // Load inputs and outputs
    this._transaction.loadInputsAndOutputs();

    return this._transaction;
  }

  /**
   * Build the EOSIO transaction - to be implemented by subclasses
   */
  protected abstract buildEosioTransaction(): EosioTransaction;

  /**
   * Get the transaction object
   */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /**
   * Set the transaction object
   */
  protected set transaction(tx: Transaction) {
    this._transaction = tx;
  }

  /**
   * Validate a key
   */
  validateKey(key: BaseKey): void {
    try {
      new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /**
   * Validate an address
   */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError(`Invalid address: ${address.address}`);
    }
  }

  /**
   * Validate a value
   */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be negative');
    }
  }

  /**
   * Validate a raw transaction
   */
  validateRawTransaction(rawTransaction: string): void {
    if (!isValidRawTransaction(rawTransaction)) {
      throw new BuildTransactionError('Invalid raw transaction format');
    }
  }

  /**
   * Validate the transaction before building
   */
  validateTransaction(transaction?: Transaction): void {
    if (!this._sender) {
      throw new BuildTransactionError('Sender is required');
    }
    if (this._refBlockNum === undefined) {
      throw new BuildTransactionError('Reference block number is required');
    }
    if (this._refBlockPrefix === undefined) {
      throw new BuildTransactionError('Reference block prefix is required');
    }
  }
}
