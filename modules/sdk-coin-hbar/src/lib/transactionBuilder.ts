import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import * as Long from 'long';
import { proto } from '@hashgraph/proto';
import {
  BaseAddress,
  BaseFee,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  InvalidParameterValueError,
  ParseTransactionError,
  SigningError,
} from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import {
  buildHederaAccountID,
  getCurrentTime,
  isValidAddress,
  isValidRawTransactionFormat,
  isValidTimeString,
} from './utils';
import { KeyPair } from './keyPair';
import { HederaNode, SignatureData } from './iface';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _fee: BaseFee;
  private _transaction: Transaction;
  protected _source: BaseAddress;
  protected _startTime: proto.ITimestamp;
  protected _memo: string;
  protected _txBody: proto.TransactionBody;
  protected _node: HederaNode = { nodeId: '0.0.4' };
  protected _duration: proto.Duration = new proto.Duration({ seconds: Long.fromNumber(120) });
  protected _multiSignerKeyPairs: KeyPair[];
  protected _signatures: SignatureData[];

  protected constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBody = new proto.TransactionBody();
    this._txBody.transactionValidDuration = this._duration;
    this._multiSignerKeyPairs = [];
    this._signatures = [];
    this.transaction = new Transaction(_coinConfig);
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBody.nodeAccountID = buildHederaAccountID(this._node.nodeId);
    this._txBody.transactionFee = Long.fromString(this._fee.fee);
    this._txBody.transactionID = this.buildTxId();
    this._txBody.memo = this._memo;
    const hTransaction = this.transaction.hederaTx || new proto.Transaction();
    hTransaction.bodyBytes = proto.TransactionBody.encode(this._txBody).finish();
    this.transaction.body(hTransaction);
    for (const kp of this._multiSignerKeyPairs) {
      await this.transaction.sign(kp);
    }
    for (const { signature, keyPair } of this._signatures) {
      this.transaction.addSignature(signature, keyPair);
    }
    return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const tx = new Transaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.checkDuplicatedKeys(key);
    const signer = new KeyPair({ prv: key.key });

    // Signing the transaction is an operation that relies on all the data being set,
    // so we set the source here and leave the actual signing for the build step
    this._multiSignerKeyPairs.push(signer);
    return this.transaction;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx - the transaction data
   */
  initBuilder(tx: Transaction): void {
    this.transaction = tx;
    this.transaction.loadPreviousSignatures();
    const txData = tx.toJson();
    this.fee({ fee: txData.fee.toString() });
    this.source({ address: txData.from });
    this.startTime(txData.startTime);
    this.node({ nodeId: txData.node });
    this.validDuration(new BigNumber(txData.validDuration).toNumber());
    if (txData.memo) {
      this.memo(txData.memo);
    }
  }

  /**
   * Creates a Hedera TransactionID
   *
   * @returns {proto.TransactionID} - Created TransactionID
   */
  protected buildTxId(): proto.TransactionID {
    return new proto.TransactionID({
      transactionValidStart: this.validStart,
      accountID: buildHederaAccountID(this._source.address),
    });
  }
  // endregion

  // region Common builder methods
  /**
   *  Set the memo
   *
   * @param {string} memo - A hedera memo, can be a maximum of 100 bytes
   * @returns {TransactionBuilder} - This transaction builder
   */
  memo(memo: string): this {
    if (Buffer.from(memo).length > 100) {
      throw new InvalidParameterValueError('Memo must not be longer than 100 bytes');
    }
    this._memo = memo;
    return this;
  }

  /**
   *  Set the node, it may take the format `'<shard>.<realm>.<account>'` or `'<account>'`
   *
   * @param {HederaNode} node - A hedera node address
   * @returns {TransactionBuilder} - This transaction builder
   */
  node(node: HederaNode): this {
    if (!isValidAddress(node.nodeId)) {
      throw new InvalidParameterValueError('Invalid Hedera node address');
    }
    this._node = node;
    return this;
  }

  /**
   * Set the transaction valid duration
   *
   * @param {number} validDuration - The transaction valid duration in seconds
   * @returns {TransactionBuilder} - This transaction builder
   */
  validDuration(validDuration: number): this {
    this.validateValue(new BigNumber(validDuration));
    this._duration = new proto.Duration({ seconds: Long.fromNumber(validDuration) });
    return this;
  }

  /**
   * Set the transaction fees
   *
   * @param {BaseFee} fee - The maximum gas to pay
   * @returns {TransactionBuilder} - This transaction builder
   */
  fee(fee: BaseFee): this {
    this.validateValue(new BigNumber(fee.fee));
    this._fee = fee;
    return this;
  }

  /**
   * Set the transaction source
   *
   * @param {BaseAddress} address - The source account
   * @returns {TransactionBuilder} - This transaction builder
   */
  source(address: BaseAddress): this {
    this.validateAddress(address);
    this._source = address;
    return this;
  }

  /**
   * Set an external transaction signature
   *
   * @param {string} signature - Hex encoded signature string
   * @param {KeyPair} keyPair - The public key keypair that was used to create the signature
   * @returns {TransactionBuilder} - Transaction builder
   */
  signature(signature: string, keyPair: KeyPair): this {
    // if we already have a signature for this key pair, just update it
    for (const oldSignature of this._signatures) {
      if (oldSignature.keyPair.getKeys().pub === keyPair.getKeys().pub) {
        oldSignature.signature = signature;
        return this;
      }
    }

    // otherwise add the new signature
    this._signatures.push({ signature, keyPair });
    return this;
  }

  /**
   * Set the start time
   *
   * @param {string} time - String value of the time to set with format <seconds>.<nanos>
   * @returns {TransactionBuilder} - this
   */
  startTime(time: string): this {
    if (!isValidTimeString(time)) {
      throw new InvalidParameterValueError('Invalid value for time parameter');
    }
    const timeParts = time.split('.').map((v) => new BigNumber(v).toNumber());
    this._startTime = { seconds: Long.fromNumber(timeParts[0]), nanos: timeParts[1] };
    return this;
  }
  // endregion

  // region Getters and Setters
  private get validStart(): proto.ITimestamp {
    if (!this._startTime) {
      this.startTime(getCurrentTime());
    }
    return this._startTime;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!new KeyPair({ prv: key.key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    if (!isValidRawTransactionFormat(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
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
    if (this._fee === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing fee');
    }
    if (this._source === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing source');
    }
  }

  /**
   * Validates that the given key is not already in this._multiSignerKeyPairs
   *
   * @param {BaseKey} key - The key to check
   */
  private checkDuplicatedKeys(key: BaseKey): void {
    this._multiSignerKeyPairs.forEach((_sourceKeyPair) => {
      if (_sourceKeyPair.getKeys().prv === key.key) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
    });
  }
  // endregion
}
