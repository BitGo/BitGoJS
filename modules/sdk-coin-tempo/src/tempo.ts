/**
 * @prettier
 */
import {
  AbstractEthLikeNewCoins,
  RecoverOptions,
  OfflineVaultTxInfo,
  UnsignedSweepTxMPCv2,
  TransactionBuilder,
  optionalDeps,
} from '@bitgo/abstract-eth';
import type * as EthLikeCommon from '@ethereumjs/common';
import { BaseCoin, BitGoBase, InvalidAddressError, InvalidMemoIdError, MPCAlgorithm } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Tip20TransactionBuilder } from './lib';
import * as url from 'url';
import * as querystring from 'querystring';

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

  /** @inheritdoc */
  getBaseFactor(): number {
    return 1e6;
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
   * Evaluates whether an address string is valid for Tempo
   * Supports addresses with optional memoId query parameter (e.g., 0x...?memoId=123)
   * @param address - The address to validate
   * @returns true if address is valid
   */
  isValidAddress(address: string): boolean {
    if (typeof address !== 'string') {
      return false;
    }

    try {
      const { baseAddress } = this.getAddressDetails(address);
      return optionalDeps.ethUtil.isValidAddress(optionalDeps.ethUtil.addHexPrefix(baseAddress));
    } catch (e) {
      return false;
    }
  }

  /**
   * Parse address into base address and optional memoId
   * Throws InvalidAddressError for invalid address formats
   * @param address - Address string, potentially with ?memoId=X suffix
   * @returns Object containing address, baseAddress, and memoId (null if not present)
   * @throws InvalidAddressError if address format is invalid
   */
  getAddressDetails(address: string): { address: string; baseAddress: string; memoId: string | null } {
    if (typeof address !== 'string') {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const destinationDetails = url.parse(address);
    const baseAddress = destinationDetails.pathname || '';

    // No query string - just a plain address
    if (destinationDetails.pathname === address) {
      return {
        address,
        baseAddress: address,
        memoId: null,
      };
    }

    // Has query string - must contain memoId
    if (!destinationDetails.query) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const queryDetails = querystring.parse(destinationDetails.query);

    // Query string must contain memoId
    if (!queryDetails.memoId) {
      throw new InvalidAddressError(`invalid address: ${address}, unknown query parameters`);
    }

    // Only one memoId allowed
    if (Array.isArray(queryDetails.memoId)) {
      throw new InvalidAddressError(
        `memoId may only be given at most once, but found ${queryDetails.memoId.length} instances in address ${address}`
      );
    }

    // Reject if there are other query parameters besides memoId
    const queryKeys = Object.keys(queryDetails);
    if (queryKeys.length !== 1) {
      throw new InvalidAddressError(`invalid address: ${address}, only memoId query parameter is allowed`);
    }

    // Validate memoId format
    if (!this.isValidMemoId(queryDetails.memoId)) {
      throw new InvalidMemoIdError(`invalid address: '${address}', memoId is not valid`);
    }

    return {
      address,
      baseAddress,
      memoId: queryDetails.memoId,
    };
  }

  /**
   * Validate that a memoId is a valid non-negative integer string
   * @param memoId - The memoId to validate
   * @returns true if valid
   */
  isValidMemoId(memoId: string): boolean {
    if (typeof memoId !== 'string' || memoId === '') {
      return false;
    }
    // Must be a non-negative integer (no decimals, no negative, no leading zeros except for "0")
    if (!/^(0|[1-9]\d*)$/.test(memoId)) {
      return false;
    }
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
   * Returns a TIP-20 transaction builder for Tempo-specific operations
   * @param common - Optional common chain configuration
   * @protected
   */
  protected getTransactionBuilder(common?: EthLikeCommon.default): TransactionBuilder {
    return new Tip20TransactionBuilder(coins.get(this.getBaseChain())) as unknown as TransactionBuilder;
  }
}
