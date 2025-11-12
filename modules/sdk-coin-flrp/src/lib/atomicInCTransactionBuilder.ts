import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';

// interface FlareChainNetworkMeta {
//   blockchainID?: string; // P-chain id (external)
//   cChainBlockchainID?: string; // C-chain id (local)
//   [k: string]: unknown;
// }

interface FeeShape {
  fee?: string; // legacy
  feeRate?: string; // per unit rate
}

/**
 * Flare P->C atomic import/export style builder (C-chain context). This adapts the AVAXP logic
 * removing direct Avalanche SDK dependencies. Network / chain ids are expected to be provided
 * in the transaction._network object by a higher-level factory once Flare network constants
 * are finalized. For now we CB58-decode placeholders if present and default to zero buffers.
 */
export abstract class AtomicInCTransactionBuilder extends AtomicTransactionBuilder {
  // Placeholder fixed fee (can be overridden by subclasses or network config)
  protected fixedFee = 0n;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.initializeChainIds();
  }

  /**
   * Set base fee (already scaled to Flare C-chain native decimals). Accept bigint | number | string.
   */
  feeRate(baseFee: bigint | number | string): this {
    const n = typeof baseFee === 'bigint' ? baseFee : BigInt(baseFee);
    this.validateFee(n);
    this.setFeeRate(n);
    return this;
  }

  /**
   * Recreate builder state from raw tx (hex). Flare C-chain support TBD; for now validate & stash.
   */
  protected fromImplementation(rawTransaction: string): Transaction {
    // If utils has validateRawTransaction use it; otherwise basic check
    if ((utils as unknown as { validateRawTransaction?: (r: string) => void }).validateRawTransaction) {
      (utils as unknown as { validateRawTransaction: (r: string) => void }).validateRawTransaction(rawTransaction);
    }
    // this.transaction.setTransaction(rawTransaction);
    return this.transaction;
  }

  private validateFee(fee: bigint): void {
    if (fee <= 0n) {
      throw new BuildTransactionError('Fee must be greater than 0');
    }
  }

  private initializeChainIds(): void {
    this._externalChainId = utils.cb58Decode(this._network.blockchainID);
    this._blockchainID = utils.cb58Decode(this._network.cChainBlockchainID);
  }

  private setFeeRate(n: bigint): void {
    const currentContainer = this.transaction as unknown as { _fee: FeeShape };
    const current = currentContainer._fee || { fee: '0' };
    currentContainer._fee = { ...current, feeRate: n.toString() };
  }
}
