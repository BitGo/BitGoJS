/**
 * @prettier
 */
import {
  AbstractEthLikeNewCoins,
  RecoverOptions,
  OfflineVaultTxInfo,
  UnsignedSweepTxMPCv2,
  TransactionBuilder,
  VerifyEthTransactionOptions,
  VerifyEthAddressOptions,
  TssVerifyEthAddressOptions,
  optionalDeps,
} from '@bitgo/abstract-eth';
import type * as EthLikeCommon from '@ethereumjs/common';
import {
  BaseCoin,
  BitGoBase,
  InvalidAddressError,
  InvalidMemoIdError,
  MPCAlgorithm,
  ParseTransactionOptions,
  ParsedTransaction,
  UnexpectedAddressError,
  PopulatedIntent,
  PrebuildTransactionWithIntentOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Tip20Transaction, Tip20TransactionBuilder } from './lib';
import { amountToTip20Units, isTip20Transaction, isValidMemoId as isValidMemoIdUtil } from './lib/utils';
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
    return isValidMemoIdUtil(memoId);
  }

  /**
   * Tempo uses memoId-based addresses rather than forwarder contracts.
   * Verify that the address belongs to this wallet by checking that the
   * base (EVM) portion matches the wallet's base address.
   */
  async isWalletAddress(params: VerifyEthAddressOptions | TssVerifyEthAddressOptions): Promise<boolean> {
    const { address, baseAddress } = params;
    const rootAddress = (params as unknown as Record<string, unknown>).rootAddress as string | undefined;

    if (!address) {
      throw new InvalidAddressError('address is required');
    }

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    const { baseAddress: addressBase } = this.getAddressDetails(address);

    const walletBaseAddress = baseAddress || rootAddress;
    if (!walletBaseAddress) {
      throw new InvalidAddressError('baseAddress or rootAddress is required for verification');
    }

    const { baseAddress: walletBase } = this.getAddressDetails(walletBaseAddress);

    if (addressBase.toLowerCase() !== walletBase.toLowerCase()) {
      throw new UnexpectedAddressError(`address validation failure: expected ${walletBase} but got ${addressBase}`);
    }

    return true;
  }

  /**
   * Parse a serialised Tempo transaction and return its operations as SDK outputs.
   * @inheritdoc
   */
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    const txHex = (params.txHex || (params as any).halfSigned?.txHex) as string | undefined;
    if (!txHex) {
      return {};
    }
    if (!isTip20Transaction(txHex)) {
      return {};
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = (await txBuilder.build()) as Tip20Transaction;
    return {
      inputs: tx.inputs.map((input) => ({
        address: input.address,
        amount: input.value,
        coin: this.getChain(),
      })),
      outputs: tx.outputs.map((output) => ({
        address: output.address,
        amount: output.value,
        coin: this.getChain(),
      })),
    };
  }

  /**
   * Verify that a Tempo transaction matches the intended recipients and amounts.
   * @inheritdoc
   */
  async verifyTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild } = params;

    if (!txPrebuild?.txHex) {
      return true;
    }

    // signableHex may arrive without the 0x prefix (e.g. from the TSS signing flow).
    const txHex = txPrebuild.txHex.startsWith('0x') ? txPrebuild.txHex : '0x' + txPrebuild.txHex;
    if (!isTip20Transaction(txHex)) {
      throw new Error(`Invalid Tempo transaction hex: expected a 0x76 TIP-20 transaction`);
    }

    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = (await txBuilder.build()) as Tip20Transaction;
    const operations = tx.getOperations();

    // If the caller specified explicit recipients, verify they match the operations 1-to-1
    const recipients = txParams?.recipients;
    if (recipients && recipients.length > 0) {
      if (operations.length !== recipients.length) {
        throw new Error(
          `Transaction has ${operations.length} operation(s) but ${recipients.length} recipient(s) were requested`
        );
      }
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const recipient = recipients[i];
        const recipientBaseAddress = recipient.address.split('?')[0];
        if (op.to.toLowerCase() !== recipientBaseAddress.toLowerCase()) {
          throw new Error(`Operation ${i} recipient mismatch: expected ${recipient.address}, got ${op.to}`);
        }
        // Compare amounts in base units (smallest denomination)
        const opAmountBaseUnits = amountToTip20Units(op.amount).toString();
        if (opAmountBaseUnits !== recipient.amount.toString()) {
          throw new Error(`Operation ${i} amount mismatch: expected ${recipient.amount}, got ${opAmountBaseUnits}`);
        }
      }
    }

    // Verify fee token if specified
    if (txParams?.feeToken) {
      const txFeeToken = tx.getFeeToken();
      if (txFeeToken?.toLowerCase() !== txParams.feeToken.toLowerCase()) {
        throw new Error(`Fee token mismatch: expected ${txParams.feeToken}, got ${txFeeToken || 'none'}`);
      }
    }

    return true;
  }

  /**
   * Set coin-specific fields in the intent for Tempo TSS transactions.
   * Ensures feeToken is properly wired through the intent for Tempo transactions.
   * @param intent - The populated intent to modify
   * @param params - The parameters containing feeToken
   */
  setCoinSpecificFieldsInIntent(intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions): void {
    if (params.feeToken) {
      intent.feeOptions = intent.feeOptions
        ? { ...intent.feeOptions, feeToken: params.feeToken }
        : { feeToken: params.feeToken };
    }
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
