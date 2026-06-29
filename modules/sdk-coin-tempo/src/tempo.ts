/**
 * @prettier
 */
import {
  AbstractEthLikeNewCoins,
  RecoverOptions,
  OfflineVaultTxInfo,
  UnsignedSweepTxMPCv2,
  RecoveryInfo,
  TransactionBuilder,
  VerifyEthTransactionOptions,
  VerifyEthAddressOptions,
  TssVerifyEthAddressOptions,
  optionalDeps,
  KeyPair,
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
  common,
  Ecdsa,
  ECDSAUtils,
  getIsUnsignedSweep,
} from '@bitgo/sdk-core';
import { getDerivationPath } from '@bitgo/sdk-lib-mpc';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { ethers } from 'ethers';
import { Tip20Transaction, Tip20TransactionBuilder } from './lib';
import {
  amountToTip20Units,
  tip20UnitsToAmount,
  isTip20Transaction,
  isValidMemoId as isValidMemoIdUtil,
} from './lib/utils';
import { MAINNET_COIN, PATH_USD_TOKEN_MAINNET, PATH_USD_TOKEN_TESTNET } from './lib/constants';
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
   * EVM-based chains allow zero-value transfers for smart contract interactions
   */
  valuelessTransferAllowed(): boolean {
    return true;
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
    const rawCalls = tx.getRawCalls();

    // If the caller specified explicit recipients, verify they match the transaction.
    // A transaction is either all token transfer operations OR a single raw contract call — never mixed.
    const recipients = txParams?.recipients;
    if (recipients && recipients.length > 0) {
      if (rawCalls.length > 0) {
        // Contract call transaction — single raw call, single recipient with data
        if (rawCalls.length !== recipients.length) {
          throw new Error(
            `Transaction has ${rawCalls.length} call(s) but ${recipients.length} recipient(s) were requested`
          );
        }
        for (let i = 0; i < rawCalls.length; i++) {
          const rawCall = rawCalls[i];
          const recipient = recipients[i];
          if (rawCall.to.toLowerCase() !== recipient.address.split('?')[0].toLowerCase()) {
            throw new Error(`Raw call ${i} address mismatch: expected ${recipient.address}, got ${rawCall.to}`);
          }
          if (!recipient.data || rawCall.data.toLowerCase() !== recipient.data.toLowerCase()) {
            throw new Error(`Raw call ${i} calldata mismatch`);
          }
        }
      } else {
        // Token transfer transaction — operations matched 1-to-1 against recipients
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
          const opAmountBaseUnits = amountToTip20Units(op.amount).toString();
          if (opAmountBaseUnits !== recipient.amount.toString()) {
            throw new Error(`Operation ${i} amount mismatch: expected ${recipient.amount}, got ${opAmountBaseUnits}`);
          }
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
   * Query the Tempo Alchemy RPC for recovery balance/nonce information.
   * Routes through queryTempoRpc using the URL from environments.ts.
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const evmConfig = common.Environments[this.bitgo.getEnv()].evm;
    const coinFamily = this.getFamily();
    if (!evmConfig || !(coinFamily in evmConfig)) {
      throw new Error(`env config missing for ${coinFamily} in ${this.bitgo.getEnv()}`);
    }
    const token = apiKey || evmConfig[coinFamily].apiToken;
    const rpcUrl = evmConfig[coinFamily].baseUrl;
    return this.queryTempoRpc(query, rpcUrl, token);
  }

  /**
   * Translates Etherscan-style recovery queries into Tempo Alchemy JSON-RPC calls.
   *
   * Supported:
   *   account/balance      → returns { result: '0' } (no native coin on Tempo)
   *   account/tokenbalance → eth_call (balanceOf selector 0x70a08231) → { result: decimalString }
   *   account/txlist       → eth_getTransactionCount → { nonce: number }
   */
  private async queryTempoRpc(
    query: Record<string, string>,
    rpcUrl: string,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const endpoint = apiKey ? `${rpcUrl}${apiKey}` : rpcUrl;
    const { module, action, address, contractaddress, tag } = query;

    let method: string;
    let params: unknown[];

    if (module === 'account' && action === 'balance') {
      return { result: '0' };
    } else if (module === 'account' && action === 'tokenbalance') {
      const paddedAddr = (address ?? '').replace(/^0x/, '').padStart(64, '0');
      method = 'eth_call';
      params = [{ to: contractaddress, data: '0x70a08231' + paddedAddr }, tag ?? 'latest'];
    } else if (module === 'account' && action === 'txlist') {
      method = 'eth_getTransactionCount';
      params = [address, 'latest'];
    } else {
      throw new Error(`queryTempoRpc: unsupported module=${module} action=${action}`);
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    });

    if (!res.ok) {
      throw new Error(`Could not reach Tempo RPC endpoint (HTTP ${res.status})`);
    }

    const body = (await res.json()) as { result?: unknown; error?: { message: string } };
    if (body.error) {
      throw new Error(`Tempo RPC error: ${body.error.message}`);
    }

    if (module === 'account' && action === 'txlist') {
      return { nonce: parseInt(body.result as string, 16) };
    }

    try {
      return { result: BigInt(body.result as string).toString() };
    } catch {
      return { result: '0' };
    }
  }

  /**
   * Shared helper: queries the token balance, computes sweep amount, and builds
   * an unsigned TIP-20 transfer transaction. Used by both recovery paths.
   *
   * - tokenContractAddress: the token to sweep (defaults to pathUSD)
   * - feeToken: always pathUSD
   * - If sweeping pathUSD itself, reserves gasLimit × maxFeePerGas / 10^12 pathUSD units for fees.
   */
  private async buildTempoSweepTx(
    walletAddress: string,
    params: RecoverOptions
  ): Promise<{ tx: Tip20Transaction; nonce: number; sweepAmount: bigint; gasMarginUnits: bigint }> {
    if (!params.tokenContractAddress) {
      throw new Error('tokenContractAddress is required for sweep');
    }
    const tokenAddress = params.tokenContractAddress;

    const pathUsdTokenName = this.getChain() === MAINNET_COIN ? PATH_USD_TOKEN_MAINNET : PATH_USD_TOKEN_TESTNET;
    const pathUsdAddress = (coins.get(pathUsdTokenName) as unknown as { contractAddress: string }).contractAddress;

    const rawBalance = await this.queryAddressTokenBalance(tokenAddress, walletAddress, params.apiKey);
    const balance = BigInt(rawBalance.toString());

    const isPathUsd = tokenAddress.toLowerCase() === pathUsdAddress.toLowerCase();
    const gasLimitBig = BigInt(params.gasLimit ?? 700_000);
    const maxFeePerGasBig = BigInt(params.eip1559?.maxFeePerGas ?? 20_000_000_000);
    // 75% buffer on top of gasLimit × maxFeePerGas to cover actual on-chain gas variance
    const gasMarginUnits = (gasLimitBig * maxFeePerGasBig * 175n) / (10n ** 12n * 100n);
    const sweepAmount = isPathUsd ? balance - gasMarginUnits : balance;

    if (sweepAmount <= 0n) {
      throw new Error(
        `Insufficient balance in ${tokenAddress}: ${balance} units (minimum required: ${
          isPathUsd ? gasMarginUnits + 1n : 1n
        })`
      );
    }

    const sweepAmountHuman = tip20UnitsToAmount(sweepAmount);
    const nonce = await this.getAddressNonce(walletAddress, params.apiKey);

    const txBuilder = this.getTransactionBuilder() as unknown as Tip20TransactionBuilder;
    txBuilder
      .addOperation({ token: tokenAddress, to: params.recoveryDestination, amount: sweepAmountHuman })
      .feeToken(pathUsdAddress)
      .nonce(nonce)
      .gas(gasLimitBig)
      .maxFeePerGas(maxFeePerGasBig)
      .maxPriorityFeePerGas(BigInt(params.eip1559?.maxPriorityFeePerGas ?? 10_000_000_000));

    const tx = (await txBuilder.build()) as Tip20Transaction;
    return { tx, nonce, sweepAmount, gasMarginUnits };
  }

  /**
   * Overrides the base-class recoverTSS to use TIP-20 transactions instead of standard ETH.
   *
   * Two paths:
   *   - Unsigned sweep (plain public key shares): delegates to buildUnsignedSweepTxnTSS
   *   - Signed sweep (encrypted keys + passphrase): builds and signs a TIP-20 tx via MPC
   */
  protected async recoverTSS(
    params: RecoverOptions
  ): Promise<RecoveryInfo | OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    this.validateRecoveryParams(params);
    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    if (getIsUnsignedSweep({ userKey, backupKey, isTss: params.isTss })) {
      return this.buildUnsignedSweepTxnTSS(params);
    }

    // Signed sweep: decrypt MPC v2 key shares
    const { userKeyShare, backupKeyShare, commonKeyChain } = await ECDSAUtils.getMpcV2RecoveryKeyShares(
      userKey,
      backupKey,
      params.walletPassphrase,
      this.bitgo
    );

    const MPC = new Ecdsa();
    const derivedCommonKeyChain = MPC.deriveUnhardened(commonKeyChain, 'm/0');
    const backupKeyPair = new KeyPair({ pub: derivedCommonKeyChain.slice(0, 66) });
    const baseAddress = backupKeyPair.getAddress();

    const { tx: unsignedTx } = await this.buildTempoSweepTx(baseAddress, params);
    const serializedHex = await unsignedTx.serialize();

    // Hash the unsigned 0x76 tx — matches Tip20TransactionBuilder's own signing logic
    const msgHashHex = ethers.utils.keccak256(ethers.utils.arrayify(serializedHex));
    const messageHash = Buffer.from(msgHashHex.replace('0x', ''), 'hex');

    const signature = await ECDSAUtils.signRecoveryMpcV2(messageHash, userKeyShare, backupKeyShare, commonKeyChain);

    // ECDSAMethodTypes.Signature.r/s are 64-char hex WITHOUT 0x prefix
    unsignedTx.setSignature({
      r: `0x${signature.r}`,
      s: `0x${signature.s}`,
      yParity: signature.recid,
    });

    const signedHex = await unsignedTx.serialize();
    const txId = ethers.utils.keccak256(ethers.utils.arrayify(signedHex));
    return { id: txId, tx: signedHex };
  }

  /**
   * Builds an unsigned TIP-20 sweep transaction for the offline vault (unsigned sweep path).
   * Called by recoverTSS when plain public key shares are provided.
   */
  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    const backupKey = params.backupKey.replace(/\s/g, '');
    const derivationPath = params.derivationSeed ? getDerivationPath(params.derivationSeed) : 'm/0';
    const MPC = new Ecdsa();
    const derivedCommonKeyChain = MPC.deriveUnhardened(backupKey, derivationPath);
    const backupKeyPair = new KeyPair({ pub: derivedCommonKeyChain.slice(0, 66) });
    const baseAddress = backupKeyPair.getAddress();

    const { tx, nonce, sweepAmount, gasMarginUnits } = await this.buildTempoSweepTx(baseAddress, params);
    const serializedHex = await tx.serialize();
    const serializedTxHex = serializedHex.replace('0x', '');
    const signableHex = ethers.utils.keccak256(ethers.utils.arrayify(serializedHex)).replace('0x', '');

    return {
      txRequests: [
        {
          walletCoin: this.getChain(),
          transactions: [
            {
              unsignedTx: {
                serializedTxHex,
                signableHex,
                derivationPath,
                feeInfo: {
                  fee: Number(gasMarginUnits),
                  feeString: tip20UnitsToAmount(gasMarginUnits),
                },
                parsedTx: {
                  spendAmount: tip20UnitsToAmount(sweepAmount),
                  outputs: [
                    {
                      coinName: this.getChain(),
                      address: params.recoveryDestination,
                      valueString: tip20UnitsToAmount(sweepAmount),
                    },
                  ],
                },
                coinSpecific: { commonKeyChain: backupKey },
                eip1559: params.eip1559,
                replayProtectionOptions: params.replayProtectionOptions,
              },
              nonce,
              signatureShares: [],
            },
          ],
        },
      ],
    };
  }

  /**
   * Get transaction builder for Tempo.
   */
  protected getTransactionBuilder(common?: EthLikeCommon.default): TransactionBuilder {
    return new Tip20TransactionBuilder(coins.get(this.getBaseChain())) as unknown as TransactionBuilder;
  }
}
