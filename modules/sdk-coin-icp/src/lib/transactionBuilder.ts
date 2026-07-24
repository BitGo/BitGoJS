import { BaseAddress, BaseKey, BaseTransactionBuilder, BuildTransactionError, SigningError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { DEFAULT_MEMO, IcpTransaction, IcpTransactionData, PayloadsData, Signatures } from './iface';
import { SignedTransactionBuilder } from './signedTransactionBuilder';
import { Transaction } from './transaction';
import utils from './utils';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _sender: string;
  protected _publicKey: string;
  protected _memo: number | BigInt;
  protected _ingressEnd: number | BigInt;
  protected _receiverId: string;
  protected _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  public signaturePayload(): Signatures[] {
    return this._transaction.signaturePayload;
  }

  public payloadData(): PayloadsData {
    return this._transaction.payloadsData;
  }

  public icpTransaction(): IcpTransaction {
    return this._transaction.icpTransaction;
  }

  /**
   * Sets the public key and the address of the sender of this transaction.
   *
   * @param {string} address the account that is sending this transaction
   * @param {string} pubKey the public key that is sending this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public sender(address: string, pubKey: string): this {
    if (!address || !utils.isValidAddress(address.toString())) {
      throw new BuildTransactionError('Invalid or missing address, got: ' + address);
    }
    if (!pubKey || !utils.isValidPublicKey(pubKey)) {
      throw new BuildTransactionError('Invalid or missing pubKey, got: ' + pubKey);
    }
    this._sender = address;
    this._publicKey = pubKey;
    return this;
  }

  /**
   * Set the memo
   *
   * @param {number} memo - number that to be used as memo
   * @returns {TransactionBuilder} This transaction builder
   */
  public memo(memo: number): this {
    if (typeof memo !== 'number' || Number.isNaN(memo) || memo < 0) {
      throw new BuildTransactionError(`Invalid memo: ${memo}`);
    }
    this._memo = memo;
    return this;
  }

  /**
   * Set the ingressEnd timestamp
   * @param {number} ingressEnd - timestamp in nanoseconds
   * @returns {TransactionBuilder} This transaction builder
   */
  public ingressEnd(ingressEnd: number | BigInt): this {
    if (BigInt(ingressEnd.toString()) < 0n) {
      throw new BuildTransactionError(`Invalid timestamp: ${ingressEnd}`);
    }
    this._ingressEnd = ingressEnd;
    return this;
  }

  /**
   * Sets the account Id of the receiver of this transaction.
   *
   * @param {string} accountId the account id of the account that is receiving this transaction
   * @returns {TransactionBuilder} This transaction builder
   */
  public receiverId(accountId: string): this {
    if (!accountId || !utils.isValidAddress(accountId)) {
      throw new BuildTransactionError('Invalid or missing accountId for receiver, got: ' + accountId);
    }
    this._receiverId = accountId;
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

  get transactionType(): string {
    return this._transaction.icpTransactionData.transactionType;
  }

  /** @inheritdoc */
  fromImplementation(rawTransaction: string): Transaction {
    this.transaction.fromRawTransaction(rawTransaction);
    const icpTransactionData = this.transaction.icpTransactionData;
    this.validateRawTransaction(icpTransactionData);
    this.buildImplementation();
    return this.transaction;
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    if (!transaction || !transaction.icpTransactionData) {
      return;
    }
    utils.validateRawTransaction(transaction.icpTransactionData);
  }

  /**
   * Sets the amount of this transaction.
   *
   * @param {string} value the amount to be sent in e8s (1 ICP = 1e8 e8s)
   * @returns {TransactionBuilder} This transaction builder
   */
  public amount(value: string): this {
    utils.validateValue(new BigNumber(value));
    this._amount = value;
    return this;
  }

  validateValue(value: BigNumber): void {
    utils.validateValue(new BigNumber(value));
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    const icpTransactionData = tx.icpTransactionData;
    this._sender = icpTransactionData.senderAddress;
    this._receiverId = icpTransactionData.receiverAddress;
    this._publicKey = icpTransactionData.senderPublicKeyHex;
    this._amount = icpTransactionData.amount;
    this._memo = icpTransactionData.memo ?? DEFAULT_MEMO;
    this._ingressEnd = Number(icpTransactionData.expiryTime);
  }

  validateAddress(address: BaseAddress): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  validateRawTransaction(rawTransaction: IcpTransactionData): void {
    utils.validateRawTransaction(rawTransaction);
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

  /**
   * Combines the unsigned transaction and the signature payload to create a signed transaction.
   */
  public combine(): void {
    const signedTransactionBuilder = new SignedTransactionBuilder(
      this._transaction.unsignedTransaction,
      this._transaction.signaturePayload
    );
    this._transaction.signedTransaction = signedTransactionBuilder.getSignTransaction();
  }
}
