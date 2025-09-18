import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { Tx } from './iface';
import { TransactionWithExtensions } from './types';
import {
  BLS_PUBLIC_KEY_COMPRESSED_LENGTH,
  BLS_PUBLIC_KEY_UNCOMPRESSED_LENGTH,
  BLS_SIGNATURE_LENGTH,
  MIN_DELEGATION_FEE_BASIS_POINTS,
  createHexRegex,
} from './constants';

export class PermissionlessValidatorTxBuilder extends AtomicTransactionBuilder {
  protected _nodeID: string | undefined;
  protected _blsPublicKey: string | undefined;
  protected _blsSignature: string | undefined;
  protected _startTime: bigint | undefined;
  protected _endTime: bigint | undefined;
  protected _stakeAmount: bigint | undefined;
  protected _delegationFeeRate: number | undefined;

  /**
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._nodeID = undefined;
    this._blsPublicKey = undefined;
    this._blsSignature = undefined;
    this._startTime = undefined;
    this._endTime = undefined;
    this._stakeAmount = undefined;
    this._delegationFeeRate = undefined;
  }

  /**
   * get transaction type
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.AddPermissionlessValidator;
  }

  /**
   * Set the node ID for permissionless validation
   * @param nodeID - The node ID
   */
  nodeID(nodeID: string): this {
    if (!nodeID || nodeID.length === 0) {
      throw new BuildTransactionError('Node ID cannot be empty');
    }
    this._nodeID = nodeID;
    return this;
  }

  /**
   * Set the BLS public key for permissionless validation
   * @param blsPublicKey - The BLS public key
   */
  blsPublicKey(blsPublicKey: string): this {
    if (!blsPublicKey || blsPublicKey.length === 0) {
      throw new BuildTransactionError('BLS public key cannot be empty');
    }

    // BLS public key should be 48 bytes (96 hex characters) with 0x prefix or 192 hex characters with 0x prefix for uncompressed
    if (
      !createHexRegex(BLS_PUBLIC_KEY_COMPRESSED_LENGTH, true).test(blsPublicKey) &&
      !createHexRegex(BLS_PUBLIC_KEY_UNCOMPRESSED_LENGTH, true).test(blsPublicKey)
    ) {
      throw new BuildTransactionError('Invalid BLS public key format');
    }

    this._blsPublicKey = blsPublicKey;
    return this;
  }

  /**
   * Set the BLS signature for permissionless validation
   * @param blsSignature - The BLS signature
   */
  blsSignature(blsSignature: string): this {
    if (!blsSignature || blsSignature.length === 0) {
      throw new BuildTransactionError('BLS signature cannot be empty');
    }

    // BLS signature should be 96 bytes (192 hex characters) with 0x prefix
    if (!createHexRegex(BLS_SIGNATURE_LENGTH, true).test(blsSignature)) {
      throw new BuildTransactionError('Invalid BLS signature format');
    }

    this._blsSignature = blsSignature;
    return this;
  }

  /**
   * Set the start time for validation
   * @param startTime - Unix timestamp for when validation starts
   */
  startTime(startTime: string | number | bigint): this {
    const time = BigInt(startTime);
    if (time < 0) {
      throw new BuildTransactionError('Start time must be non-negative');
    }
    this._startTime = time;
    return this;
  }

  /**
   * Set the end time for validation
   * @param endTime - Unix timestamp for when validation ends
   */
  endTime(endTime: string | number | bigint): this {
    const time = BigInt(endTime);
    if (time <= 0) {
      throw new BuildTransactionError('End time must be positive');
    }
    this._endTime = time;
    return this;
  }

  /**
   * Set the stake amount for validation
   * @param amount - Amount to stake (in nFLR)
   */
  stakeAmount(amount: string | number | bigint): this {
    const stake = BigInt(amount);
    if (stake <= 0) {
      throw new BuildTransactionError('Stake amount must be positive');
    }
    this._stakeAmount = stake;
    return this;
  }

  /**
   * Set the delegation fee rate
   * @param value - Delegation fee rate in basis points
   */
  delegationFeeRate(value: number): this {
    this.validateDelegationFeeRate(value);
    this._delegationFeeRate = value;
    return this;
  }

  /**
   * Set reward addresses where validation rewards should be sent
   * @param addresses - Array of reward addresses
   */
  rewardAddresses(addresses: string[]): this {
    if (!addresses || addresses.length === 0) {
      throw new BuildTransactionError('At least one reward address is required');
    }
    // Store reward addresses in the transaction (we'll need to extend the type)
    (this.transaction as TransactionWithExtensions)._rewardAddresses = addresses;
    return this;
  }

  /**
   * Validate that the delegation fee is at least the minDelegationFee
   * @param delegationFeeRate number
   */
  validateDelegationFeeRate(delegationFeeRate: number): void {
    // For Flare, use a minimum delegation fee of 2% (20000 basis points)
    const minDelegationFee = MIN_DELEGATION_FEE_BASIS_POINTS; // 2%
    if (delegationFeeRate < minDelegationFee) {
      throw new BuildTransactionError(`Delegation fee cannot be less than ${minDelegationFee} basis points (2%)`);
    }
  }

  /** @inheritdoc */
  initBuilder(tx: Tx): this {
    // Extract permissionless validator-specific fields from transaction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txData = tx as any;

    if (txData.nodeID) {
      this._nodeID = txData.nodeID;
    }
    if (txData.blsPublicKey) {
      this._blsPublicKey = txData.blsPublicKey;
    }
    if (txData.blsSignature) {
      this._blsSignature = txData.blsSignature;
    }
    if (txData.startTime) {
      this._startTime = BigInt(txData.startTime);
    }
    if (txData.endTime) {
      this._endTime = BigInt(txData.endTime);
    }
    if (txData.stakeAmount) {
      this._stakeAmount = BigInt(txData.stakeAmount);
    }
    if (txData.delegationFeeRate !== undefined) {
      this._delegationFeeRate = txData.delegationFeeRate;
    }
    if (txData.rewardAddresses) {
      (this.transaction as TransactionWithExtensions)._rewardAddresses = txData.rewardAddresses;
    }

    return this;
  }

  /**
   * Verify if the transaction is a permissionless validator transaction
   * @param tx
   */
  static verifyTxType(tx: unknown): boolean {
    // Check if transaction has permissionless validator-specific properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txData = tx as any;
    return txData && txData.blsPublicKey && txData.blsSignature;
  }

  verifyTxType(tx: unknown): boolean {
    return PermissionlessValidatorTxBuilder.verifyTxType(tx);
  }

  /**
   * Build the permissionless validator transaction
   * @protected
   */
  protected async buildFlareTransaction(): Promise<void> {
    // Basic validation
    if (!this._nodeID) {
      throw new BuildTransactionError('Node ID is required for permissionless validator transaction');
    }
    if (!this._blsPublicKey) {
      throw new BuildTransactionError('BLS public key is required for permissionless validator transaction');
    }
    if (!this._blsSignature) {
      throw new BuildTransactionError('BLS signature is required for permissionless validator transaction');
    }
    if (!this._startTime) {
      throw new BuildTransactionError('Start time is required for permissionless validator transaction');
    }
    if (!this._endTime) {
      throw new BuildTransactionError('End time is required for permissionless validator transaction');
    }
    if (!this._stakeAmount) {
      throw new BuildTransactionError('Stake amount is required for permissionless validator transaction');
    }
    if (this._delegationFeeRate === undefined) {
      throw new BuildTransactionError('Delegation fee rate is required for permissionless validator transaction');
    }

    const rewardAddresses = (this.transaction as TransactionWithExtensions)._rewardAddresses;
    if (!rewardAddresses || rewardAddresses.length === 0) {
      throw new BuildTransactionError('Reward addresses are required for permissionless validator transaction');
    }

    // Validate time range
    if (this._endTime <= this._startTime) {
      throw new BuildTransactionError('End time must be after start time');
    }

    try {
      // TODO: Implement actual FlareJS PVM API call when available
      // For now, create a placeholder transaction structure
      const validatorTx = {
        type: 'addPermissionlessValidator',
        nodeID: this._nodeID,
        blsPublicKey: this._blsPublicKey,
        blsSignature: this._blsSignature,
        startTime: this._startTime,
        endTime: this._endTime,
        stakeAmount: this._stakeAmount,
        delegationFeeRate: this._delegationFeeRate,
        rewardAddress: rewardAddresses[0],
        fromAddresses: this.transaction._fromAddresses,
        networkId: this.transaction._networkID,
        sourceBlockchainId: this.transaction._blockchainID,
        threshold: this.transaction._threshold || 1,
        locktime: this.transaction._locktime || 0n,
      };

      this.transaction.setTransaction(validatorTx);
    } catch (error) {
      throw new BuildTransactionError(
        `Failed to build permissionless validator transaction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
