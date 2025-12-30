/**
 * @prettier
 */
import {
  AbstractEthLikeNewCoins,
  RecoverOptions,
  OfflineVaultTxInfo,
  UnsignedSweepTxMPCv2,
  TransactionBuilder,
} from '@bitgo/abstract-eth';
import { BaseCoin, BitGoBase, MPCAlgorithm } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Tempo extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  /**
   * Factory method to create Tempo instance
   */
  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tempo(bitgo, staticsCoin);
  }

  /**
   * Get the chain identifier
   */
  getChain(): string {
    return this._staticsCoin?.name || 'tempo';
  }

  /**
   * Get the full chain name
   */
  getFullName(): string {
    return 'Tempo';
  }

  /**
   * Get the base factor (1 TEMPO = 1e18 wei, like Ethereum)
   */
  getBaseFactor(): number {
    return 1e18;
  }

  /**
   * Check if value-less transfers are allowed
   * TODO: Update based on Tempo requirements
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Check if TSS is supported
   */
  supportsTss(): boolean {
    return true;
  }

  /**
   * Get the MPC algorithm (ECDSA for EVM chains)
   */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /**
   * Check if message signing is supported
   */
  supportsMessageSigning(): boolean {
    return true;
  }

  /**
   * Check if typed data signing is supported (EIP-712)
   */
  supportsSigningTypedData(): boolean {
    return true;
  }

  /**
   * Build unsigned sweep transaction for TSS
   * TODO: Implement sweep transaction logic
   */
  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    // TODO: Implement when recovery logic is needed
    // Return dummy value to prevent downstream services from breaking
    return {} as OfflineVaultTxInfo;
  }

  /**
   * Query block explorer for recovery information
   * TODO: Implement when Tempo block explorer is available
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    // TODO: Implement with Tempo block explorer API
    // Return empty object to prevent downstream services from breaking
    return {};
  }

  /**
   * Get transaction builder for Tempo
   * TODO: Implement TransactionBuilder for Tempo
   * @protected
   */
  protected getTransactionBuilder(): TransactionBuilder {
    // TODO: Create and return TransactionBuilder instance
    // Return undefined cast as TransactionBuilder to prevent downstream services from breaking
    return undefined as unknown as TransactionBuilder;
  }
}
