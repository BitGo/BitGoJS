import BigNumber from 'bignumber.js';
import { AccountId } from '@hashgraph/sdk';
import { BaseTransactionBuilder } from '../baseCoin';
import {
  BuildTransactionError,
  InvalidParameterValueError,
  NotImplementedError,
  ParseTransactionError,
} from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { Transaction } from './transaction';
import { getCurrentTime, isValidAddress, isValidTimeString, toUint8Array } from './utils';
import { KeyPair } from './keyPair';
import { HederaNode } from './ifaces';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _fee: BaseFee;
  protected _transaction: Transaction;
  protected _source: BaseAddress;
  protected _startTime: proto.ITimestamp;
  protected _memo: string;
  protected _txBody: proto.TransactionBody;
  protected _node: HederaNode = { nodeId: '0.0.4' };
  protected _duration: proto.Duration = new proto.Duration({ seconds: 120 });

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBody.transactionFee = new BigNumber(this._fee.fee).toNumber();
    this._txBody.transactionID = this.buildTxId();
    this._txBody.memo = this._memo;
    this._txBody.nodeAccountID = new proto.AccountID({ accountNum: new AccountId(this._node.nodeId).account });
    const hTransaction = new proto.Transaction();
    hTransaction.bodyBytes = proto.TransactionBody.encode(this._txBody).finish();
    const transaction = new Transaction(this._coinConfig);
    transaction.body(hTransaction);
    return transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    const tx = new Transaction(this._coinConfig);
    let buffer;
    if (typeof rawTransaction === 'string') {
      buffer = toUint8Array(rawTransaction);
    } else {
      buffer = rawTransaction;
    }
    tx.bodyBytes(buffer);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('Method not implemented');
  }

  protected initBuilder(tx: Transaction) {
    const txData = tx.toJson();
    this.fee({ fee: txData.fee.toString() });
    this.source({ address: txData.from });
    this.startTime(txData.startTime);
  }

  /**
   * Creates an Hedera TransactionID
   *
   * @returns {proto.TransactionID} - created TransactionID
   */
  protected buildTxId(): proto.TransactionID {
    const accString = this._source.address.split('.').pop();
    const acc = new BigNumber(accString!).toNumber();
    return new proto.TransactionID({
      transactionValidStart: this.validStart,
      accountID: { accountNum: acc },
    });
  }
  // endregion

  // region Common builder methods
  /**
   *  Set the memo
   *
   * @param {string} memo A hedera memo
   * @returns {TransactionBuilder} This transaction builder
   */
  memo(memo: string): this {
    this._memo = memo;
    return this;
  }

  /**
   *  Set the node, it may take the format `'<shard>.<realm>.<account>'` or `'<account>'`
   *
   * @param {HederaNode} node A hedera node address
   * @returns {TransactionBuilder} This transaction builder
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
   * @param {number} validDuration the transaction valid duration in seconds
   * @returns {TransactionBuilder} This transaction builder
   */
  validDuration(validDuration: number): this {
    this.validateValue(new BigNumber(validDuration));
    this._duration = new proto.Duration({ seconds: validDuration });
    return this;
  }

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
   * Set the start time
   *
   * @param {string} time string value of the time to set with format <seconds>.<nanos>
   * @returns {TransactionBuilder} this
   */
  startTime(time: string): this {
    if (!isValidTimeString(time)) {
      throw new InvalidParameterValueError('invalid value for time parameter');
    }
    const timeParts = time.split('.').map(v => new BigNumber(v).toNumber());
    this._startTime = { seconds: timeParts[0], nanos: timeParts[1] };
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
    if (
      !(
        (typeof rawTransaction === 'string' && /^[0-9a-fA-F]+$/.test(rawTransaction)) ||
        (Buffer.isBuffer(rawTransaction) && Uint8Array.from(rawTransaction))
      )
    ) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
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
  // endregion
}
