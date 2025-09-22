import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { BuildTransactionError, TransactionType, BaseTransaction } from '@bitgo-beta/sdk-core';
import { Credential, Signature, TransferableInput, TransferableOutput } from '@flarenetwork/flarejs';
import { TransactionExplanation, DecodedUtxoObj } from './iface';

// Constants for signature handling
const SECP256K1_SIGNATURE_LENGTH = 65;

/**
 * Flare P-chain atomic transaction builder with FlareJS credential support.
 * This provides the foundation for building Flare P-chain transactions with proper
 * credential handling using FlareJS Credential and Signature classes.
 */
export abstract class AtomicTransactionBuilder {
  protected readonly _coinConfig: Readonly<CoinConfig>;
  // External chain id (destination) for export transactions
  protected _externalChainId: Buffer | undefined;

  protected _utxos: DecodedUtxoObj[] = [];

  protected transaction: {
    _network: Record<string, unknown>;
    _networkID: number;
    _blockchainID: Buffer;
    _assetId: Buffer;
    _fromAddresses: string[];
    _to: string[];
    _locktime: bigint;
    _threshold: number;
    _fee: { fee: string; feeRate?: string; size?: number };
    hasCredentials: boolean;
    _tx?: unknown;
    setTransaction: (tx: unknown) => void;
  } = {
    _network: {},
    _networkID: 0,
    _blockchainID: Buffer.alloc(0),
    _assetId: Buffer.alloc(0),
    _fromAddresses: [],
    _to: [],
    _locktime: 0n,
    _threshold: 1,
    _fee: { fee: '0' },
    hasCredentials: false,
    setTransaction: function (_tx: unknown) {
      this._tx = _tx;
    },
  };

  constructor(coinConfig: Readonly<CoinConfig>) {
    this._coinConfig = coinConfig;
  }

  protected abstract get transactionType(): TransactionType;

  validateAmount(amount: bigint): void {
    if (amount <= 0n) {
      throw new BuildTransactionError('Amount must be positive');
    }
  }

  /**
   * Validates that credentials array is properly formed
   * @param credentials - Array of credentials to validate
   */
  protected validateCredentials(credentials: Credential[]): void {
    if (!Array.isArray(credentials)) {
      throw new BuildTransactionError('Credentials must be an array');
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
    if (!this._utxos || this._utxos.length === 0) {
      throw new BuildTransactionError('UTXOs are required for creating inputs and outputs');
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

      // TODO: Create proper FlareJS TransferableInput once type issues are resolved
      // For now, we create a placeholder that demonstrates the structure
      // The actual FlareJS integration will need proper UTXOID handling

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

    // TODO: Create change output if we have excess input
    // The TransferableOutput creation will be implemented once FlareJS types are resolved

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
      throw new BuildTransactionError('Signatures must be an array');
    }

    if (signatures.length === 0) {
      throw new BuildTransactionError('Signatures array cannot be empty');
    }

    const sigs = signatures.map((sig, index) => {
      // Handle empty/placeholder signatures
      if (!sig || sig.length === 0) {
        return new Signature(new Uint8Array(SECP256K1_SIGNATURE_LENGTH));
      }

      // Validate hex string format
      const cleanSig = sig.startsWith('0x') ? sig.slice(2) : sig;
      if (!/^[0-9a-fA-F]*$/.test(cleanSig)) {
        throw new BuildTransactionError(`Invalid hex signature at index ${index}: contains non-hex characters`);
      }

      // Convert to buffer and validate length
      const sigBuffer = Buffer.from(cleanSig, 'hex');
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
          `Failed to create signature at index ${index}: ${error instanceof Error ? error.message : 'unknown error'}`
        );
      }
    });

    try {
      return new Credential(sigs);
    } catch (error) {
      throw new BuildTransactionError(
        `Failed to create credential: ${error instanceof Error ? error.message : 'unknown error'}`
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
   * Sign transaction with private key (placeholder implementation)
   * TODO: Implement proper FlareJS signing
   */
  sign(_params: { key: string }): this {
    // TODO: Implement FlareJS signing
    // For now, just mark as having credentials
    this.transaction.hasCredentials = true;
    return this;
  }

  /**
   * Build the transaction (placeholder implementation)
   * TODO: Implement proper FlareJS transaction building
   */
  async build(): Promise<BaseTransaction> {
    // TODO: Create actual FlareJS UnsignedTx
    // For now, return a mock transaction that satisfies the interface
    const mockTransaction = {
      _id: 'mock-transaction-id',
      _inputs: [],
      _outputs: [],
      _type: this.transactionType,
      signature: [] as string[],
      toBroadcastFormat: () => 'mock-tx-hex',
      toJson: () => ({}),
      explainTransaction: (): TransactionExplanation => ({
        type: this.transactionType,
        inputs: [],
        outputs: [],
        outputAmount: '0',
        rewardAddresses: [],
        id: 'mock-transaction-id',
        changeOutputs: [],
        changeAmount: '0',
        fee: { fee: '0' },
      }),
      isTransactionForCChain: false,
      fromAddresses: [],
      validationErrors: [],
      loadInputsAndOutputs: () => {
        /* placeholder */
      },
      inputs: () => [],
      outputs: () => [],
      fee: () => ({ fee: '0' }),
      feeRate: () => 0,
      id: () => 'mock-transaction-id',
      type: this.transactionType,
    } as unknown as BaseTransaction;

    return mockTransaction;
  }

  /**
   * Parse and explain a transaction from hex (placeholder implementation)
   * TODO: Implement proper FlareJS transaction parsing
   */
  explainTransaction(): TransactionExplanation {
    // TODO: Parse actual FlareJS transaction
    // For now, return basic explanation
    return {
      type: this.transactionType,
      inputs: [],
      outputs: [],
      outputAmount: '0',
      rewardAddresses: [],
      id: 'mock-transaction-id',
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: '0' },
    };
  }
}
