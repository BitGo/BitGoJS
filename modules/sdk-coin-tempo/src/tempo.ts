/**
 * @prettier
 */
import {
  AbstractEthLikeNewCoins,
  EIP1559,
  RecoverOptions,
  RecoveryInfo,
  OfflineVaultTxInfo,
  UnsignedSweepTxMPCv2,
  TransactionBuilder,
  VerifyEthTransactionOptions,
  VerifyEthAddressOptions,
  TssVerifyEthAddressOptions,
  optionalDeps,
} from '@bitgo/abstract-eth';
import type * as EthLikeCommon from '@ethereumjs/common';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';
import {
  BaseCoin,
  BitGoBase,
  common,
  Ecdsa,
  ECDSAUtils,
  getIsUnsignedSweep,
  InvalidAddressError,
  InvalidMemoIdError,
  MPCAlgorithm,
  MPCSweepRecoveryOptions,
  MPCTx,
  MPCTxs,
  ParseTransactionOptions,
  ParsedTransaction,
  Recipient,
  ReplayProtectionOptions,
  UnexpectedAddressError,
  UnsignedTransactionTss,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { ethers } from 'ethers';
import { KeyPair as KeyPairLib, Tip20Transaction, Tip20TransactionBuilder } from './lib';
import type { TempoRecoveryOptions } from './lib/iface';
import {
  amountToTip20Units,
  getTempoAddressNonce,
  getTempoRpcUrlForBaseChain,
  isTip20Transaction,
  isValidMemoId as isValidMemoIdUtil,
  queryTip20TokenBalance,
  tip20UnitsToAmount,
} from './lib/utils';
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

    return true;
  }

  /** @inheritdoc */
  async recover(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    if (params.bitgoFeeAddress) {
      throw new Error('EVM cross-chain recovery is not supported for Tempo');
    }
    if (!params.isTss) {
      throw new Error('Tempo recovery requires TSS (set isTss: true)');
    }
    if (!this.resolveTokenContractAddressForRecovery(params)) {
      throw new Error('tokenContractAddress is required for Tempo recovery - Tempo has no native asset');
    }
    return super.recover(params);
  }

  /**
   * Resolves TIP-20 token contract for recovery. Subclasses (e.g. {@link Tip20Token}) may default this.
   */
  protected resolveTokenContractAddressForRecovery(params: RecoverOptions): string | undefined {
    const raw = params.tokenContractAddress?.replace(/\s/g, '').toLowerCase();
    return raw && raw.length > 0 ? raw : undefined;
  }

  /**
   * @inheritdoc
   * Tempo TSS recovery sweeps TIP-20 via type 0x76 transactions (native balance is unused).
   */
  protected async recoverTSS(
    params: RecoverOptions
  ): Promise<RecoveryInfo | OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    this.validateRecoveryParams(params);
    const userPublicOrPrivateKeyShare = params.userKey.replace(/\s/g, '');
    const backupPrivateOrPublicKeyShare = params.backupKey.replace(/\s/g, '');

    if (
      getIsUnsignedSweep({
        userKey: userPublicOrPrivateKeyShare,
        backupKey: backupPrivateOrPublicKeyShare,
        isTss: params.isTss,
      })
    ) {
      return this.buildUnsignedSweepTxnTSS(params);
    }

    this.assertTempoRecoveryEip1559(params);
    const token = this.resolveTokenContractAddressForRecovery(params);
    if (!token) {
      throw new Error('tokenContractAddress is required for Tempo recovery - Tempo has no native asset');
    }

    const { userKeyShare, backupKeyShare, commonKeyChain } = await ECDSAUtils.getMpcV2RecoveryKeyShares(
      userPublicOrPrivateKeyShare,
      backupPrivateOrPublicKeyShare,
      params.walletPassphrase
    );

    const { gasLimit, maxFeePerGas, maxPriorityFeePerGas } = this.getTempoRecoveryGasValues(params);
    const gasLimitBi = BigInt(gasLimit);
    const maxCost = gasLimitBi * maxFeePerGas;

    const rpcUrl = this.resolveTempoRpcUrl(params);
    const walletBase = this.getAddressDetails(params.walletContractAddress).baseAddress;
    const feeToken = this.resolveFeeTokenAddress(params, token);

    const mpc = new Ecdsa();
    const derivedCommonKeyChain = mpc.deriveUnhardened(commonKeyChain, 'm/0');
    const derivedKeyPair = new KeyPairLib({ pub: derivedCommonKeyChain.slice(0, 66) });
    const derivedAddress = derivedKeyPair.getAddress();
    if (derivedAddress.toLowerCase() !== walletBase.toLowerCase()) {
      throw new Error('walletContractAddress does not match derived TSS address');
    }

    const { sweepAmount } = await this.validateTip20SweepAmounts(rpcUrl, walletBase, token, feeToken, maxCost);

    const nonce = await getTempoAddressNonce(rpcUrl, walletBase);
    const tip20Tx = await this.buildRecoveryTip20Transaction({
      tokenContractAddress: token,
      feeTokenAddress: feeToken,
      sweepAmount,
      recoveryDestination: params.recoveryDestination,
      nonce,
      gasLimit: gasLimitBi,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    const unsignedHex = await tip20Tx.serialize();
    const messageHash = Buffer.from(ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(unsignedHex))));
    const signature = await ECDSAUtils.signRecoveryMpcV2(messageHash, userKeyShare, backupKeyShare, commonKeyChain);
    tip20Tx.setSignature(this.mpcSignatureToTip20Sig(signature));

    return {
      id: tip20Tx.id,
      tx: await tip20Tx.toBroadcastFormat(),
    };
  }

  /**
   * JSON-RPC backed queries for WRW (Etherscan-shaped responses for abstract-eth helpers).
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const rpcUrl = this.resolveRpcUrlFromApiKey(apiKey);

    if (query.module === 'account' && query.action === 'tokenbalance') {
      const bal = await queryTip20TokenBalance(rpcUrl, query.contractaddress, query.address);
      return { result: bal.toString() };
    }

    if (query.module === 'account' && query.action === 'balance') {
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const wei = await provider.getBalance(query.address, 'latest');
      return { result: wei.toString() };
    }

    if (query.module === 'account' && query.action === 'txlist') {
      const nonce = await getTempoAddressNonce(rpcUrl, query.address);
      return { nonce };
    }

    throw new Error(`Unsupported Tempo recovery query: ${query.module}/${query.action}`);
  }

  /**
   * @inheritdoc
   * Unsigned WRW sweep: MPCv2 tx request with 0x76 serialized tx and keccak256(unsigned) as signable hex.
   */
  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    this.assertTempoRecoveryEip1559(params);
    this.validateUnsignedSweepForMpcV2(params);

    const token = this.resolveTokenContractAddressForRecovery(params);
    if (!token) {
      throw new Error('tokenContractAddress is required for Tempo recovery - Tempo has no native asset');
    }

    const { gasLimit, maxFeePerGas, maxPriorityFeePerGas } = this.getTempoRecoveryGasValues(params);
    const gasLimitBi = BigInt(gasLimit);
    const maxCost = gasLimitBi * maxFeePerGas;

    const rpcUrl = this.resolveTempoRpcUrl(params);
    const walletBase = this.getAddressDetails(params.walletContractAddress).baseAddress;
    const feeToken = this.resolveFeeTokenAddress(params, token);

    const { sweepAmount } = await this.validateTip20SweepAmounts(rpcUrl, walletBase, token, feeToken, maxCost);

    const nonce = await getTempoAddressNonce(rpcUrl, walletBase);
    const tip20Tx = await this.buildRecoveryTip20Transaction({
      tokenContractAddress: token,
      feeTokenAddress: feeToken,
      sweepAmount,
      recoveryDestination: params.recoveryDestination,
      nonce,
      gasLimit: gasLimitBi,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    const unsignedHex = await tip20Tx.serialize();
    const txInfo = {
      recipient: {
        address: params.recoveryDestination,
        amount: sweepAmount.toString(),
      } as Recipient,
      expireTime: this.getDefaultExpireTime(),
      gasLimit: gasLimit.toString(),
    };

    const backupKey = params.backupKey.replace(/\s/g, '');
    const derivationPath = params.derivationSeed ? getDerivationPath(params.derivationSeed) : 'm/0';

    return this.buildTempoTxRequestForOfflineVaultMPCv2(
      txInfo,
      tip20Tx,
      unsignedHex,
      derivationPath,
      nonce,
      gasLimit,
      params.eip1559!,
      params.replayProtectionOptions,
      backupKey
    );
  }

  /** @inheritdoc */
  async createBroadcastableSweepTransaction(params: MPCSweepRecoveryOptions): Promise<MPCTxs> {
    const first = params.signatureShares[0]?.txRequest?.transactions?.[0]?.unsignedTx;
    if (first && (first as any).coinSpecific?.tempoTip20Recovery === true) {
      return this.createBroadcastableTempoTip20SweepTransaction(params);
    }
    return super.createBroadcastableSweepTransaction(params);
  }

  private validateUnsignedSweepForMpcV2(params: RecoverOptions): void {
    if (!params.backupKey?.replace(/\s/g, '')) {
      throw new Error('missing commonKeyChain');
    }
    if (params.derivationSeed !== undefined && typeof params.derivationSeed !== 'string') {
      throw new Error('invalid derivationSeed');
    }
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('missing or invalid destinationAddress');
    }
  }

  private assertTempoRecoveryEip1559(params: RecoverOptions): asserts params is RecoverOptions & {
    eip1559: EIP1559;
  } {
    if (
      params.eip1559 === undefined ||
      params.eip1559.maxFeePerGas === undefined ||
      params.eip1559.maxPriorityFeePerGas === undefined
    ) {
      throw new Error('eip1559.maxFeePerGas and eip1559.maxPriorityFeePerGas are required for Tempo recovery');
    }
  }

  private getTempoRecoveryGasValues(params: RecoverOptions): {
    gasLimit: number;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  } {
    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit)).toNumber();
    this.assertTempoRecoveryEip1559(params);
    return {
      gasLimit,
      maxFeePerGas: BigInt(params.eip1559.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(params.eip1559.maxPriorityFeePerGas),
    };
  }

  /**
   * Default JSON-RPC URL: `common.Environments[env].evm.tempo|ttempo.rpcUrl`, then coin-local fallback.
   * Statics network objects carry explorer links only, not RPC; final fallback uses `TEMPO_RPC_URLS` in `lib/constants`.
   */
  private resolveDefaultRpcUrl(): string {
    const evm = common.Environments[this.bitgo.getEnv()]?.evm;
    const chainKey = this.getBaseChain() === 'ttempo' ? 'ttempo' : 'tempo';
    const rpcUrl = evm?.[chainKey]?.rpcUrl;
    if (typeof rpcUrl === 'string' && rpcUrl.startsWith('http')) {
      return rpcUrl.trim();
    }
    return getTempoRpcUrlForBaseChain(this.getBaseChain());
  }

  private resolveRpcUrlFromApiKey(apiKey?: string): string {
    if (apiKey?.startsWith('http')) {
      return apiKey.trim();
    }
    return this.resolveDefaultRpcUrl();
  }

  private resolveTempoRpcUrl(params: RecoverOptions): string {
    const extra = params as TempoRecoveryOptions;
    if (extra.rpcUrl?.startsWith('http')) {
      return extra.rpcUrl.trim();
    }
    return this.resolveRpcUrlFromApiKey(params.apiKey);
  }

  private resolveFeeTokenAddress(params: RecoverOptions, tokenContractAddress: string): string {
    const fee = (params as TempoRecoveryOptions).feeTokenAddress?.replace(/\s/g, '').toLowerCase();
    return fee && fee.length > 0 ? fee : tokenContractAddress;
  }

  private async validateTip20SweepAmounts(
    rpcUrl: string,
    walletBase: string,
    token: string,
    feeToken: string,
    maxCost: bigint
  ): Promise<{ sweepAmount: bigint }> {
    const tokenLc = token.toLowerCase();
    const feeLc = feeToken.toLowerCase();
    const tokenBalance = await queryTip20TokenBalance(rpcUrl, token, walletBase);
    if (tokenBalance === 0n) {
      throw new Error('Did not find address with funds to recover');
    }

    if (feeLc === tokenLc) {
      if (tokenBalance <= maxCost) {
        throw new Error('Not enough token funds to recover');
      }
      return { sweepAmount: tokenBalance - maxCost };
    }

    const feeBal = await queryTip20TokenBalance(rpcUrl, feeToken, walletBase);
    if (feeBal < maxCost) {
      throw new Error('Not enough fee token balance to recover');
    }
    return { sweepAmount: tokenBalance };
  }

  private async buildRecoveryTip20Transaction(args: {
    tokenContractAddress: string;
    feeTokenAddress: string;
    sweepAmount: bigint;
    recoveryDestination: string;
    nonce: number;
    gasLimit: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }): Promise<Tip20Transaction> {
    const { baseAddress: destBase, memoId } = this.getAddressDetails(args.recoveryDestination);
    const amountStr = tip20UnitsToAmount(args.sweepAmount);

    const builder = new Tip20TransactionBuilder(coins.get(this.getBaseChain()));
    builder.nonce(args.nonce);
    builder.gas(args.gasLimit.toString());
    builder.maxFeePerGas(args.maxFeePerGas.toString());
    builder.maxPriorityFeePerGas(args.maxPriorityFeePerGas.toString());
    builder.feeToken(args.feeTokenAddress);
    builder.addOperation({
      token: args.tokenContractAddress,
      to: destBase,
      amount: amountStr,
      memo: memoId ?? undefined,
    });

    return (await builder.build()) as Tip20Transaction;
  }

  private buildTempoTxRequestForOfflineVaultMPCv2(
    txInfo: { recipient: Recipient; expireTime: number; gasLimit: string },
    _tip20Tx: Tip20Transaction,
    unsignedHex: string,
    derivationPath: string,
    nonce: number,
    gasLimit: number,
    eip1559: EIP1559,
    replayProtectionOptions: ReplayProtectionOptions | undefined,
    commonKeyChain: string
  ): UnsignedSweepTxMPCv2 {
    const fee = gasLimit * eip1559.maxFeePerGas;
    const signableHex = ethers.utils.keccak256(ethers.utils.arrayify(unsignedHex)).replace(/^0x/i, '');
    const serializedTxHex = unsignedHex.startsWith('0x') ? unsignedHex.slice(2) : unsignedHex;

    const unsignedTx: UnsignedTransactionTss = {
      serializedTxHex,
      signableHex,
      derivationPath,
      feeInfo: {
        fee,
        feeString: fee.toString(),
      },
      parsedTx: {
        spendAmount: txInfo.recipient.amount,
        outputs: [
          {
            coinName: this.getChain(),
            address: txInfo.recipient.address,
            valueString: txInfo.recipient.amount,
          },
        ],
      },
      coinSpecific: {
        commonKeyChain,
        tempoTip20Recovery: true,
      },
      eip1559,
      replayProtectionOptions,
    };

    return {
      txRequests: [
        {
          walletCoin: this.getChain(),
          transactions: [
            {
              unsignedTx,
              nonce,
              signatureShares: [],
            },
          ],
        },
      ],
    };
  }

  private mpcSignatureToTip20Sig(signature: { recid: number; r: string; s: string }): {
    r: `0x${string}`;
    s: `0x${string}`;
    yParity: number;
  } {
    const r = signature.r.startsWith('0x') ? signature.r : `0x${signature.r}`;
    const s = signature.s.startsWith('0x') ? signature.s : `0x${signature.s}`;
    return { r: r as `0x${string}`, s: s as `0x${string}`, yParity: signature.recid };
  }

  private async createBroadcastableTempoTip20SweepTransaction(params: MPCSweepRecoveryOptions): Promise<MPCTxs> {
    const broadcastableTransactions: MPCTx[] = [];
    let lastScanIndex = 0;
    const req = params.signatureShares;

    for (let i = 0; i < req.length; i++) {
      const transaction = req[i]?.txRequest?.transactions?.[0]?.unsignedTx;
      if (!transaction) {
        throw new Error(`Missing transaction at index ${i}`);
      }
      if (!req[i].ovc || !req[i].ovc[0].ecdsaSignature) {
        throw new Error('Missing signature(s)');
      }
      const serializedTxHex = (transaction as any).serializedTxHex as string | undefined;
      const signableHex = (transaction as any).signableHex as string | undefined;
      if (!serializedTxHex) {
        throw new Error('Missing serialized transaction');
      }
      if (!signableHex) {
        throw new Error('Missing signable hex');
      }
      const signature = req[i].ovc[0].ecdsaSignature;
      if (!signature) {
        throw new Error('Signature is undefined');
      }
      const shares: string[] = signature.toString().split(':');
      if (shares.length !== 4) {
        throw new Error('Invalid signature');
      }
      const finalSig = {
        recid: Number(shares[0]),
        r: shares[1],
        s: shares[2],
      };

      const rawHex = serializedTxHex.startsWith('0x') ? serializedTxHex : `0x${serializedTxHex}`;

      const txBuilder = this.getTransactionBuilder() as unknown as Tip20TransactionBuilder;
      txBuilder.from(rawHex);
      const tip20Tx = (await txBuilder.build()) as Tip20Transaction;
      tip20Tx.setSignature(this.mpcSignatureToTip20Sig(finalSig));

      const expectedSignable = ethers.utils.keccak256(ethers.utils.arrayify(rawHex)).replace(/^0x/i, '');
      if (expectedSignable.toLowerCase() !== signableHex.toLowerCase()) {
        throw new Error('Signable hex does not match serialized Tempo transaction');
      }

      broadcastableTransactions.push({
        serializedTx: await tip20Tx.toBroadcastFormat(),
      });

      const coinSpecific = (transaction as any).coinSpecific as Record<string, unknown> | undefined;
      if (i === req.length - 1 && coinSpecific?.lastScanIndex !== undefined) {
        lastScanIndex = coinSpecific.lastScanIndex as number;
      }
    }

    return { transactions: broadcastableTransactions, lastScanIndex };
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
