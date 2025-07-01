import { BaseAddress, BaseKey, BaseTransactionBuilder, BuildTransactionError, SigningError } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { Principal } from '@dfinity/principal';
import {
  DEFAULT_MEMO,
  IcpTransaction,
  IcpTransactionData,
  PayloadsData,
  Signatures,
  OperationType,
  MAX_INGRESS_TTL,
} from './iface';
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
  protected static readonly GOVERNANCE_CANISTER_ID = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
  protected static readonly DEFAULT_FEE_E8S = '10000'; // 0.0001 ICP
  protected _neuronId: bigint;
  protected _additionalDelaySeconds: number;
  protected _feeE8s: string;

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

  /**
   * Handle dissolve delay increase for a neuron
   *
   * @param {bigint} neuronId - The ID of the neuron
   * @param {number} additionalDelaySeconds - Additional seconds to add to dissolve delay
   * @param {string} senderPublicKey - The sender's public key
   * @returns {Promise<Transaction>} The built transaction
   */
  protected async handleDissolveDelay(
    neuronId: bigint,
    additionalDelaySeconds: number,
    senderPublicKey: string
  ): Promise<Transaction> {
    if (!neuronId) {
      throw new BuildTransactionError('Neuron ID is required');
    }
    if (!additionalDelaySeconds || additionalDelaySeconds <= 0) {
      throw new BuildTransactionError('Additional delay seconds must be greater than 0');
    }

    const controllerPrincipal = utils.derivePrincipalFromPublicKey(senderPublicKey);
    const defaultSubaccount = new Uint8Array(32);
    const senderAddress = utils.fromPrincipal(controllerPrincipal, defaultSubaccount);

    const currentTime = Date.now() * 1000_000;
    const ingressStartTime = currentTime;
    const ingressEndTime = ingressStartTime + MAX_INGRESS_TTL;

    const transactionData: IcpTransactionData = {
      senderAddress,
      receiverAddress: utils.fromPrincipal(TransactionBuilder.GOVERNANCE_CANISTER_ID, defaultSubaccount),
      amount: '0', // No amount transfer needed for dissolve delay increase
      fee: this._feeE8s || TransactionBuilder.DEFAULT_FEE_E8S,
      senderPublicKeyHex: senderPublicKey,
      memo: BigInt(neuronId.toString()),
      transactionType: OperationType.INCREASE_DISSOLVE_DELAY,
      expiryTime: ingressEndTime,
      additionalData: {
        neuronId: neuronId,
        additionalDelaySeconds: additionalDelaySeconds,
      },
    };

    this._transaction.icpTransactionData = transactionData;
    return this._transaction;
  }

  /**
   * Set the neuron ID for dissolve delay operation
   *
   * @param {bigint} id - The neuron ID
   * @returns {this} The transaction builder instance
   */
  public neuron(id: bigint): this {
    this._neuronId = id;
    return this;
  }

  /**
   * Set the additional delay seconds for dissolve delay operation
   *
   * @param {number} seconds - The additional seconds to add
   * @returns {this} The transaction builder instance
   */
  public additionalDelay(seconds: number): this {
    this._additionalDelaySeconds = seconds;
    return this;
  }

  /**
   * Set the fee for the transaction
   *
   * @param {string} value - The fee amount in e8s
   * @returns {this} The transaction builder instance
   */
  public fee(value: string): this {
    this._feeE8s = value;
    return this;
  }
}
