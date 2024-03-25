import {
  BaseAddress,
  BaseKey,
  BaseTransaction,
  BaseTransactionBuilder,
  BuildTransactionError,
  TransactionType,
} from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { BinTools, BN } from 'avalanche';
import { AddPermissionlessValidatorTx } from 'bitgo-aaron-avalanchejs/dist/serializable/pvm';
import { Tx } from './iface';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import utils from './utils';
import BigNumber from 'bignumber.js';

export class PermissionlessValidatorTxBuilder extends BaseTransactionBuilder {
  private _transaction: BaseTransaction;
  protected _nodeID: string;
  protected _blsPublicKey: string;
  protected _blsSignature: string;
  protected _startTime: BN;
  protected _endTime: BN;
  protected _stakeAmount: BN;

  /**
   *
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    const network = coinConfig.network as AvalancheNetwork;
    this._stakeAmount = new BN(network.minStake);
  }

  /**
   * get transaction type
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.AddPermissionlessValidator;
  }

  /**
   * Addresses where reward should be deposit
   * @param {string | string[]} address - single address or array of addresses to receive rewards
   */
  rewardAddresses(address: string | string[]): this {
    // TODO Implement
    return this;
  }

  /**
   *
   * @param nodeID
   */
  nodeID(nodeID: string): this {
    this.validateNodeID(nodeID);
    this._nodeID = nodeID;
    return this;
  }

  /**
   *
   * @param blsPublicKey
   */
  blsPublicKey(blsPublicKey: string): this {
    // TODO add
    // this.validateBlsKey(blsPublicKey);
    this._blsPublicKey = blsPublicKey;
    return this;
  }

  /**
   *
   * @param blsSignature
   */
  blsSignature(blsSignature: string): this {
    // TODO add
    // this.validateBlsSignature(blsSignature);
    this._blsSignature = blsSignature;
    return this;
  }

  /**
   * start time of staking period
   * @param value
   */
  startTime(value: string | number): this {
    this._startTime = new BN(value);
    return this;
  }

  /**
   * end time of staking period
   * @param value
   */
  endTime(value: string | number): this {
    this._endTime = new BN(value);
    return this;
  }

  /**
   *
   * @param value
   */
  stakeAmount(value: BN | string): this {
    const valueBN = BN.isBN(value) ? value : new BN(value);
    this.validateStakeAmount(valueBN);
    this._stakeAmount = valueBN;
    return this;
  }

  // region Validators
  /**
   * validates a correct NodeID is used
   * @param nodeID
   */
  validateNodeID(nodeID: string): void {
    if (!nodeID) {
      throw new BuildTransactionError('Invalid transaction: missing nodeID');
    }
    if (nodeID.slice(0, 6) !== 'NodeID') {
      throw new BuildTransactionError('Invalid transaction: invalid NodeID tag');
    }
    const bintools = BinTools.getInstance();
    if (!(bintools.b58ToBuffer(nodeID.slice(7)).length === 24)) {
      throw new BuildTransactionError('Invalid transaction: NodeID is not in cb58 format');
    }
  }

  /**
   *
   *   protected _startTime: Date;
   *   protected _endTime: Date;
   *   2 weeks = 1209600
   *   1 year = 31556926
   *   unix time stamp based off seconds
   */
  validateStakeDuration(startTime: BN, endTime: BN): void {
    const oneDayLater = new BN(Date.now()).add(new BN(86400));
    if (!startTime.gt(oneDayLater)) {
      throw new BuildTransactionError('Start time needs to be one day greater than current time');
    }
    if (endTime < startTime) {
      throw new BuildTransactionError('End date cannot be less than start date');
    }
    // TODO implement checks for start/end time
  }

  /**
   *
   * @param amount
   */
  validateStakeAmount(amount: BN): void {
    // TODO implement
    return;
  }

  // endregion

  /** @inheritdoc */
  initBuilder(tx: Tx): this {
    // super.initBuilder(tx);
    return this;
  }

  // TODO Implement
  static verifyTxType(tx: Tx): tx is AddPermissionlessValidatorTx {
    return true;
  }

  verifyTxType(tx: Tx): tx is AddPermissionlessValidatorTx {
    return PermissionlessValidatorTxBuilder.verifyTxType(tx);
  }

  /**
   *
   * @protected
   */
  protected buildAvaxTransaction(): void {
    // TODO Implement
  }

  /** @inheritdoc */
  // protected async buildImplementation(): Promise<Transaction> {
  protected async buildImplementation(): Promise<BaseTransaction> {
    // TODO Implement
    return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): BaseTransaction {
    // TODO Implement
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): BaseTransaction {
    // TODO Implement
    return this.transaction;
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /** @inheritdoc */
  protected get transaction(): BaseTransaction {
    return this._transaction;
  }

  protected set transaction(transaction: BaseTransaction) {
    this._transaction = transaction;
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!new KeyPair({ prv: key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
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
}
