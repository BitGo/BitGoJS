import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Credential, Signature, TransferableInput, TransferableOutput } from '@flarenetwork/flarejs';
import { DecodedUtxoObj } from './iface';
import {
  ASSET_ID_LENGTH,
  TRANSACTION_ID_HEX_LENGTH,
  SECP256K1_SIGNATURE_LENGTH,
  HEX_PREFIX,
  HEX_PREFIX_LENGTH,
  DECIMAL_RADIX,
  AMOUNT_STRING_ZERO,
  ZERO_NUMBER,
  ERROR_UTXOS_REQUIRED,
  ERROR_SIGNATURES_ARRAY,
  ERROR_SIGNATURES_EMPTY,
  ERROR_CREATE_CREDENTIAL_FAILED,
  ERROR_UNKNOWN,
  HEX_ENCODING,
} from './constants';
import utils, { createFlexibleHexRegex } from './utils';
import { TransactionBuilder } from './transactionBuilder';

/**
 * Flare P-chain atomic transaction builder with FlareJS credential support.
 * This provides the foundation for building Flare P-chain transactions with proper
 * credential handling using FlareJS Credential and Signature classes.
 */
export abstract class AtomicTransactionBuilder extends TransactionBuilder {
  protected _externalChainId: Buffer | undefined;
  protected _utxos: DecodedUtxoObj[] = [];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction._fee.fee = this.fixedFee;
  }

  /**
   * The internal chain is the one set for the coin in coinConfig.network. The external chain is the other chain involved.
   * The external chain id is the source on import and the destination on export.
   *
   * @param {string} chainId - id of the external chain
   */
  externalChainId(chainId: string | Buffer): this {
    const newTargetChainId = typeof chainId === 'string' ? utils.cb58Decode(chainId) : Buffer.from(chainId);
    this.validateChainId(newTargetChainId);
    this._externalChainId = newTargetChainId;
    return this;
  }

  /**
   * Fee is fix for AVM atomic tx.
   *
   * @returns network.txFee
   * @protected
   */
  protected get fixedFee(): string {
    return this.transaction._network.txFee;
  }

  /**
   * Check the buffer has 32 byte long.
   * @param chainID
   */
  validateChainId(chainID: Buffer): void {
    if (chainID.length !== 32) {
      throw new BuildTransactionError('Chain id are 32 byte size');
    }
  }

  /**
   * Creates inputs, outputs, and credentials for Flare P-chain atomic transactions.
   * Based on AVAX P-chain implementation adapted for FlareJS.
   *
   * Note: This is a simplified implementation that creates the core structure.
   * The FlareJS type system integration will be refined in future iterations.
   *
   * @param total - Total amount needed including fees
   * @returns Object containing TransferableInput[], TransferableOutput[], and Credential[]
   */
  protected createInputOutput(total: bigint): {
    inputs: TransferableInput[];
    outputs: TransferableOutput[];
    credentials: Credential[];
  } {
    if (!this._utxos || this._utxos.length === ZERO_NUMBER) {
      throw new BuildTransactionError(ERROR_UTXOS_REQUIRED);
    }

    const inputs: TransferableInput[] = [];
    const outputs: TransferableOutput[] = [];
    const credentials: Credential[] = [];

    let inputSum = 0n;
    const addressIndices: { [address: string]: number } = {};
    let nextAddressIndex = 0;

    // Sort UTXOs by amount in descending order for optimal coin selection
    const sortedUtxos = [...this._utxos].sort((a, b) => {
      const amountA = BigInt(a.amount);
      const amountB = BigInt(b.amount);
      if (amountA > amountB) return -1;
      if (amountA < amountB) return 1;
      return 0;
    });

    // Process UTXOs to create inputs and credentials
    for (const utxo of sortedUtxos) {
      const utxoAmount = BigInt(utxo.amount);

      if (inputSum >= total) {
        break; // We have enough inputs
      }

      // Track input sum
      inputSum += utxoAmount;

      // Track address indices for signature ordering (mimics AVAX pattern)
      const addressIndexArray: number[] = [];
      for (const address of utxo.addresses) {
        if (!(address in addressIndices)) {
          addressIndices[address] = nextAddressIndex++;
        }
        addressIndexArray.push(addressIndices[address]);
      }

      // Store address indices on the UTXO for credential creation
      utxo.addressesIndex = addressIndexArray;

      // Create TransferableInput for atomic transactions
      const transferableInput = {
        txID: Buffer.from(utxo.txid || AMOUNT_STRING_ZERO.repeat(TRANSACTION_ID_HEX_LENGTH), HEX_ENCODING),
        outputIndex: parseInt(utxo.outputidx || AMOUNT_STRING_ZERO, DECIMAL_RADIX),
        assetID: this.getAssetId(),
        input: {
          amount: utxoAmount,
          addressIndices: addressIndexArray,
          threshold: utxo.threshold,
        },
      };

      // Store the input (type assertion for compatibility)
      inputs.push(transferableInput as unknown as TransferableInput);

      // Create credential with placeholder signatures
      // In a real implementation, these would be actual signatures
      const signatures = Array.from({ length: utxo.threshold }, () => '');
      const credential = this.createFlareCredential(0, signatures);
      credentials.push(credential);
    }

    // Verify we have enough inputs
    if (inputSum < total) {
      throw new BuildTransactionError(`Insufficient funds: need ${total}, have ${inputSum}`);
    }

    // Create change output if we have excess input amount
    if (inputSum > total) {
      const changeAmount = inputSum - total;

      // Create change output for atomic transactions
      const changeOutput = {
        assetID: this.getAssetId(),
        output: {
          amount: changeAmount,
          addresses: this.transaction._fromAddresses,
          threshold: 1,
          locktime: 0n,
        },
      };

      // Add the change output (type assertion for compatibility)
      outputs.push(changeOutput as unknown as TransferableOutput);
    }

    return { inputs, outputs, credentials };
  }

  /**
   * Get the asset ID for Flare network transactions
   * @returns Buffer containing the asset ID
   */
  protected getAssetId(): Buffer {
    // Use the asset ID from transaction if already set
    if (this.transaction._assetId && this.transaction._assetId.length > 0) {
      return Buffer.from(this.transaction._assetId);
    }

    // For native FLR transactions, return zero-filled buffer as placeholder
    // In a real implementation, this would be obtained from the network configuration
    // or FlareJS API to get the actual native asset ID
    return Buffer.alloc(ASSET_ID_LENGTH);
  }

  /**
   * Flare equivalent of Avalanche's SelectCredentialClass
   * Creates a credential with the provided signatures
   *
   * @param credentialId - The credential ID (not used in FlareJS but kept for compatibility)
   * @param signatures - Array of signature hex strings or empty strings for placeholders
   * @returns Credential instance
   */
  protected createFlareCredential(_credentialId: number, signatures: string[]): Credential {
    if (!Array.isArray(signatures)) {
      throw new BuildTransactionError(ERROR_SIGNATURES_ARRAY);
    }

    if (signatures.length === ZERO_NUMBER) {
      throw new BuildTransactionError(ERROR_SIGNATURES_EMPTY);
    }

    const sigs = signatures.map((sig, index) => {
      // Handle empty/placeholder signatures
      if (!sig || sig.length === 0) {
        return new Signature(new Uint8Array(SECP256K1_SIGNATURE_LENGTH));
      }

      // Validate hex string format
      const cleanSig = sig.startsWith(HEX_PREFIX) ? sig.slice(HEX_PREFIX_LENGTH) : sig;
      if (!createFlexibleHexRegex().test(cleanSig)) {
        throw new BuildTransactionError(`Invalid hex signature at index ${index}: contains non-hex characters`);
      }

      // Convert to buffer and validate length
      const sigBuffer = Buffer.from(cleanSig, HEX_ENCODING);
      if (sigBuffer.length > SECP256K1_SIGNATURE_LENGTH) {
        throw new BuildTransactionError(
          `Signature too long at index ${index}: ${sigBuffer.length} bytes (max ${SECP256K1_SIGNATURE_LENGTH})`
        );
      }

      // Create fixed-length buffer and copy signature data
      const fixedLengthBuffer = Buffer.alloc(SECP256K1_SIGNATURE_LENGTH);
      sigBuffer.copy(fixedLengthBuffer);

      try {
        return new Signature(new Uint8Array(fixedLengthBuffer));
      } catch (error) {
        throw new BuildTransactionError(
          `Failed to create signature at index ${index}: ${error instanceof Error ? error.message : ERROR_UNKNOWN}`
        );
      }
    });

    try {
      return new Credential(sigs);
    } catch (error) {
      throw new BuildTransactionError(
        `${ERROR_CREATE_CREDENTIAL_FAILED}: ${error instanceof Error ? error.message : ERROR_UNKNOWN}`
      );
    }
  }
}
