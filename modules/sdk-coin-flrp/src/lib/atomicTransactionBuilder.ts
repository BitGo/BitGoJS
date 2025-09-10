import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Credential, Signature } from '@flarenetwork/flarejs';

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

  // Simplified internal transaction state (mirrors shape expected by existing builders)
  // Simplified internal transaction state
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
   * Placeholder that should assemble inputs/outputs and credentials once UTXO + key logic is implemented.
   */
  protected createInputOutput(_total: bigint): { inputs: unknown[]; outputs: unknown[]; credentials: Credential[] } {
    return { inputs: [], outputs: [], credentials: [] };
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
}
