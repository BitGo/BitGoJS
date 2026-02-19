import {
  utils as FlareUtils,
  TypeSymbols,
  pvm,
  networkIDs,
  UnsignedTx,
  pvmSerial,
  Credential,
  TransferOutput,
} from '@flarenetwork/flarejs';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';
import { FlrpFeeState } from '@bitgo/public-types';
import { Tx } from './iface';

/**
 * Builder for AddPermissionlessDelegator transactions on Flare P-Chain.
 *
 * This builder creates delegation transactions where a user delegates stake
 * to an existing validator. Unlike AddPermissionlessValidator:
 * - No BLS keys required
 * - Delegates to an existing validator's nodeID
 * - Rewards go to corresponding C-chain address
 */
export class PermissionlessDelegatorTxBuilder extends TransactionBuilder {
  protected _nodeID: string;
  protected _startTime: bigint;
  protected _endTime: bigint;
  protected _stakeAmount: bigint;
  protected _feeState: FlrpFeeState | undefined;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this.transaction._fee.fee = this.transaction._network.txFee;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AddPermissionlessDelegator;
  }

  // Validation methods
  validateNodeID(nodeID: string): void {
    if (!nodeID) {
      throw new BuildTransactionError('Invalid transaction: missing nodeID');
    }
    if (!nodeID.startsWith('NodeID-')) {
      throw new BuildTransactionError('Invalid transaction: invalid NodeID tag');
    }
    if (!utils.isValidNodeID(nodeID)) {
      throw new BuildTransactionError('Invalid transaction: NodeID is not in cb58 format');
    }
  }

  validateStakeDuration(startTime: bigint, endTime: bigint): void {
    if (endTime < startTime) {
      throw new BuildTransactionError('End date cannot be less than start date');
    }
  }

  validateStakeAmount(amount: bigint): void {
    const minDelegationStake = BigInt(
      this.transaction._network.minDelegationStake || this.transaction._network.minStake
    );
    if (amount < minDelegationStake) {
      throw new BuildTransactionError(
        'Minimum delegation amount is ' + Number(minDelegationStake) / 1000000000 + ' FLR.'
      );
    }
  }

  // Builder methods
  /**
   *
   * NOTE: On Flare, staking rewards are distributed on C-chain (not P-chain).
   * Rewards go to the C-chain address derived from the same public key as
   * the P-chain staking address. This parameter is passed to the FlareJS API
   * but has NO on-chain effect on reward distribution.
   *
   * @param address P-chain address in Bech32 format (e.g., "P-flare1..." or "P-costwo1...")
   */
  rewardAddress(address: string): this {
    this.transaction._rewardAddresses = [utils.parseAddress(address)];
    return this;
  }

  /**
   * Set the validator node ID to delegate to
   * @param nodeID Validator node ID in format "NodeID-..."
   */
  nodeID(nodeID: string): this {
    this.validateNodeID(nodeID);
    this._nodeID = nodeID;
    return this;
  }

  /**
   * Set the start time for the delegation period
   * @param value Unix timestamp in seconds
   */
  startTime(value: string | number): this {
    this._startTime = BigInt(value);
    return this;
  }

  /**
   * Set the end time for the delegation period
   * @param value Unix timestamp in seconds
   */
  endTime(value: string | number): this {
    this._endTime = BigInt(value);
    return this;
  }

  /**
   * Set the amount to stake/delegate
   * @param value Amount in nanoFLR (wei)
   */
  stakeAmount(value: bigint | string): this {
    const valueBigInt = typeof value === 'bigint' ? value : BigInt(value);
    this.validateStakeAmount(valueBigInt);
    this._stakeAmount = valueBigInt;
    return this;
  }

  /**
   * @param feeState Fee state from P-chain
   */
  feeState(feeState: FlrpFeeState): this {
    this._feeState = feeState;
    this.transaction._feeState = feeState;
    return this;
  }

  /**
   * Initialize builder from a parsed AddPermissionlessDelegatorTx.
   * Used to reconstruct the builder state from a raw transaction for signing.
   *
   * @param tx The parsed transaction
   * @param rawBytes Optional raw transaction bytes
   * @param parsedCredentials Optional credentials from the parsed transaction
   */
  initBuilder(tx: Tx, rawBytes?: Buffer, parsedCredentials?: Credential[]): this {
    const delegatorTx = tx as pvmSerial.AddPermissionlessDelegatorTx;

    if (!this.verifyTxType(delegatorTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // Extract validator info (nodeID, startTime, endTime, weight/stakeAmount)
    const validator = delegatorTx.subnetValidator.validator;
    this._nodeID = validator.nodeId.toString();
    this._startTime = validator.startTime.value();
    this._endTime = validator.endTime.value();
    this._stakeAmount = validator.weight.value();

    // Extract from addresses from stake outputs
    // In delegation transactions, stake outputs contain the owner addresses
    const stakeOutputs = delegatorTx.stake;
    if (stakeOutputs.length > 0) {
      const firstStakeOutput = stakeOutputs[0];
      // Stake outputs use TransferOutput type with outputOwners property
      const transferOutput = firstStakeOutput.output as TransferOutput;
      const outputOwners = transferOutput.outputOwners;
      if (outputOwners) {
        this.transaction._threshold = outputOwners.threshold.value();
        this.transaction._fromAddresses = outputOwners.addrs.map((addr) => Buffer.from(addr.toBytes()));
      }
    }

    // Extract reward addresses from delegatorRewardsOwner
    const rewardsOwner = delegatorTx.getDelegatorRewardsOwner();
    if (rewardsOwner && rewardsOwner.addrs && rewardsOwner.addrs.length > 0) {
      this.transaction._rewardAddresses = rewardsOwner.addrs.map((addr) => Buffer.from(addr.toBytes()));
    }

    const credentials = parsedCredentials || [];

    if (rawBytes && credentials.length > 0) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    // Create the UnsignedTx with parsed credentials
    // AddressMaps will be empty as they're computed during signing
    const unsignedTx = new UnsignedTx(delegatorTx, [], new FlareUtils.AddressMaps([]), credentials);

    this.transaction.setTransaction(unsignedTx);
    return this;
  }

  /**
   * Instance method to verify transaction type
   * @param type TypeSymbol from parsed transaction
   */
  verifyTxType(type: TypeSymbols): boolean {
    return PermissionlessDelegatorTxBuilder.verifyTxType(type);
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
   * Get the user's address (index 0) for default reward address.
   *
   * The user key is at index 0 in the fromAddresses array (BitGo convention: [user, bitgo, backup]).
   * This is used as the default rewardAddress parameter (though the parameter is ignored by protocol).
   *
   * @returns Buffer containing the user's address
   * @protected
   */
  protected getUserAddress(): Buffer {
    const userIndex = 0;
    if (!this.transaction._fromAddresses || this.transaction._fromAddresses.length <= userIndex) {
      throw new BuildTransactionError('User address (index 0) is required for delegation');
    }
    const userAddress = Buffer.from(this.transaction._fromAddresses[userIndex]);
    if (userAddress.length !== 20) {
      throw new BuildTransactionError(`Invalid user address length: expected 20 bytes, got ${userAddress.length}`);
    }
    return userAddress;
  }

  /**
   * Build the permissionless delegator transaction using FlareJS.
   * Uses pvm.e.newAddPermissionlessDelegatorTx (post-Etna API).
   *
   * Note: The rewardAddresses parameter is accepted by the API but does NOT affect
   * where rewards are sent on-chain. Rewards accrue to C-chain addresses derived
   * from the P-chain addresses in the stake outputs. The stake outputs contain the
   * addresses from fromAddressesBytes (sorted to match UTXO owner order).
   * @protected
   */
  protected buildFlareTransaction(): void {
    if (this.transaction.hasCredentials) return;

    // Validate required fields
    if (!this._nodeID) {
      throw new BuildTransactionError('NodeID is required for delegation');
    }
    if (!this._startTime) {
      throw new BuildTransactionError('Start time is required for delegation');
    }
    if (!this._endTime) {
      throw new BuildTransactionError('End time is required for delegation');
    }
    if (!this._stakeAmount) {
      throw new BuildTransactionError('Stake amount is required for delegation');
    }
    if (!this.transaction._context) {
      throw new BuildTransactionError('Context is required for delegation');
    }
    if (!this.transaction._fromAddresses || this.transaction._fromAddresses.length === 0) {
      throw new BuildTransactionError('From addresses are required for delegation');
    }
    if (!this._feeState) {
      throw new BuildTransactionError('Fee state is required for delegation');
    }

    this.validateStakeDuration(this._startTime, this._endTime);

    // Convert decoded UTXOs to FlareJS Utxo objects
    if (!this.transaction._utxos || this.transaction._utxos.length === 0) {
      throw new BuildTransactionError('UTXOs are required for delegation');
    }
    const utxos = utils.decodedToUtxos(this.transaction._utxos, this.transaction._network.assetId);

    // Get user address for default reward address derivation
    const userAddress = this.getUserAddress();

    const rewardAddresses =
      this.transaction._rewardAddresses.length > 0 ? this.transaction._rewardAddresses : [userAddress];

    // Use Etna (post-fork) API - pvm.e.newAddPermissionlessDelegatorTx
    // IMPORTANT: Sort fromAddresses to match the sorted order in UTXOs
    // The SDK sorts UTXO addresses (utils.ts:574) before passing to FlareJS,
    // so fromAddressesBytes must also be sorted to match UTXO owner addresses
    const fromAddressBuffers = this.transaction._fromAddresses.map((addr) => Buffer.from(addr));
    const sortedFromAddresses = utils.sortAddressBuffersByHex(fromAddressBuffers);

    const delegatorTx = pvm.e.newAddPermissionlessDelegatorTx(
      {
        end: this._endTime,
        feeState: this._feeState,
        fromAddressesBytes: sortedFromAddresses,
        nodeId: this._nodeID,
        rewardAddresses: rewardAddresses,
        start: this._startTime,
        subnetId: networkIDs.PrimaryNetworkID.toString(),
        utxos,
        weight: this._stakeAmount,
      },
      this.transaction._context
    );

    this.transaction.setTransaction(delegatorTx as UnsignedTx);
  }

  /**
   * Verify if the transaction type matches AddPermissionlessDelegatorTx
   * @param type TypeSymbol from parsed transaction
   */
  static verifyTxType(type: TypeSymbols): boolean {
    return type === TypeSymbols.AddPermissionlessDelegatorTx;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
