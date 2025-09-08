import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';

/**
 * Minimal placeholder for Flare P-chain atomic transaction building.
 * This will be expanded with proper Flare P-chain logic (inputs/outputs/credentials, UTXO handling, fees, etc.).
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
   * Placeholder that should assemble inputs/outputs and credentials once UTXO + key logic is implemented.
   */
  protected createInputOutput(_total: bigint): { inputs: unknown[]; outputs: unknown[]; credentials: unknown[] } {
    return { inputs: [], outputs: [], credentials: [] };
  }

  /**
   * Base initBuilder used by concrete builders. For now just returns this so fluent API works.
   */
  initBuilder(_tx: unknown): this {
    return this;
  }
}
