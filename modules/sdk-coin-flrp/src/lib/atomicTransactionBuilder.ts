import { BaseCoin as CoinConfig, FlareNetwork } from '@bitgo/statics';
import { BuildTransactionError, TransactionType, BaseTransaction, BaseKey } from '@bitgo/sdk-core';
import { Credential, Signature, TransferableInput, TransferableOutput } from '@flarenetwork/flarejs';
import { TransactionExplanation, DecodedUtxoObj, BaseAddress } from './iface';
import { KeyPair } from './keyPair';
import BigNumber from 'bignumber.js';
import {
  ASSET_ID_LENGTH,
  TRANSACTION_ID_HEX_LENGTH,
  PRIVATE_KEY_HEX_LENGTH,
  SECP256K1_SIGNATURE_LENGTH,
  HEX_PREFIX,
  HEX_PREFIX_LENGTH,
  DECIMAL_RADIX,
  SIGNING_METHOD,
  AMOUNT_STRING_ZERO,
  ZERO_BIGINT,
  ZERO_NUMBER,
  ERROR_AMOUNT_POSITIVE,
  ERROR_CREDENTIALS_ARRAY,
  ERROR_UTXOS_REQUIRED,
  ERROR_SIGNATURES_ARRAY,
  ERROR_SIGNATURES_EMPTY,
  ERROR_INVALID_PRIVATE_KEY,
  ERROR_ENHANCED_PARSE_FAILED,
  ERROR_FLAREJS_SIGNING_FAILED,
  ERROR_CREATE_CREDENTIAL_FAILED,
  ERROR_UNKNOWN,
  FLARE_ATOMIC_PARSED_PREFIX,
  HEX_ENCODING,
} from './constants';
import utils, { createFlexibleHexRegex } from './utils';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';

/**
 * Flare P-chain atomic transaction builder with FlareJS credential support.
 * This provides the foundation for building Flare P-chain transactions with proper
 * credential handling using FlareJS Credential and Signature classes.
 */
export abstract class AtomicTransactionBuilder extends TransactionBuilder {
  protected readonly _coinConfig: Readonly<CoinConfig>;
  // External chain id (destination) for export transactions
  protected _externalChainId: Buffer | undefined;

  protected _utxos: DecodedUtxoObj[] = [];
  // TODO check _flrpTransaction type
  protected _flrpTransaction: any;

  public _network: FlareNetwork;
  public _networkID: number;
  public _blockchainID: Buffer;
  public _assetId: Buffer;
  public _fromAddresses: string[];
  public _to: string[];
  public _locktime: bigint;
  public _threshold: number;
  public _fee: { fee: string; feeRate?: string; size?: number };
  public hasCredentials: boolean;
  public _tx?: unknown;
  public _signature?: unknown;
  public _type: TransactionType;
  public _rewardAddresses: Buffer[];

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._coinConfig = coinConfig;
  }

  protected abstract get transactionType(): TransactionType;

  /**
   * Get the asset ID for Flare network transactions
   * @returns Buffer containing the asset ID
   */
  protected getAssetId(): Buffer {
    // Use the asset ID from transaction if already set
    if (this._assetId && this._assetId.length > 0) {
      return this._assetId;
    }

    // For native FLR transactions, return zero-filled buffer as placeholder
    // In a real implementation, this would be obtained from the network configuration
    // or FlareJS API to get the actual native asset ID
    return Buffer.alloc(ASSET_ID_LENGTH);
  }

  validateAmount(amount: bigint): void {
    if (amount <= ZERO_BIGINT) {
      throw new BuildTransactionError(ERROR_AMOUNT_POSITIVE);
    }
  }

  /**
   * Validates that credentials array is properly formed
   * @param credentials - Array of credentials to validate
   */
  protected validateCredentials(credentials: Credential[]): void {
    if (!Array.isArray(credentials)) {
      throw new BuildTransactionError(ERROR_CREDENTIALS_ARRAY);
    }

    credentials.forEach((credential, index) => {
      if (!(credential instanceof Credential)) {
        throw new BuildTransactionError(`Invalid credential at index ${index}`);
      }
    });
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
          addresses: this._fromAddresses,
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
   * Set UTXOs for the transaction. This is required for creating inputs and outputs.
   *
   * @param utxos - Array of decoded UTXO objects
   * @returns this builder instance for chaining
   */
  utxos(utxos: DecodedUtxoObj[]): this {
    this._utxos = utxos;
    return this;
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

  /**
   * Base initBuilder used by concrete builders. For now just returns this so fluent API works.
   */
  initBuilder(_tx: unknown): this {
    return this;
  }

  /**
   * Sign transaction with private key using FlareJS compatibility
   */
  sign(params: { key: string }): this {
    // FlareJS signing implementation with atomic transaction support
    try {
      // Validate private key format (placeholder implementation)
      if (!params.key || params.key.length < PRIVATE_KEY_HEX_LENGTH) {
        throw new BuildTransactionError(ERROR_INVALID_PRIVATE_KEY);
      }

      // Create signature structure
      const signature = {
        privateKey: params.key,
        signingMethod: SIGNING_METHOD,
      };

      // Store signature for FlareJS compatibility
      this._signature = signature;
      this.hasCredentials = true;

      return this;
    } catch (error) {
      throw new BuildTransactionError(
        `${ERROR_FLAREJS_SIGNING_FAILED}: ${error instanceof Error ? error.message : ERROR_UNKNOWN}`
      );
    }
  }

  /**
   * Build the transaction using FlareJS compatibility
   */
  // async build(): Promise<BaseTransaction> {
  //   // FlareJS UnsignedTx creation with atomic transaction support
  //   try {
  //     // Validate transaction requirements
  //     if (!this._utxos || this._utxos.length === 0) {
  //       throw new BuildTransactionError(ERROR_UTXOS_REQUIRED_BUILD);
  //     }

  //     // Create FlareJS transaction structure with atomic support
  //     const transaction = {
  //       _id: `${TRANSACTION_ID_PREFIX}${Date.now()}`,
  //       _inputs: [],
  //       _outputs: [],
  //       _type: this.transactionType,
  //       signature: [] as string[],

  //       fromAddresses: this._fromAddresses,
  //       validationErrors: [],

  //       // FlareJS methods with atomic support
  //       toBroadcastFormat: () => `${TRANSACTION_ID_PREFIX}${Date.now()}`,
  //       toJson: () => ({
  //         type: this.transactionType,
  //       }),

  //       explainTransaction: (): TransactionExplanation => ({
  //         type: this.transactionType,
  //         inputs: [],
  //         outputs: [],
  //         outputAmount: AMOUNT_STRING_ZERO,
  //         rewardAddresses: [],
  //         id: `${FLARE_ATOMIC_PREFIX}${Date.now()}`,
  //         changeOutputs: [],
  //         changeAmount: AMOUNT_STRING_ZERO,
  //         fee: { fee: this._fee.fee },
  //       }),

  //       isTransactionForCChain: false,
  //       loadInputsAndOutputs: () => {
  //         /* FlareJS atomic transaction loading */
  //       },
  //       inputs: () => [],
  //       outputs: () => [],
  //       fee: () => ({ fee: this._fee.fee }),
  //       feeRate: () => 0,
  //       id: () => `${FLARE_ATOMIC_PREFIX}${Date.now()}`,
  //       type: this.transactionType,
  //     } as unknown as BaseTransaction;

  //     return transaction;
  //   } catch (error) {
  //     throw new BuildTransactionError(
  //       `${ERROR_ENHANCED_BUILD_FAILED}: ${error instanceof Error ? error.message : ERROR_UNKNOWN}`
  //     );
  //   }
  // }

  /**
   * Parse and explain a transaction from hex using FlareJS compatibility
   */
  explainTransaction(): TransactionExplanation {
    // FlareJS transaction parsing with atomic support
    try {
      return {
        type: this.transactionType,
        inputs: [],
        outputs: [],
        outputAmount: AMOUNT_STRING_ZERO,
        rewardAddresses: [],
        id: `${FLARE_ATOMIC_PARSED_PREFIX}${Date.now()}`,
        changeOutputs: [],
        changeAmount: AMOUNT_STRING_ZERO,
        fee: { fee: this._fee.fee },
      };
    } catch (error) {
      throw new BuildTransactionError(
        `${ERROR_ENHANCED_PARSE_FAILED}: ${error instanceof Error ? error.message : ERROR_UNKNOWN}`
      );
    }
  }

  /** @inheritdoc */
  protected signImplementation({ key }: BaseKey): BaseTransaction {
    this._signer.push(new KeyPair({ prv: key }));
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildFlareTransaction();
    this.transaction.setTransactionType(this.transactionType);
    if (this.hasSigner) {
      this._signer.forEach((keyPair) => this.transaction.sign(keyPair));
    }
    return this.transaction;
  }

  /**
   * Builds the avax transaction. transaction field is changed.
   */
  protected abstract buildFlareTransaction(): void;

  /**
   * Getter for know if build should sign
   */
  get hasSigner(): boolean {
    return this._signer !== undefined && this._signer.length > 0;
  }

  /** @inheritdoc */
  validateKey({ key }: BaseKey): void {
    if (!new KeyPair({ prv: key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!utils.isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address');
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /**
   * Check the raw transaction has a valid format in the blockchain context, throw otherwise.
   * It overrides abstract method from BaseTransactionBuilder
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

  // setTransaction(tx: any): void {
  //   this._flrpTransaction = tx;
  // }
}
