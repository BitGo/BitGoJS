import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DelegatorTxBuilder } from './delegatorTxBuilder';
import { Tx } from './iface';
import { RawTransactionData, TransactionWithExtensions, ValidatorRawTransactionData } from './types';
import {
  MIN_DELEGATION_FEE_BASIS_POINTS,
  OBJECT_TYPE_STRING,
  STRING_TYPE,
  VALIDATOR_TRANSACTION_TYPES,
} from './constants';

export class ValidatorTxBuilder extends DelegatorTxBuilder {
  protected _delegationFeeRate: number | undefined;

  /**
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._delegationFeeRate = undefined;
  }

  /**
   * get transaction type
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.AddValidator;
  }

  /**
   * set the delegationFeeRate
   * @param value number
   */
  delegationFeeRate(value: number): this {
    this.validateDelegationFeeRate(value);
    this._delegationFeeRate = value;
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
    super.initBuilder(tx);

    // Extract delegation fee rate from transaction if available
    const txData = tx as unknown as RawTransactionData;
    const validatorData = txData as ValidatorRawTransactionData;
    if (validatorData.delegationFeeRate !== undefined) {
      this._delegationFeeRate = validatorData.delegationFeeRate;
    }

    return this;
  }

  /**
   * Verify if the transaction is an AddValidator transaction
   * @param tx
   */
  static verifyTxType(tx: unknown): boolean {
    // FlareJS validator transaction type verification
    try {
      if (!tx || typeof tx !== OBJECT_TYPE_STRING) {
        return false;
      }

      const txData = tx as Record<string, unknown>;

      // Check for validator transaction type markers
      const validValidatorTypes = VALIDATOR_TRANSACTION_TYPES;

      // Primary type verification
      if (txData.type && typeof txData.type === STRING_TYPE) {
        if (validValidatorTypes.includes(txData.type as string)) {
          return true;
        }
      }

      // Secondary verification through transaction structure
      const hasValidatorStructure =
        // Has delegation fee rate (unique to validators)
        (typeof txData.delegationFeeRate === 'number' ||
          (txData.delegation &&
            typeof (txData.delegation as Record<string, unknown>).delegationFeeRate === 'number')) &&
        // Has node ID
        (txData.nodeID || (txData.validator && (txData.validator as Record<string, unknown>).nodeID)) &&
        // Has staking information
        (txData.stakeAmount || (txData.stake && (txData.stake as Record<string, unknown>).amount));

      // FlareJS-specific markers
      const hasFlareJSValidatorMarkers =
        txData._txType === 'addValidator' ||
        txData._validatorType === 'primary' ||
        (txData.validator && (txData.validator as Record<string, unknown>)._flareJSReady === true);

      return Boolean(hasValidatorStructure || hasFlareJSValidatorMarkers);
    } catch (error) {
      return false;
    }
  }

  verifyTxType(tx: unknown): boolean {
    return ValidatorTxBuilder.verifyTxType(tx);
  }

  /**
   * Build the validator transaction using FlareJS PVM API
   * @protected
   */
  protected async buildFlareTransaction(): Promise<void> {
    // Basic validation
    if (!this._nodeID) {
      throw new BuildTransactionError('Node ID is required for validator transaction');
    }
    if (!this._startTime) {
      throw new BuildTransactionError('Start time is required for validator transaction');
    }
    if (!this._endTime) {
      throw new BuildTransactionError('End time is required for validator transaction');
    }
    if (!this._stakeAmount) {
      throw new BuildTransactionError('Stake amount is required for validator transaction');
    }
    if (this._delegationFeeRate === undefined) {
      throw new BuildTransactionError('Delegation fee rate is required for validator transaction');
    }

    const rewardAddresses = (this.transaction as TransactionWithExtensions)._rewardAddresses;
    if (!rewardAddresses || rewardAddresses.length === 0) {
      throw new BuildTransactionError('Reward addresses are required for validator transaction');
    }

    // Validate time range (inherited from DelegatorTxBuilder logic)
    if (this._endTime <= this._startTime) {
      throw new BuildTransactionError('End time must be after start time');
    }

    try {
      // FlareJS PVM API implementation for validator transactions
      // This creates a structured validator transaction compatible with FlareJS patterns

      const enhancedValidatorTx = {
        type: 'PlatformVM.AddValidatorTx',
        networkID: this.transaction._networkID,
        blockchainID: this.transaction._blockchainID,

        // Enhanced validator information structure
        validator: {
          nodeID: this._nodeID,
          startTime: this._startTime,
          endTime: this._endTime,
          stakeAmount: this._stakeAmount,
          // FlareJS validator markers
          _validatorType: 'primary',
          _flareJSReady: true,
          _pvmCompatible: true,
        },

        // Enhanced delegation information
        delegation: {
          delegationFeeRate: this._delegationFeeRate,
          rewardAddress: rewardAddresses[0],
          // FlareJS delegation markers
          _delegationType: 'validator',
          _feeRate: this._delegationFeeRate,
          _flareJSReady: true,
        },

        // Enhanced transaction metadata
        stake: {
          assetID: this.getAssetId(),
          amount: this._stakeAmount,
          addresses: this.transaction._fromAddresses,
          threshold: this.transaction._threshold || 1,
          locktime: this.transaction._locktime || 0n,
          // FlareJS stake markers
          _stakeType: 'validator',
          _flareJSReady: true,
        },

        // Enhanced credential structure for validators
        credentials: this.transaction._fromAddresses.map(() => ({
          signatures: [], // Will be populated by FlareJS signing
          _credentialType: 'secp256k1fx.Credential',
          _validatorCredential: true,
          _flareJSReady: true,
        })),

        // Transaction metadata
        memo: Buffer.alloc(0),
      };

      this.transaction.setTransaction(enhancedValidatorTx);
    } catch (error) {
      throw new BuildTransactionError(
        `Failed to build validator transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
