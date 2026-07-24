import {
  utils as FlareUtils,
  TypeSymbols,
  pvm,
  networkIDs,
  UnsignedTx,
  pvmSerial,
  Credential,
  TransferOutput,
  TransferableOutput,
  TransferInput,
  TransferableInput,
} from '@flarenetwork/flarejs';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import utils from './utils';
import { FlrpFeeState } from '@bitgo/public-types';
import { Tx, DecodedUtxoObj } from './iface';

/**
 * Builder for AddPermissionlessDelegator transactions on Flare P-Chain.
 *
 * This builder creates delegation transactions where a user delegates stake
 * to an existing validator. Unlike AddPermissionlessValidator:
 * - No BLS keys required
 * - Delegates to an existing validator's nodeID
 * - Rewards go to corresponding C-chain address
 *
 * Extends AtomicTransactionBuilder to inherit address sorting and credential management
 * logic needed for proper multisig UTXO handling.
 */
export class PermissionlessDelegatorTxBuilder extends AtomicTransactionBuilder {
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
    // Note: Minimum duration validation is handled by the network.
    // Flare P-chain requires minimum 14 days for delegation.
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

    // Recover UTXOs from baseTx inputs using stake output addresses as proxy
    this.transaction._utxos = this.recoverUtxosFromInputs(
      [...delegatorTx.baseTx.inputs],
      this.transaction._fromAddresses
    );

    const credentials = parsedCredentials || [];

    if (rawBytes && credentials.length > 0) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    // Compute addressesIndex to map wallet positions to sorted UTXO positions
    // Force recompute to ensure fresh mapping from parsed transaction
    this.computeAddressesIndex(true);

    // Use parsed credentials if available, otherwise create new ones based on sigIndices
    // The sigIndices from the parsed transaction (stored in addressesIndex) determine
    // the correct credential ordering for on-chain verification
    const txCredentials =
      credentials.length > 0
        ? credentials
        : this.transaction._utxos.map((utxo) => {
            const utxoThreshold = utxo.threshold || this.transaction._threshold;
            const sigIndices = utxo.addressesIndex ?? [];
            // Use sigIndices-based method if we have valid sigIndices from parsed transaction
            if (sigIndices.length >= utxoThreshold && sigIndices.every((idx) => idx >= 0)) {
              return this.createCredentialForUtxo(utxo, utxoThreshold, sigIndices);
            }
            return this.createCredentialForUtxo(utxo, utxoThreshold);
          });

    // Create addressMaps using sigIndices from parsed transaction for consistency
    const addressMaps = this.transaction._utxos.map((utxo) => {
      const utxoThreshold = utxo.threshold || this.transaction._threshold;
      const sigIndices = utxo.addressesIndex ?? [];
      if (sigIndices.length >= utxoThreshold && sigIndices.every((idx) => idx >= 0)) {
        return this.createAddressMapForUtxo(utxo, utxoThreshold, sigIndices);
      }
      return this.createAddressMapForUtxo(utxo, utxoThreshold);
    });

    const unsignedTx = new UnsignedTx(delegatorTx, [], new FlareUtils.AddressMaps(addressMaps), txCredentials);

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

  /**
   * Recover UTXOs from transaction inputs.
   * Uses fromAddresses as proxy for UTXO addresses since we're reconstructing from a parsed transaction.
   *
   * @param inputs Array of TransferableInput from baseTx
   * @param fromAddresses Wallet addresses to use as proxy for UTXO addresses
   * @returns Array of decoded UTXO objects
   * @private
   */
  private recoverUtxosFromInputs(inputs: TransferableInput[], fromAddresses: Uint8Array[]): DecodedUtxoObj[] {
    const proxyAddresses = fromAddresses.map((addr) =>
      utils.addressToString(this.transaction._network.hrp, this.transaction._network.alias, Buffer.from(addr))
    );

    return inputs.map((input) => {
      const utxoId = input.utxoID;
      const transferInput = input.input as TransferInput;
      const sigIndicies = transferInput.sigIndicies();

      const utxo: DecodedUtxoObj = {
        outputID: 7, // SECP256K1 Transfer Output type
        amount: input.amount().toString(),
        txid: utils.cb58Encode(Buffer.from(utxoId.txID.toBytes())),
        outputidx: utxoId.outputIdx.value().toString(),
        threshold: sigIndicies.length || this.transaction._threshold,
        addresses: proxyAddresses,
        addressesIndex: sigIndicies,
      };
      return utxo;
    });
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
   * BitGo Convention for fromAddresses:
   * - Index 0: User key (signer in normal mode)
   * - Index 1: BitGo key (always a signer)
   * - Index 2: Backup key (signer in recovery mode)
   *
   * For delegation transactions, the user's address at index 0 is used as the default
   * reward address parameter (though the parameter has no on-chain effect - rewards
   * go to C-chain addresses derived from the P-chain addresses in stake outputs).
   *
   * @returns Buffer containing the user's address
   * @protected
   */
  protected getUserAddress(): Buffer {
    const userIndex = 0; // BitGo convention: user is always at index 0
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

    // Compute addressesIndex to map wallet key indices to sorted UTXO address positions
    this.computeAddressesIndex();

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
    // IMPORTANT: Use getSigningAddresses() to get the correct 2 signing keys
    // This ensures proper key selection for both normal and recovery modes:
    // - Normal mode: user (index 0) + bitgo (index 1)
    // - Recovery mode: backup (index 2) + bitgo (index 1)
    const signingAddresses = this.getSigningAddresses();

    const delegatorTx = pvm.e.newAddPermissionlessDelegatorTx(
      {
        end: this._endTime,
        feeState: this._feeState,
        fromAddressesBytes: signingAddresses,
        nodeId: this._nodeID,
        rewardAddresses: rewardAddresses,
        start: this._startTime,
        subnetId: networkIDs.PrimaryNetworkID.toString(),
        utxos,
        weight: this._stakeAmount,
      },
      this.transaction._context
    );

    // Fix change output threshold bug (same as ExportInPTxBuilder)
    const flareUnsignedTx = delegatorTx as UnsignedTx;
    const innerTx = flareUnsignedTx.getTx() as pvmSerial.AddPermissionlessDelegatorTx;
    const changeOutputs = innerTx.baseTx.outputs;
    let correctedDelegatorTx: pvmSerial.AddPermissionlessDelegatorTx = innerTx;

    if (changeOutputs.length > 0 && this.transaction._threshold > 1) {
      // Only apply fix for multisig wallets (threshold > 1)
      const allWalletAddresses = this.transaction._fromAddresses.map((addr) => Buffer.from(addr));

      const correctedChangeOutputs = changeOutputs.map((output) => {
        const transferOut = output.output as TransferOutput;

        const assetIdStr = utils.flareIdString(Buffer.from(output.assetId.toBytes()).toString('hex')).toString();
        return TransferableOutput.fromNative(
          assetIdStr,
          transferOut.amount(),
          allWalletAddresses,
          this.transaction._locktime,
          this.transaction._threshold // Fix: use wallet's threshold instead of FlareJS's default (1)
        );
      });

      correctedDelegatorTx = this.createCorrectedDelegatorTx(innerTx, correctedChangeOutputs);
    }

    // Recreate credentials and addressMaps from corrected transaction inputs
    // This follows the same pattern as ExportInPTxBuilder to ensure proper signing
    const utxosWithIndex = correctedDelegatorTx.baseTx.inputs.map((input) => {
      const inputTxid = utils.cb58Encode(Buffer.from(input.utxoID.txID.toBytes()));
      const inputOutputIdx = input.utxoID.outputIdx.value().toString();

      const originalUtxo = this.transaction._utxos.find(
        (utxo) => utxo.txid === inputTxid && utxo.outputidx === inputOutputIdx
      );

      if (!originalUtxo) {
        throw new BuildTransactionError(`Could not find matching UTXO for input ${inputTxid}:${inputOutputIdx}`);
      }

      const transferInput = input.input as TransferInput;
      const actualSigIndices = transferInput.sigIndicies();

      return {
        ...originalUtxo,
        addressesIndex: originalUtxo.addressesIndex,
        addresses: originalUtxo.addresses,
        threshold: originalUtxo.threshold || this.transaction._threshold,
        actualSigIndices,
      };
    });

    this.transaction._utxos = utxosWithIndex;

    const txCredentials = utxosWithIndex.map((utxo) =>
      this.createCredentialForUtxo(utxo, utxo.threshold, utxo.actualSigIndices)
    );

    const addressMaps = utxosWithIndex.map((utxo) =>
      this.createAddressMapForUtxo(utxo, utxo.threshold, utxo.actualSigIndices)
    );

    // Create new UnsignedTx with corrected change outputs and proper credentials
    const fixedUnsignedTx = new UnsignedTx(
      correctedDelegatorTx,
      [],
      new FlareUtils.AddressMaps(addressMaps),
      txCredentials
    );

    this.transaction.setTransaction(fixedUnsignedTx);
  }

  /**
   * Create a corrected AddPermissionlessDelegatorTx with the given change outputs.
   * This is necessary because FlareJS's newAddPermissionlessDelegatorTx doesn't support setting
   * the threshold and locktime for change outputs - it defaults to threshold=1.
   *
   * FlareJS declares baseTx.outputs as readonly, so we use Object.defineProperty
   * to override the property with the corrected outputs. This is a workaround until
   * FlareJS adds proper support for change output thresholds.
   *
   * @param originalTx - The original AddPermissionlessDelegatorTx
   * @param correctedOutputs - The corrected change outputs with proper threshold
   * @returns A new AddPermissionlessDelegatorTx with the corrected change outputs
   */
  private createCorrectedDelegatorTx(
    originalTx: pvmSerial.AddPermissionlessDelegatorTx,
    correctedOutputs: TransferableOutput[]
  ): pvmSerial.AddPermissionlessDelegatorTx {
    // FlareJS declares baseTx.outputs as `public readonly outputs: readonly TransferableOutput[]`
    // We use Object.defineProperty to override the readonly property with our corrected outputs.
    // This is necessary because FlareJS's newAddPermissionlessDelegatorTx doesn't support change output threshold/locktime.
    Object.defineProperty(originalTx.baseTx, 'outputs', {
      value: correctedOutputs,
      writable: false,
      enumerable: true,
      configurable: true,
    });

    return originalTx;
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

  // Note: createCredentialForUtxo and createAddressMapForUtxo methods are inherited
  // from AtomicTransactionBuilder and support both normal and recovery signing modes
}
