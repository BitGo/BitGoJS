import { utils as FlareUtils, TypeSymbols } from '@flarenetwork/flarejs';
import { BuildTransactionError, isValidBLSPublicKey, isValidBLSSignature, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class PermissionlessValidatorTxBuilder extends TransactionBuilder {
  protected _nodeID: string;
  protected _blsPublicKey: string;
  protected _blsSignature: string;
  protected _startTime: bigint;
  protected _endTime: bigint;
  protected _stakeAmount: bigint;
  protected _delegationFeeRate: number;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this.transaction._fee.fee = this.transaction._network.txFee;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AddPermissionlessValidator;
  }

  // Validation methods
  validateLocktime(locktime: bigint): void {
    if (locktime < BigInt(0)) {
      throw new BuildTransactionError('Invalid transaction: locktime must be 0 or higher');
    }
  }

  validateDelegationFeeRate(delegationFeeRate: number): void {
    if (delegationFeeRate < Number(this.transaction._network.minDelegationFee)) {
      throw new BuildTransactionError(
        `Delegation fee cannot be less than ${this.transaction._network.minDelegationFee}`
      );
    }
  }

  validateNodeID(nodeID: string): void {
    if (!nodeID) {
      throw new BuildTransactionError('Invalid transaction: missing nodeID');
    }
    if (nodeID.slice(0, 6) !== 'NodeID') {
      throw new BuildTransactionError('Invalid transaction: invalid NodeID tag');
    }
    if (!(FlareUtils.base58.decode(nodeID.slice(7)).length === 24)) {
      throw new BuildTransactionError('Invalid transaction: NodeID is not in cb58 format');
    }
  }

  validateStakeDuration(startTime: bigint, endTime: bigint): void {
    if (endTime < startTime) {
      throw new BuildTransactionError('End date cannot be less than start date');
    }
  }

  validateStakeAmount(amount: bigint): void {
    const minStake = BigInt(this.transaction._network.minStake);
    if (amount < minStake) {
      throw new BuildTransactionError('Minimum staking amount is ' + Number(minStake) / 1000000000 + ' FLR.');
    }
  }

  // Builder methods
  rewardAddresses(address: string | string[]): this {
    const rewardAddresses = address instanceof Array ? address : [address];
    this.transaction._rewardAddresses = rewardAddresses.map(utils.parseAddress);
    return this;
  }

  nodeID(nodeID: string): this {
    this.validateNodeID(nodeID);
    this._nodeID = nodeID;
    return this;
  }

  blsPublicKey(blsPublicKey: string): this {
    isValidBLSPublicKey(blsPublicKey);
    this._blsPublicKey = blsPublicKey;
    return this;
  }

  blsSignature(blsSignature: string): this {
    isValidBLSSignature(blsSignature);
    this._blsSignature = blsSignature;
    return this;
  }

  locktime(value: string | number): this {
    this.validateLocktime(BigInt(value));
    this._transaction._locktime = BigInt(value);
    return this;
  }

  delegationFeeRate(value: number): this {
    this.validateDelegationFeeRate(value);
    this._delegationFeeRate = value;
    return this;
  }

  startTime(value: string | number): this {
    this._startTime = BigInt(value);
    return this;
  }

  endTime(value: string | number): this {
    this._endTime = BigInt(value);
    return this;
  }

  stakeAmount(value: bigint | string): this {
    const valueBigInt = typeof value === 'bigint' ? value : BigInt(value);
    this.validateStakeAmount(valueBigInt);
    this._stakeAmount = valueBigInt;
    return this;
  }

  protected async buildImplementation(): Promise<Transaction> {
    this.buildFlareTransaction();
    this.transaction.setTransactionType(this.transactionType);
    if (this.hasSigner()) {
      for (const keyPair of this._signer) {
        await this.transaction.sign(keyPair);
      }
    }
    return this.transaction;
  }

  /**
   * Build the permissionless validator transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    throw new Error('Method not implemented.');
  }

  static verifyTxType(type: TypeSymbols): boolean {
    return type === TypeSymbols.AddPermissionlessValidatorTx;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
