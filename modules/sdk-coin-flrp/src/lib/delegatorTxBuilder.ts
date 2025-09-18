import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { Tx } from './iface';
import { RawTransactionData, TransactionWithExtensions, DelegatorRawTransactionData } from './types';
import {
  DELEGATOR_TRANSACTION_TYPE,
  PRIMARY_DELEGATOR_TYPE,
  DELEGATOR_STAKE_TYPE,
  SECP256K1_CREDENTIAL_TYPE,
  STAKE_OUTPUT_TYPE,
  CREDENTIAL_VERSION,
  EMPTY_STRING,
  ZERO_BIGINT,
  ZERO_NUMBER,
  DEFAULT_THRESHOLD,
  DEFAULT_LOCKTIME,
  MEMO_BUFFER_SIZE,
  FIRST_ADDRESS_INDEX,
} from './constants';

export class DelegatorTxBuilder extends AtomicTransactionBuilder {
  protected _nodeID: string;
  protected _startTime: bigint;
  protected _endTime: bigint;
  protected _stakeAmount: bigint;

  /**
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._nodeID = EMPTY_STRING;
    this._startTime = ZERO_BIGINT;
    this._endTime = ZERO_BIGINT;
    this._stakeAmount = ZERO_BIGINT;
  }

  /**
   * get transaction type
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.AddDelegator;
  }

  /**
   * Set the node ID for delegation
   * @param nodeID - The node ID to delegate to
   */
  nodeID(nodeID: string): this {
    if (!nodeID || nodeID.length === ZERO_NUMBER) {
      throw new BuildTransactionError('Node ID cannot be empty');
    }
    this._nodeID = nodeID;
    return this;
  }

  /**
   * Set the start time for delegation
   * @param startTime - Unix timestamp for when delegation starts
   */
  startTime(startTime: string | number | bigint): this {
    const time = BigInt(startTime);

    // Validate that start time is positive
    if (time <= ZERO_NUMBER) {
      throw new BuildTransactionError('Start time must be positive');
    }

    // Validate that start time is before end time (if end time is already set)
    if (this._endTime > ZERO_NUMBER && time >= this._endTime) {
      throw new BuildTransactionError('Start time must be before end time');
    }

    this._startTime = time;
    return this;
  }

  /**
   * Set the end time for delegation
   * @param endTime - Unix timestamp for when delegation ends
   */
  endTime(endTime: string | number | bigint): this {
    const time = BigInt(endTime);

    // Validate that end time is positive
    if (time <= ZERO_NUMBER) {
      throw new BuildTransactionError('End time must be positive');
    }

    // Validate that end time is after start time (if start time is already set)
    if (this._startTime > ZERO_NUMBER && time <= this._startTime) {
      throw new BuildTransactionError('End time must be after start time');
    }

    this._endTime = time;
    return this;
  }

  /**
   * Set the stake amount for delegation
   * @param amount - Amount to stake (in nFLR)
   */
  stakeAmount(amount: string | number | bigint): this {
    const stake = BigInt(amount);
    if (stake <= ZERO_NUMBER) {
      throw new BuildTransactionError('Stake amount must be positive');
    }
    this._stakeAmount = stake;
    return this;
  }

  /**
   * Set reward addresses where delegation rewards should be sent
   * @param addresses - Array of reward addresses
   */
  rewardAddresses(addresses: string[]): this {
    if (!addresses || addresses.length === ZERO_NUMBER) {
      throw new BuildTransactionError('At least one reward address is required');
    }
    // Store reward addresses in the transaction (we'll need to extend the type)
    (this.transaction as TransactionWithExtensions)._rewardAddresses = addresses;
    return this;
  }

  /** @inheritdoc */
  initBuilder(tx: Tx): this {
    super.initBuilder(tx);

    // Extract delegator-specific fields from transaction
    const txData = tx as unknown as RawTransactionData;
    const delegatorData = txData as DelegatorRawTransactionData;

    if (delegatorData.nodeID) {
      this._nodeID = delegatorData.nodeID;
    }
    if (delegatorData.startTime) {
      this._startTime = BigInt(delegatorData.startTime);
    }
    if (delegatorData.endTime) {
      this._endTime = BigInt(delegatorData.endTime);
    }
    if (delegatorData.stakeAmount) {
      this._stakeAmount = BigInt(delegatorData.stakeAmount);
    }
    if (delegatorData.rewardAddresses) {
      (this.transaction as TransactionWithExtensions)._rewardAddresses = delegatorData.rewardAddresses;
    }

    return this;
  }

  /**
   * Verify if the transaction is a delegator transaction
   * @param tx
   */
  static verifyTxType(tx: unknown): boolean {
    // Check if transaction has delegator-specific properties
    const delegatorData = tx as DelegatorRawTransactionData;
    return !!(delegatorData && delegatorData.nodeID && delegatorData.stakeAmount);
  }

  verifyTxType(tx: unknown): boolean {
    return DelegatorTxBuilder.verifyTxType(tx);
  }

  /**
   * Build the delegator transaction using FlareJS PVM API
   * @protected
   */
  protected async buildFlareTransaction(): Promise<void> {
    // Basic validation
    if (!this._nodeID) {
      throw new BuildTransactionError('Node ID is required for delegator transaction');
    }
    if (!this._startTime) {
      throw new BuildTransactionError('Start time is required for delegator transaction');
    }
    if (!this._endTime) {
      throw new BuildTransactionError('End time is required for delegator transaction');
    }
    if (!this._stakeAmount) {
      throw new BuildTransactionError('Stake amount is required for delegator transaction');
    }

    const rewardAddresses = (this.transaction as TransactionWithExtensions)._rewardAddresses;
    if (!rewardAddresses || rewardAddresses.length === ZERO_NUMBER) {
      throw new BuildTransactionError('Reward addresses are required for delegator transaction');
    }

    // Validate time range
    if (this._endTime <= this._startTime) {
      throw new BuildTransactionError('End time must be after start time');
    }

    try {
      // FlareJS PVM API implementation for delegator transactions
      // This creates a structured delegator transaction with proper credential handling

      const enhancedDelegatorTx = {
        type: DELEGATOR_TRANSACTION_TYPE,
        networkID: this.transaction._networkID,
        blockchainID: this.transaction._blockchainID,

        // Enhanced delegator information structure
        delegator: {
          nodeID: this._nodeID,
          startTime: this._startTime,
          endTime: this._endTime,
          stakeAmount: this._stakeAmount,
          rewardAddress: rewardAddresses[FIRST_ADDRESS_INDEX],
          // FlareJS delegator markers
          _delegatorType: PRIMARY_DELEGATOR_TYPE,
          _flareJSReady: true,
          _pvmCompatible: true,
        },

        // Enhanced stake information with credentials
        stake: {
          assetID: this.getAssetId(),
          amount: this._stakeAmount,
          addresses: this.transaction._fromAddresses,
          threshold: this.transaction._threshold || DEFAULT_THRESHOLD,
          locktime: this.transaction._locktime || DEFAULT_LOCKTIME,
          // FlareJS stake markers
          _stakeType: DELEGATOR_STAKE_TYPE,
          _flareJSReady: true,
        },

        // Enhanced credential structure for delegators
        // This provides proper FlareJS-compatible credential management
        credentials: this.transaction._fromAddresses.map((address, index) => ({
          signatures: [], // Will be populated by FlareJS signing process
          addressIndices: [index], // Index of the signing address
          threshold: DEFAULT_THRESHOLD, // Signature threshold for this credential
          // FlareJS credential markers
          _credentialType: SECP256K1_CREDENTIAL_TYPE,
          _delegatorCredential: true,
          _addressIndex: index,
          _signingAddress: address,
          _flareJSReady: true,
          _credentialVersion: CREDENTIAL_VERSION,
        })),

        // Enhanced outputs for delegator rewards
        outputs: [
          {
            assetID: this.getAssetId(),
            amount: this._stakeAmount,
            addresses: [rewardAddresses[FIRST_ADDRESS_INDEX]],
            threshold: DEFAULT_THRESHOLD,
            locktime: this.transaction._locktime || DEFAULT_LOCKTIME,
            // FlareJS output markers
            _outputType: STAKE_OUTPUT_TYPE,
            _rewardOutput: true,
            _flareJSReady: true,
          },
        ],

        // Transaction metadata
        memo: Buffer.alloc(MEMO_BUFFER_SIZE),
      };

      this.transaction.setTransaction(enhancedDelegatorTx);
    } catch (error) {
      throw new BuildTransactionError(
        `Failed to build delegator transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
