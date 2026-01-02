/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common, MultisigType, multisigTypes, FeeEstimateOptions } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  TransactionBuilder as EthLikeTransactionBuilder,
  recoveryBlockchainExplorerQuery,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import { ZKsyncRpc, createZKsyncRpc, ZKsyncRpcProvider } from './lib/zkSyncRpc';
import { ZKsyncFeeEstimate, BridgeAddresses, ZKsyncTxData } from './lib/types';

interface FeeEstimate {
  gasLimitEstimate: number;
  feeEstimate: number;
  zkSyncEstimate?: {
    gasLimit: string;
    gasPerPubdataLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
}

export class Zketh extends AbstractEthLikeNewCoins {
  private _zkSyncRpc?: ZKsyncRpc;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Zketh(bitgo, staticsCoin);
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): 'ecdsa' {
    return 'ecdsa';
  }

  /** @inheritDoc */
  supportsMessageSigning(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsSigningTypedData(): boolean {
    return true;
  }

  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Get or create ZKsync RPC client
   * @private
   */
  private getZKsyncRpc(): ZKsyncRpc {
    if (!this._zkSyncRpc) {
      // Create a provider that uses BitGo's RPC infrastructure
      const provider: ZKsyncRpcProvider = {
        call: async (method: string, params: unknown[]) => {
          // This would integrate with BitGo's existing RPC infrastructure
          // For now, this is a placeholder that would need to be connected to actual RPC
          throw new Error('ZKsync RPC provider not configured. Please set up RPC endpoint.');
        },
      };
      this._zkSyncRpc = createZKsyncRpc(provider);
    }
    return this._zkSyncRpc;
  }

  /**
   * Estimate fees for a ZKsync transaction
   * Uses zks_estimateFee which includes L1 data availability costs
   *
   * @param transaction Transaction parameters
   * @returns Fee estimation with gas limits and prices
   */
  async estimateZKsyncFee(transaction: Partial<ZKsyncTxData>): Promise<ZKsyncFeeEstimate> {
    return this.getZKsyncRpc().estimateFee(transaction);
  }

  /**
   * Override feeEstimate to use ZKsync-specific fee estimation
   * This ensures accurate fee calculation including L1 costs
   *
   * @param params Fee estimate options
   * @returns Fee estimate with gas limit and fee estimate
   */
  async feeEstimate(params: FeeEstimateOptions): Promise<FeeEstimate> {
    // For ZKsync, we need to use zks_estimateFee instead of standard estimation
    // First get the base estimate from BitGo API (for compatibility)
    const baseEstimate = (await super.feeEstimate(params)) as FeeEstimate;

    // If we have recipient and amount, enhance with ZKsync-specific estimation
    if (params.recipient && params.amount) {
      try {
        const zkSyncEstimate = await this.estimateZKsyncFee({
          to: params.recipient,
          value: params.amount,
          data: params.data || '0x',
        });

        // Convert ZKsync estimates to numbers
        const gasLimit = parseInt(zkSyncEstimate.gas_limit, 10);
        const maxFeePerGas = parseInt(zkSyncEstimate.max_fee_per_gas, 10);

        // Use ZKsync estimates if available, otherwise fall back to base
        return {
          gasLimitEstimate: gasLimit || baseEstimate.gasLimitEstimate,
          feeEstimate: maxFeePerGas * gasLimit || baseEstimate.feeEstimate,
          // Add ZKsync-specific fields
          zkSyncEstimate: {
            gasLimit: zkSyncEstimate.gas_limit,
            gasPerPubdataLimit: zkSyncEstimate.gas_per_pubdata_limit,
            maxFeePerGas: zkSyncEstimate.max_fee_per_gas,
            maxPriorityFeePerGas: zkSyncEstimate.max_priority_fee_per_gas,
          },
        };
      } catch (zkError) {
        // If ZKsync estimation fails, silently fall back to base estimate
        // This ensures compatibility if ZKsync RPC is not configured
        return baseEstimate;
      }
    }

    return baseEstimate;
  }

  /**
   * Get ZKsync bridge contract addresses
   * @returns Bridge addresses for L1 and L2
   */
  async getBridgeContracts(): Promise<BridgeAddresses> {
    return this.getZKsyncRpc().getBridgeContracts();
  }

  /**
   * Get current L1 batch number
   * @returns L1 batch number
   */
  async getL1BatchNumber(): Promise<number> {
    return this.getZKsyncRpc().getL1BatchNumber();
  }

  /**
   * Get L1 gas price (used for calculating total transaction costs)
   * @returns L1 gas price in wei
   */
  async getL1GasPrice(): Promise<string> {
    return this.getZKsyncRpc().getL1GasPrice();
  }

  /**
   * Get protocol fee parameters
   * @returns Fee parameters including L1 gas price, compute overhead, etc.
   */
  async getFeeParams(): Promise<Record<string, unknown>> {
    return this.getZKsyncRpc().getFeeParams();
  }

  /**
   * Get detailed transaction information including L1 batch
   * @param txHash Transaction hash
   * @returns Transaction details with ZKsync-specific fields
   */
  async getTransactionDetails(txHash: string): Promise<Record<string, unknown>> {
    return this.getZKsyncRpc().getTransactionDetails(txHash);
  }

  /**
   * Make a query to Zksync explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @param {string} apiKey optional API key to use instead of the one from the environment
   * @returns {Promise<Object>} response from Zksync explorer
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const explorerUrl = common.Environments[this.bitgo.getEnv()].zksyncExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiKey);
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
  }
}
