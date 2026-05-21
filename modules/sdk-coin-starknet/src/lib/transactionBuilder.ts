import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  MethodNotImplementedError,
  SigningError,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { StarknetTransactionData, StarknetTransactionType, StarknetCall } from './iface';
import { Transaction } from './transaction';
import utils from './utils';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _sender?: string;
  protected _publicKey?: string;
  protected _calls: StarknetCall[] = [];
  protected _nonce?: string;
  protected _chainId?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  public sender(address: string, pubKey?: string): this {
    if (!address || !utils.isValidAddress(address)) {
      throw new BuildTransactionError('Invalid or missing address, got: ' + address);
    }
    if (pubKey) {
      if (!utils.isValidPublicKey(pubKey)) {
        throw new BuildTransactionError('Invalid pubKey, got: ' + pubKey);
      }
      const derivedAddress = utils.getAddressFromPublicKey(pubKey);
      if (utils.normalizeAddress(derivedAddress) !== utils.normalizeAddress(address)) {
        throw new BuildTransactionError(
          `Address does not match public key. Expected ${derivedAddress}, got ${address}`
        );
      }
      this._publicKey = pubKey;
    }
    this._sender = address;
    return this;
  }

  public nonce(nonce: string): this {
    this._nonce = nonce;
    return this;
  }

  public chainId(chainId: string): this {
    this._chainId = chainId;
    return this;
  }

  /** @inheritdoc */
  get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    const data = tx.starknetTransactionData;
    this._sender = data.senderAddress;
    this._calls = data.calls || [];
    this._nonce = data.nonce;
    this._chainId = data.chainId;
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!key || !key.key) {
      throw new SigningError('Key is required');
    }
    if (!utils.isValidPrivateKey(key.key)) {
      throw new SigningError('Invalid private key');
    }
  }

  /** @inheritdoc */
  validateTransaction(_transaction: Transaction): void {
    if (!this._sender || !utils.isValidAddress(this._sender)) {
      throw new BuildTransactionError('Invalid or missing sender address');
    }
    if (!this._chainId) {
      throw new BuildTransactionError('Chain ID is required');
    }
    if (this._nonce === undefined || this._nonce === null) {
      throw new BuildTransactionError('Nonce is required');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isNaN() || value.isNegative()) {
      throw new BuildTransactionError(`Invalid value: ${value.toString()}`);
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new BuildTransactionError('Raw transaction is empty');
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    this._transaction.fromRawTransaction(rawTransaction);
    return this._transaction;
  }

  protected abstract get transactionType(): StarknetTransactionType;

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const data: StarknetTransactionData = {
      senderAddress: this._sender!,
      calls: this._calls,
      nonce: this._nonce!,
      chainId: this._chainId!,
      transactionType: this.transactionType,
    };

    this._transaction.starknetTransactionData = data;
    return this._transaction;
  }

  // Starknet is TSS-only; signing happens via threshold ECDSA in wallet-platform/OVC, not here.
  protected signImplementation(_key: BaseKey): Transaction {
    throw new MethodNotImplementedError('signImplementation');
  }
}
