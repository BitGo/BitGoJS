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
import { StarknetTransactionData, StarknetTransactionType, StarknetCall, StarknetResourceBounds } from './iface';
import { Transaction } from './transaction';
import utils from './utils';

function defaultResourceBounds(): StarknetResourceBounds {
  return {
    l2_gas: { max_amount: '0x1c9c380', max_price_per_unit: '0x174876e800' },
    l1_gas: { max_amount: '0x0', max_price_per_unit: '0x5af3107a4000' },
    l1_data_gas: { max_amount: '0x3e8', max_price_per_unit: '0x2540be400' },
  };
}

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _sender?: string;
  protected _publicKey?: string;
  protected _calls: StarknetCall[] = [];
  protected _nonce?: string;
  protected _chainId?: string;
  protected _resourceBounds: StarknetResourceBounds = defaultResourceBounds();
  protected _tip = '0x0';

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

  public resourceBounds(rb: StarknetResourceBounds): this {
    this._resourceBounds = rb;
    return this;
  }

  public tip(tip: string): this {
    this._tip = tip;
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
    if (data.resourceBounds) {
      this._resourceBounds = data.resourceBounds;
    }
    if (data.tip) {
      this._tip = data.tip;
    }
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
    const sender = this._sender as string;
    const chainId = this._chainId as string;
    const nonce = this._nonce as string;
    const compiledCalldata = utils.compileExecuteCalldata(this._calls);

    const transactionHash = utils.calculateInvokeTransactionHash({
      senderAddress: sender,
      compiledCalldata,
      chainId,
      nonce,
      resourceBounds: this._resourceBounds,
      tip: this._tip,
    });

    const data: StarknetTransactionData = {
      senderAddress: sender,
      calls: this._calls,
      nonce,
      chainId,
      transactionType: this.transactionType,
      resourceBounds: this._resourceBounds,
      tip: this._tip,
      transactionHash,
      compiledCalldata,
    };

    this._transaction.starknetTransactionData = data;
    return this._transaction;
  }

  // Starknet is TSS-only; signing happens via threshold ECDSA in wallet-platform/OVC, not here.
  protected signImplementation(_key: BaseKey): Transaction {
    throw new MethodNotImplementedError('signImplementation');
  }
}
