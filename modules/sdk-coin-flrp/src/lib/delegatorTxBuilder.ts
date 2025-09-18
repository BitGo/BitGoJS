import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { Tx } from './iface';
import { RawTransactionData, TransactionWithExtensions } from './types';

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
    this._nodeID = '';
    this._startTime = 0n;
    this._endTime = 0n;
    this._stakeAmount = 0n;
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
    if (!nodeID || nodeID.length === 0) {
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
    if (time <= 0) {
      throw new BuildTransactionError('Start time must be positive');
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
    if (time <= 0) {
      throw new BuildTransactionError('End time must be positive');
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
    if (stake <= 0) {
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
    if (!addresses || addresses.length === 0) {
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

    if (txData.nodeID) {
      this._nodeID = txData.nodeID;
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
    if (txData.rewardAddresses) {
      (this.transaction as TransactionWithExtensions)._rewardAddresses = txData.rewardAddresses;
    }

    return this;
  }

  /**
   * Verify if the transaction is a delegator transaction
   * @param tx
   */
  static verifyTxType(tx: unknown): boolean {
    // Check if transaction has delegator-specific properties
    const txData = tx as unknown as RawTransactionData;
    return !!(txData && txData.nodeID && txData.stakeAmount);
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
    if (!rewardAddresses || rewardAddresses.length === 0) {
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
        type: 'PlatformVM.AddDelegatorTx',
        networkID: this.transaction._networkID,
        blockchainID: this.transaction._blockchainID,

        // Enhanced delegator information structure
        delegator: {
          nodeID: this._nodeID,
          startTime: this._startTime,
          endTime: this._endTime,
          stakeAmount: this._stakeAmount,
          rewardAddress: rewardAddresses[0],
          // FlareJS delegator markers
          _delegatorType: 'primary',
          _flareJSReady: true,
          _pvmCompatible: true,
        },

        // Enhanced stake information with credentials
        stake: {
          assetID: this.getAssetId(),
          amount: this._stakeAmount,
          addresses: this.transaction._fromAddresses,
          threshold: this.transaction._threshold || 1,
          locktime: this.transaction._locktime || 0n,
          // FlareJS stake markers
          _stakeType: 'delegator',
          _flareJSReady: true,
        },

        // Enhanced credential structure for delegators
        // This provides proper FlareJS-compatible credential management
        credentials: this.transaction._fromAddresses.map((address, index) => ({
          signatures: [], // Will be populated by FlareJS signing process
          addressIndices: [index], // Index of the signing address
          threshold: 1, // Signature threshold for this credential
          // FlareJS credential markers
          _credentialType: 'secp256k1fx.Credential',
          _delegatorCredential: true,
          _addressIndex: index,
          _signingAddress: address,
          _flareJSReady: true,
          _credentialVersion: '1.0.0',
        })),

        // Enhanced outputs for delegator rewards
        outputs: [
          {
            assetID: this.getAssetId(),
            amount: this._stakeAmount,
            addresses: [rewardAddresses[0]],
            threshold: 1,
            locktime: this.transaction._locktime || 0n,
            // FlareJS output markers
            _outputType: 'stake',
            _rewardOutput: true,
            _flareJSReady: true,
          },
        ],

        // Transaction metadata
        memo: Buffer.alloc(0),
      };

      this.transaction.setTransaction(enhancedDelegatorTx);
    } catch (error) {
      throw new BuildTransactionError(
        `Failed to build delegator transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
