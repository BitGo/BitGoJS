/**
 * @prettier
 * ZKsync-specific RPC methods
 */

import { ZKsyncFeeEstimate, BridgeAddresses, ZKsyncTxData } from './types';

/**
 * Interface for ZKsync RPC provider
 */
export interface ZKsyncRpcProvider {
  /**
   * Make a JSON-RPC call
   */
  call(method: string, params: unknown[]): Promise<unknown>;
}

/**
 * ZKsync-specific RPC client
 */
export class ZKsyncRpc {
  constructor(private provider: ZKsyncRpcProvider) {}

  /**
   * Estimate fees for a ZKsync transaction using zks_estimateFee
   * This is more accurate than eth_estimateGas as it includes L1 costs
   *
   * @param transaction The transaction to estimate fees for
   * @returns Fee estimate with gas limit and gas per pubdata limit
   */
  async estimateFee(transaction: Partial<ZKsyncTxData>): Promise<ZKsyncFeeEstimate> {
    try {
      const result = (await this.provider.call('zks_estimateFee', [transaction])) as Record<string, string>;
      return {
        gas_limit: result.gas_limit || result.gasLimit,
        gas_per_pubdata_limit: result.gas_per_pubdata_limit || result.gasPerPubdataLimit,
        max_fee_per_gas: result.max_fee_per_gas || result.maxFeePerGas,
        max_priority_fee_per_gas: result.max_priority_fee_per_gas || result.maxPriorityFeePerGas,
      };
    } catch (error) {
      throw new Error(`ZKsync fee estimation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the current L1 batch number
   * @returns The L1 batch number
   */
  async getL1BatchNumber(): Promise<number> {
    try {
      const result = await this.provider.call('zks_L1BatchNumber', []);
      return typeof result === 'string' ? parseInt(result, 16) : (result as number);
    } catch (error) {
      throw new Error(`Failed to get L1 batch number: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get details of a specific L1 batch
   * @param batchNumber The batch number to query
   * @returns Batch details
   */
  async getL1BatchDetails(batchNumber: number): Promise<Record<string, unknown>> {
    try {
      return (await this.provider.call('zks_getL1BatchDetails', [batchNumber])) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Failed to get L1 batch details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get bridge contract addresses
   * @returns Bridge contract addresses for L1 and L2
   */
  async getBridgeContracts(): Promise<BridgeAddresses> {
    try {
      const result = (await this.provider.call('zks_getBridgeContracts', [])) as Record<string, string>;
      return {
        l1SharedDefaultBridge: result.l1SharedDefaultBridge,
        l2SharedDefaultBridge: result.l2SharedDefaultBridge,
        l1Erc20DefaultBridge: result.l1Erc20DefaultBridge,
        l2Erc20DefaultBridge: result.l2Erc20DefaultBridge,
        l1WethBridge: result.l1WethBridge,
        l2WethBridge: result.l2WethBridge,
      };
    } catch (error) {
      throw new Error(`Failed to get bridge contracts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get confirmed tokens (tokens that have been verified on ZKsync)
   * @param from Starting index
   * @param limit Number of tokens to return
   * @returns List of confirmed token addresses and metadata
   */
  async getConfirmedTokens(from = 0, limit = 100): Promise<Array<Record<string, unknown>>> {
    try {
      return (await this.provider.call('zks_getConfirmedTokens', [from, limit])) as Array<Record<string, unknown>>;
    } catch (error) {
      throw new Error(`Failed to get confirmed tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get token price in USD
   * @param tokenAddress The token address
   * @returns Token price in USD
   */
  async getTokenPrice(tokenAddress: string): Promise<string> {
    try {
      return (await this.provider.call('zks_getTokenPrice', [tokenAddress])) as string;
    } catch (error) {
      throw new Error(`Failed to get token price: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the main contract address (the ZKsync contract on L1)
   * @returns Main contract address on L1
   */
  async getMainContract(): Promise<string> {
    try {
      return (await this.provider.call('zks_getMainContract', [])) as string;
    } catch (error) {
      throw new Error(`Failed to get main contract: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get testnet paymaster address (if available)
   * This is useful for testing on testnet
   * @returns Paymaster address
   */
  async getTestnetPaymaster(): Promise<string | null> {
    try {
      return (await this.provider.call('zks_getTestnetPaymaster', [])) as string | null;
    } catch (error) {
      // Paymaster might not be available on mainnet
      return null;
    }
  }

  /**
   * Get transaction details including L1 batch info
   * @param txHash Transaction hash
   * @returns Transaction details with ZKsync-specific fields
   */
  async getTransactionDetails(txHash: string): Promise<Record<string, unknown>> {
    try {
      return (await this.provider.call('zks_getTransactionDetails', [txHash])) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Failed to get transaction details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get raw block transactions
   * @param blockNumber Block number
   * @returns Raw transactions in the block
   */
  async getRawBlockTransactions(blockNumber: number): Promise<Array<Record<string, unknown>>> {
    try {
      return (await this.provider.call('zks_getRawBlockTransactions', [blockNumber])) as Array<Record<string, unknown>>;
    } catch (error) {
      throw new Error(
        `Failed to get raw block transactions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get L1 gas price
   * @returns L1 gas price in wei
   */
  async getL1GasPrice(): Promise<string> {
    try {
      return (await this.provider.call('zks_getL1GasPrice', [])) as string;
    } catch (error) {
      throw new Error(`Failed to get L1 gas price: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get fee parameters for the protocol
   * @returns Fee params including L1 gas price, compute overhead, etc.
   */
  async getFeeParams(): Promise<Record<string, unknown>> {
    try {
      return (await this.provider.call('zks_getFeeParams', [])) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Failed to get fee params: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get protocol version
   * @returns Protocol version information
   */
  async getProtocolVersion(): Promise<Record<string, unknown>> {
    try {
      return (await this.provider.call('zks_getProtocolVersion', [])) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Failed to get protocol version: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Create a ZKsync RPC client with a custom provider
 * @param provider RPC provider implementation
 * @returns ZKsync RPC client
 */
export function createZKsyncRpc(provider: ZKsyncRpcProvider): ZKsyncRpc {
  return new ZKsyncRpc(provider);
}
