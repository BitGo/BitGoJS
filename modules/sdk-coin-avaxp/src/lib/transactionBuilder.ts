import { BaseCoin as CoinConfig, AVAXPCoin } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { BaseAddress, BaseKey, BaseTransactionBuilder, BuildTransactionError, BaseTransaction } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { Tx } from './iface';
import { Tx as PvmTx } from 'avalanche/dist/apis/platformvm';
import { Tx as EvmTx } from 'avalanche/dist/apis/evm';

/**
 * TransactionBuilder works form a raw transaction or by inheritance.
 * This scope only sign builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  protected _coinConfig: Readonly<AVAXPCoin>;
  protected _transaction: Transaction;
  protected _signer: KeyPair[] = [];
  protected _recoverSigner = false;
  protected _fromAddresses: BufferAvax[] = [];

  /**
   * fromPubKey is a list of unique addresses that correspond to the private keys that can be used to spend this output.
   * @param {string | string[]} senderPubKey
   */
  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = senderPubKey instanceof Array ? senderPubKey : [senderPubKey];
    this._transaction.fromAddresses = pubKeys;
    this._fromAddresses = pubKeys.map(utils.parseAddress);
    return this;
  }

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig as Readonly<AVAXPCoin>);
    this._transaction = new Transaction(coinConfig);
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    rawTransaction = utils.removeHexPrefix(rawTransaction);
    let tx: Tx = new PvmTx();
    try {
      tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
      if (!utils.isTransactionOf(tx, this._coinConfig.network.blockchainID)) {
        throw new Error('It is not a transaction of this network');
      }
    } catch {
      tx = new EvmTx();
      tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
    }
    this._transaction.tx = tx;
    return this._transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildAvaxTransaction();
    if (this.hasSigner) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
  }

  /**
   * Builds the avax transaction. transaction field is changed.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected buildAvaxTransaction(): void {}

  // region Getters and Setters
  /**
   * When using recovery key must be set here
   * TODO: STLX-17317 recovery key signing
   * @param {boolean} true if it's recovery signer, default true.
   */
  public recoverMode(recoverSigner = true): this {
    this._recoverSigner = recoverSigner;
    return this;
  }

  /**
   * Getter for know if build should sign
   */
  get hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }

  get assetID(): BufferAvax {
    return utils.binTools.cb58Decode(this._coinConfig.network.avaxAssetID);
  }

  get blockchainID(): BufferAvax {
    return utils.binTools.cb58Decode(this._coinConfig.network.blockchainID);
  }

  protected get sender(): BufferAvax[] {
    const sender = this._fromAddresses.slice();
    if (this._recoverSigner) {
      // switch first and last signer.
      const tmp = sender.pop();
      sender.push(sender[0]);
      if (tmp) {
        sender[0] = tmp;
      }
    }
    return sender;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): BaseTransaction {
    this._signer.push(new KeyPair({ prv: key }));
    return this.transaction;
  }

  // endregion
  // region Validators

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!new KeyPair({ prv: key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   * It overrides abstract method from BaseTransactionBuilder
   *
   * @param rawTransaction Transaction in any format
   */
  validateRawTransaction(rawTransaction: string): void {
    utils.validateRawTransaction(rawTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    // throw new NotImplementedError('validateTransaction not implemented');
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  // endregion
}
