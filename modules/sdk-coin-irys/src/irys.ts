import { BaseCoin, BitGoBase, MPCAlgorithm } from '@bitgo/sdk-core';
import { AbstractEthLikeNewCoins } from '@bitgo/abstract-eth';
import { CoinFeature, BaseCoin as StaticsBaseCoin, coins, EthereumNetwork } from '@bitgo/statics';
import { IrysCommitmentTransactionBuilder, TransactionBuilder } from './lib';

/**
 * Irys coin implementation.
 *
 * Irys is EVM-compatible for standard transfers (inherits from AbstractEthLikeNewCoins)
 * but uses custom commitment transactions for staking (STAKE, PLEDGE, etc.).
 *
 * Standard EVM operations (transfers, balance queries) use the inherited EVM logic.
 * Commitment transactions use the IrysCommitmentTransactionBuilder.
 */
export class Irys extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Irys(bitgo, staticsCoin);
  }

  /**
   * Irys supports TSS (from EVM_FEATURES in statics).
   */
  supportsTss(): boolean {
    return this.staticsCoin?.features.includes(CoinFeature.TSS) ?? false;
  }

  /** @inheritdoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /**
   * Get the Irys native API URL from the network config.
   * This is the non-EVM API used for commitment transactions.
   */
  getIrysApiUrl(): string | undefined {
    const network = this.getNetwork() as EthereumNetwork;
    return network.irysApiUrl;
  }

  /**
   * Create a commitment transaction builder for staking operations.
   * This is separate from getTransactionBuilder() which handles standard EVM transfers.
   */
  getCommitmentTransactionBuilder(): IrysCommitmentTransactionBuilder {
    const apiUrl = this.getIrysApiUrl();
    if (!apiUrl) {
      throw new Error('Irys API URL is not configured for this network');
    }
    return new IrysCommitmentTransactionBuilder(apiUrl, BigInt(this.getChainId()));
  }

  /**
   * Create a new transaction builder for standard EVM transactions.
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }
}
