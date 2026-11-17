/**
 * @prettier
 */
import {
  classifyRecoveryKeys,
  BitGoBase,
  CoinConstructor,
  checkKrsProvider,
  MPCAlgorithm,
  NamedCoinConstructor,
  RecoveryProviderError,
  Util,
} from '@bitgo/sdk-core';
import { coins, Erc7984TokenConfig, EthereumNetwork, tokens } from '@bitgo/statics';
import {
  CoinNames,
  DecryptionDelegationBuilder,
  decodeTokenAddressesFromDelegationCalldata,
  decodeDelegationCallsFromCalldata,
  decodeConfidentialTransferData,
  decodeDirectConfidentialTransferCalldata,
  decodeFlushERC7984ForwarderTokenCalldata,
  decodeSendMultiSigFlushERC7984Data,
  sendMultisigMethodId,
  confidentialTransferWithProofMethodId,
  buildConfidentialTransferByHandleCalldata,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  OfflineVaultTxInfo,
  VerifyEthTransactionOptions,
  aclMulticallMethodId,
  callFromParentMethodId,
  decodeWrapCalldata,
  wrapMethodId,
  assertWrapAmountFitsUint64,
  decodeUnwrapCalldata,
  unwrapMethodId,
  decodeFinalizeUnwrapCalldata,
  finalizeUnwrapMethodId,
  UINT64_MAX,
  decodeTransferData,
} from '@bitgo/abstract-eth';
import { bip32 } from '@bitgo/secp256k1';
import { ethers } from 'ethers';
import { addHexPrefix } from 'ethereumjs-util';
import * as _ from 'lodash';

import { Eth } from './eth';
import { TransactionBuilder } from './lib';

// CECHO-2719 strict consolidation verification: upper bound on the CREATE2 derivation
// indices scanned when checking whether a consolidation destination is a wallet-owned
// forwarder. BitGo EVM forwarders use the derivation index as the CREATE2 salt, so every
// wallet-owned forwarder is reproducible from (baseAddress, index). The scan early-exits
// on the first match, so legitimate (low-index) forwarders verify cheaply; only
// rejections and very-high-index matches pay the full bound. Measured cost is ~15µs per
// derivation, so a full miss costs ~450ms across the three fee-less version layouts
// (~30k derivations) or ~600ms with the wallet fee address present (4 × 10000);
// recoverConsolidations caps its own address scan at 10 * DEFAULT_SCAN_FACTOR = 200,
// and 10000 covers exchange-scale deposit wallets. A destination derived beyond this
// bound is rejected with an error naming
// the scanned range — diagnosable during the staging validation window, which exists
// to de-risk exactly this class of false positive.
const STRICT_CONSOLIDATION_MAX_DERIVATION_INDEX = 10000;
const STRICT_CONSOLIDATION_FORWARDER_VERSIONS = [1, 2, 4, 5] as const;

export { Erc7984TokenConfig };

export class Erc7984Token extends Eth {
  public readonly tokenConfig: Erc7984TokenConfig;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';
  static coinNames: CoinNames = {
    Mainnet: 'eth',
    Testnet: 'hteth',
  };

  constructor(bitgo: BitGoBase, tokenConfig: Erc7984TokenConfig) {
    const staticsCoin = coins.get(tokenConfig.coin);
    super(bitgo, staticsCoin);
    this.tokenConfig = tokenConfig;
    // ERC7984 confidential transfers use sendMultiSig (not sendMultiSigToken) because
    // the calldata parameter is required to carry confidentialTransfer(recipient, encryptedHandle, inputProof).
    // sendMultiSigToken has no data parameter and cannot carry inner calldata.
    this.sendMethodName = 'sendMultiSig';
  }

  static createTokenConstructor(config: Erc7984TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Erc7984Token(bitgo, config);
  }

  static createTokenConstructors(
    tokenConfigs: Erc7984TokenConfig[] = [
      ...tokens.bitcoin.eth.confidentialTokens,
      ...tokens.testnet.eth.confidentialTokens,
    ]
  ): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of tokenConfigs) {
      const tokenConstructor = Erc7984Token.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
  }

  get type(): string {
    return this.tokenConfig.type;
  }

  get name(): string {
    return this.tokenConfig.name;
  }

  get coin(): string {
    return this.tokenConfig.coin;
  }

  get network(): string {
    return this.tokenConfig.network;
  }

  get tokenContractAddress(): string {
    return this.tokenConfig.tokenContractAddress;
  }

  get decimalPlaces(): number {
    return this.tokenConfig.decimalPlaces;
  }

  getChain(): string {
    return this.tokenConfig.type;
  }

  getFullName(): string {
    return 'ERC7984 Confidential Token';
  }

  getBaseFactor(): number {
    return Math.pow(10, this.tokenConfig.decimalPlaces);
  }

  /**
   * Flag for sending value of 0.
   * ERC-7984 confidential transfers always carry an encrypted amount; zero-value sends are not meaningful.
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Flag for sending data along with transactions via the standard token-send API.
   * Returns false because ERC-7984 sends use confidentialTransfer() calldata built
   * by WP, not an arbitrary data field on the send params.
   * Note: this does not prevent calldata-based flows like getDelegationBuilder(),
   * which bypass the token-send path entirely.
   */
  transactionDataAllowed(): boolean {
    return false;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  async verifyTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    if (params.txParams?.type === 'enabletoken') {
      return this.verifyEnableTokenTransaction(params);
    }
    if (params.txParams?.type === 'wrap') {
      return this.verifyWrapTransaction(params);
    }
    if (params.txParams?.type === 'unwrap') {
      return this.verifyUnwrapTransaction(params);
    }
    if (params.txParams?.type === 'finalizeUnwrap') {
      return this.verifyFinalizeUnwrapTransaction(params);
    }
    if (this.isConsolidationTransaction(params)) {
      return this.verifyConfidentialConsolidation(params);
    }
    return this.verifyConfidentialTransfer(params);
  }

  private isConsolidationTransaction(params: VerifyEthTransactionOptions): boolean {
    const { txParams, txPrebuild, verification } = params;
    return !!(
      verification?.consolidationToBaseAddress ||
      txPrebuild?.consolidateId ||
      txParams?.type === 'consolidate' ||
      // TSS signing path: resolveEffectiveTxParams sets type from intent.intentType which is
      // 'consolidateToken' for ERC-7984 token consolidations. txPrebuild has only txHex
      // (no consolidateId) in this path.
      txParams?.type === 'consolidateToken' ||
      txParams?.prebuildTx?.consolidateId
    );
  }

  /**
   * Verifies WrapERC7984 (shield) transactions.
   *
   * TSS / direct shape:
   *   tx.to   = wrapper contract
   *   tx.data = wrap(baseAddress, amount)
   *
   * Multisig shape:
   *   tx.to   = wallet contract
   *   tx.data = sendMultiSig(wrapper, 0, wrap(baseAddress, amount), ...)
   *
   * Checks: wrapper address, self-directed `to` == base, amount > 0, amount matches
   * recipients, and floor(amount / rate) fits uint64 when statics rate is present.
   */
  private async verifyWrapTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;

    if (!txPrebuild?.txHex) {
      throw new Error('verifyWrapTransaction: missing txHex in txPrebuild');
    }

    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txPrebuild.txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    let wrapperAddress: string;
    let wrapCalldata: string;

    try {
      if (txJson.data.toLowerCase().startsWith(sendMultisigMethodId.toLowerCase())) {
        const decoded = decodeTransferData(txJson.data);
        wrapperAddress = decoded.to;
        wrapCalldata = decoded.data as string;
        if (decoded.amount !== '0') {
          throw new Error(`expected sendMultiSig value 0 but got ${decoded.amount}`);
        }
      } else if (txJson.data.toLowerCase().startsWith(wrapMethodId.toLowerCase())) {
        wrapperAddress = txJson.to as string;
        wrapCalldata = txJson.data;
      } else {
        throw new Error(`unexpected method ID ${txJson.data.slice(0, 10)}`);
      }
    } catch (e) {
      throw new Error(`verifyWrapTransaction: failed to decode wrap calldata — ${(e as Error).message}`);
    }

    if (wrapperAddress.toLowerCase() !== this.tokenContractAddress.toLowerCase()) {
      throw new Error(
        `verifyWrapTransaction: wrapper address mismatch — ` +
          `expected ${this.tokenContractAddress}, got ${wrapperAddress}`
      );
    }

    let to: string;
    let amount: string;
    try {
      ({ to, amount } = decodeWrapCalldata(wrapCalldata));
    } catch (e) {
      throw new Error(`verifyWrapTransaction: invalid wrap inner calldata — ${(e as Error).message}`);
    }

    if (!Erc7984Token.isPositiveIntegerString(amount)) {
      throw new Error(`verifyWrapTransaction: amount must be a positive integer string, got '${amount}'`);
    }

    const baseAddress = this.getWalletBaseAddress(wallet);
    if (!baseAddress) {
      throw new Error('verifyWrapTransaction: unable to determine wallet base address');
    }
    if (to.toLowerCase() !== baseAddress.toLowerCase()) {
      throw new Error(
        `verifyWrapTransaction: wrap recipient must equal wallet base address — expected ${baseAddress}, got ${to}`
      );
    }

    const expectedAmount = txParams?.recipients?.[0]?.amount ?? txPrebuild.buildParams?.recipients?.[0]?.amount;
    if (expectedAmount !== undefined && String(expectedAmount) !== amount) {
      throw new Error(
        `verifyWrapTransaction: amount mismatch — calldata has '${amount}' but params have '${expectedAmount}'`
      );
    }

    const rate = this.tokenConfig.rate;
    if (rate !== undefined) {
      try {
        assertWrapAmountFitsUint64(amount, rate);
      } catch (e) {
        throw new Error(`verifyWrapTransaction: ${(e as Error).message}`);
      }
    }

    if (txJson.value !== undefined && txJson.value !== '0' && txJson.value !== 0) {
      throw new Error(`verifyWrapTransaction: expected transaction value 0 but got ${txJson.value}`);
    }

    return true;
  }

  /**
   * Verifies UnwrapERC7984 (unshield phase-1) transactions.
   *
   * TSS / direct shape:
   *   tx.to   = wrapper contract
   *   tx.data = unwrap(base, base, encryptedAmount, inputProof)
   *
   * Multisig shape:
   *   tx.to   = wallet contract
   *   tx.data = sendMultiSig(wrapper, 0, unwrap(base, base, ...), ...)
   *
   * v1 is self-directed only: from == to == wallet base address.
   */
  private async verifyUnwrapTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txPrebuild, wallet } = params;

    if (!txPrebuild?.txHex) {
      throw new Error('verifyUnwrapTransaction: missing txHex in txPrebuild');
    }

    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txPrebuild.txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    let wrapperAddress: string;
    let unwrapCalldata: string;

    try {
      if (txJson.data.toLowerCase().startsWith(sendMultisigMethodId.toLowerCase())) {
        const decoded = decodeTransferData(txJson.data);
        wrapperAddress = decoded.to;
        unwrapCalldata = decoded.data as string;
        if (decoded.amount !== '0') {
          throw new Error(`expected sendMultiSig value 0 but got ${decoded.amount}`);
        }
      } else if (txJson.data.toLowerCase().startsWith(unwrapMethodId.toLowerCase())) {
        wrapperAddress = txJson.to as string;
        unwrapCalldata = txJson.data;
      } else {
        throw new Error(`unexpected method ID ${txJson.data.slice(0, 10)}`);
      }
    } catch (e) {
      throw new Error(`verifyUnwrapTransaction: failed to decode unwrap calldata — ${(e as Error).message}`);
    }

    if (wrapperAddress.toLowerCase() !== this.tokenContractAddress.toLowerCase()) {
      throw new Error(
        `verifyUnwrapTransaction: wrapper address mismatch — expected ${this.tokenContractAddress}, got ${wrapperAddress}`
      );
    }

    let from: string;
    let to: string;
    let encryptedAmount: string;
    let inputProof: string;
    try {
      ({ from, to, encryptedAmount, inputProof } = decodeUnwrapCalldata(unwrapCalldata));
    } catch (e) {
      throw new Error(`verifyUnwrapTransaction: invalid unwrap inner calldata — ${(e as Error).message}`);
    }

    const baseAddress = this.getWalletBaseAddress(wallet);
    if (!baseAddress) {
      throw new Error('verifyUnwrapTransaction: unable to determine wallet base address');
    }
    if (from.toLowerCase() !== baseAddress.toLowerCase()) {
      throw new Error(
        `verifyUnwrapTransaction: unwrap from must equal wallet base address — expected ${baseAddress}, got ${from}`
      );
    }
    if (to.toLowerCase() !== baseAddress.toLowerCase()) {
      throw new Error(
        `verifyUnwrapTransaction: unwrap to must equal wallet base address — expected ${baseAddress}, got ${to}`
      );
    }

    if (!encryptedAmount || encryptedAmount === '0x' || /^0x0+$/.test(encryptedAmount)) {
      throw new Error('verifyUnwrapTransaction: encryptedAmount is missing or empty');
    }
    if (!inputProof || inputProof === '0x') {
      throw new Error('verifyUnwrapTransaction: inputProof is missing or empty');
    }

    if (txJson.value !== undefined && txJson.value !== '0' && txJson.value !== 0) {
      throw new Error(`verifyUnwrapTransaction: expected transaction value 0 but got ${txJson.value}`);
    }

    return true;
  }

  /**
   * Verifies FinalizeUnwrapERC7984 (unshield phase-2) transactions.
   *
   * TSS / direct shape:
   *   tx.to   = wrapper contract
   *   tx.data = finalizeUnwrap(requestId, cleartextAmount, decryptionProof)
   *
   * Multisig shape:
   *   tx.to   = wallet contract
   *   tx.data = sendMultiSig(wrapper, 0, finalizeUnwrap(...), ...)
   */
  private async verifyFinalizeUnwrapTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild } = params;

    if (!txPrebuild?.txHex) {
      throw new Error('verifyFinalizeUnwrapTransaction: missing txHex in txPrebuild');
    }

    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txPrebuild.txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    let wrapperAddress: string;
    let finalizeCalldata: string;

    try {
      if (txJson.data.toLowerCase().startsWith(sendMultisigMethodId.toLowerCase())) {
        const decoded = decodeTransferData(txJson.data);
        wrapperAddress = decoded.to;
        finalizeCalldata = decoded.data as string;
        if (decoded.amount !== '0') {
          throw new Error(`expected sendMultiSig value 0 but got ${decoded.amount}`);
        }
      } else if (txJson.data.toLowerCase().startsWith(finalizeUnwrapMethodId.toLowerCase())) {
        wrapperAddress = txJson.to as string;
        finalizeCalldata = txJson.data;
      } else {
        throw new Error(`unexpected method ID ${txJson.data.slice(0, 10)}`);
      }
    } catch (e) {
      throw new Error(
        `verifyFinalizeUnwrapTransaction: failed to decode finalizeUnwrap calldata — ${(e as Error).message}`
      );
    }

    if (wrapperAddress.toLowerCase() !== this.tokenContractAddress.toLowerCase()) {
      throw new Error(
        `verifyFinalizeUnwrapTransaction: wrapper address mismatch — expected ${this.tokenContractAddress}, got ${wrapperAddress}`
      );
    }

    let requestId: string;
    let cleartextAmount: string;
    let decryptionProof: string;
    try {
      ({ requestId, cleartextAmount, decryptionProof } = decodeFinalizeUnwrapCalldata(finalizeCalldata));
    } catch (e) {
      throw new Error(
        `verifyFinalizeUnwrapTransaction: invalid finalizeUnwrap inner calldata — ${(e as Error).message}`
      );
    }

    if (!requestId || requestId === '0x' || /^0x0+$/.test(requestId)) {
      throw new Error('verifyFinalizeUnwrapTransaction: requestId is missing or empty');
    }
    if (!Erc7984Token.isPositiveIntegerString(cleartextAmount)) {
      throw new Error(
        `verifyFinalizeUnwrapTransaction: cleartextAmount must be a positive integer string, got '${cleartextAmount}'`
      );
    }
    if (BigInt(cleartextAmount) > UINT64_MAX) {
      throw new Error('verifyFinalizeUnwrapTransaction: cleartextAmount exceeds uint64');
    }
    if (!decryptionProof || decryptionProof === '0x') {
      throw new Error('verifyFinalizeUnwrapTransaction: decryptionProof is missing or empty');
    }

    const expectedAmount = txParams?.recipients?.[0]?.amount ?? txPrebuild.buildParams?.recipients?.[0]?.amount;
    if (expectedAmount !== undefined && String(expectedAmount) !== cleartextAmount) {
      throw new Error(
        `verifyFinalizeUnwrapTransaction: amount mismatch — calldata has '${cleartextAmount}' but params have '${expectedAmount}'`
      );
    }

    if (txJson.value !== undefined && txJson.value !== '0' && txJson.value !== 0) {
      throw new Error(`verifyFinalizeUnwrapTransaction: expected transaction value 0 but got ${txJson.value}`);
    }

    return true;
  }

  private getWalletBaseAddress(wallet: VerifyEthTransactionOptions['wallet']): string | undefined {
    if (!wallet) {
      return undefined;
    }
    const coinSpecific = typeof wallet.coinSpecific === 'function' ? wallet.coinSpecific() : wallet.coinSpecific;
    const ethCoinSpecific = coinSpecific as { baseAddress?: string; rootAddress?: string } | undefined;
    return ethCoinSpecific?.baseAddress ?? ethCoinSpecific?.rootAddress;
  }

  /**
   * Verifies ERC-7984 forwarder consolidation (flush) transactions.
   *
   * Multisig shape:
   *   tx.to   = wallet contract
   *   tx.data = sendMultiSig(forwarder, 0, callFromParent(token, 0, confidentialTransferNoProof(base, handle)), ...)
   *
   * TSS / direct shape:
   *   tx.to   = forwarder contract
   *   tx.data = callFromParent(token, 0, confidentialTransferNoProof(base, handle))
   */
  private async verifyConfidentialConsolidation(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;

    if (!txPrebuild?.txHex) {
      // CECHO-2719 rollout gate: strict consolidation verification requires inspecting the
      // material that will be signed — a consolidateId alone proves nothing about the
      // transaction, so a txHex-less prebuild is rejected outright on test/staging.
      // This gate must be removed (enforcing everywhere) in the next release.
      if (this.bitgo.env === 'test' || this.bitgo.env === 'staging') {
        throw new Error(
          'verifyConfidentialConsolidation: txPrebuild.txHex is required to verify a consolidation on test/staging'
        );
      }
      if (!txPrebuild?.consolidateId && !txParams?.prebuildTx?.consolidateId) {
        throw new Error('verifyConfidentialConsolidation: missing consolidateId');
      }
      return true;
    }

    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txPrebuild.txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    let tokenContractAddress: string;
    let parentAddress: string;
    let encryptedHandle: string;
    let forwarderAddress: string | undefined;

    try {
      if (txJson.data.startsWith(sendMultisigMethodId)) {
        const decoded = decodeSendMultiSigFlushERC7984Data(txJson.data);
        forwarderAddress = decoded.forwarderAddress;
        tokenContractAddress = decoded.tokenContractAddress;
        parentAddress = decoded.parentAddress;
        encryptedHandle = decoded.encryptedHandle;
      } else if (txJson.data.startsWith(callFromParentMethodId)) {
        const decoded = decodeFlushERC7984ForwarderTokenCalldata(txJson.data);
        tokenContractAddress = decoded.tokenContractAddress;
        parentAddress = decoded.parentAddress;
        encryptedHandle = decoded.encryptedHandle;
        forwarderAddress = txJson.to;
      } else {
        throw new Error(`unexpected method ID ${txJson.data.slice(0, 10)}`);
      }
    } catch (e) {
      throw new Error(
        `verifyConfidentialConsolidation: failed to decode consolidation calldata — ${(e as Error).message}`
      );
    }

    // Note: in strict mode the checks below run first on this builder round-trip
    // decode, and verifyStrictConsolidationCalldata then re-verifies every field from
    // the original signed bytes; both must pass, so if the two decodes disagree, the
    // legacy error surfaces first and the strict tier never runs.

    if (tokenContractAddress.toLowerCase() !== this.tokenContractAddress.toLowerCase()) {
      throw new Error(
        `verifyConfidentialConsolidation: token contract address mismatch — ` +
          `expected ${this.tokenContractAddress}, got ${tokenContractAddress}`
      );
    }

    const baseAddress = this.getWalletBaseAddress(wallet);
    if (!baseAddress) {
      throw new Error('verifyConfidentialConsolidation: unable to determine wallet base address');
    }
    if (parentAddress.toLowerCase() !== baseAddress.toLowerCase()) {
      throw new Error(
        `verifyConfidentialConsolidation: parent address mismatch — expected ${baseAddress}, got ${parentAddress}`
      );
    }

    if (!encryptedHandle || encryptedHandle === '0x') {
      throw new Error('verifyConfidentialConsolidation: encryptedHandle is missing or empty in transaction calldata');
    }

    const expectedForwarder =
      txPrebuild.recipients?.[0]?.address ??
      txPrebuild.txInfo?.recipients?.[0]?.address ??
      txParams?.recipients?.[0]?.address;
    if (forwarderAddress && expectedForwarder) {
      if (forwarderAddress.toLowerCase() !== expectedForwarder.toLowerCase()) {
        throw new Error(
          `verifyConfidentialConsolidation: forwarder address mismatch — ` +
            `expected ${expectedForwarder}, got ${forwarderAddress}`
        );
      }
    }

    // CECHO-2719 rollout gate: strict consolidation verification is enforced on test and
    // staging environments first; prod keeps the legacy checks above for one release
    // cycle while staging/testnet validation proves there are no false positives.
    // Release N+1 removes this gate everywhere.
    if (this.bitgo.env === 'test' || this.bitgo.env === 'staging') {
      this.verifyStrictConsolidationCalldata(wallet, baseAddress, txPrebuild.txHex);
    }

    return true;
  }

  /**
   * Strict CECHO-2719 checks on a consolidation (flush) prebuild, enforced on test and
   * staging environments during the staged rollout.
   *
   * Every bound field — outer value, outer `to`, token contract, parent, handle,
   * sendMultiSig amount, callFromParent value, and the flushed forwarder — is decoded
   * from the ORIGINAL signed bytes (ethers parseTransaction), never from the
   * TransactionBuilder from()/build() round trip: the round trip re-encodes
   * FlushERC7984ForwarderToken calldata through buildFlushERC7984ForwarderTokenCalldata,
   * which hardcodes value 0 and would silently normalize a hostile non-zero value word
   * out of the inspected transaction — while the wallet signs the original bytes.
   * Verifying the original bytes closes that whole class of builder-normalization
   * blind spots, not just the value word.
   *
   * Checks:
   *   1. the calldata decodes as one of the two consolidation shapes with the expected
   *      token contract, the wallet base address as parent, and a non-empty handle
   *   2. the outer transaction value is 0 (every sibling verifier —
   *      verifyWrapTransaction / verifyUnwrapTransaction / verifyFinalizeUnwrapTransaction —
   *      already enforces this on the round-tripped form)
   *   3. the sendMultiSig amount (multisig shape) and the callFromParent value (both
   *      shapes) are 0
   *   4. multisig shape: the outer call targets the wallet contract (base address)
   *   5. the flushed forwarder is a wallet-owned address derived locally from wallet
   *      data — never from txPrebuild.recipients, which comes from the same untrusted
   *      server response as txHex. Unlike the enable-token verifier (CECHO-2720) there
   *      is no structural backstop: `to = attacker` with a zero value still executes an
   *      arbitrary call as the wallet, so the destination binding cannot be skipped.
   *      Fails closed when no wallet-owned forwarder can be derived.
   *
   * These checks depend only on the decoded transaction content and local wallet data,
   * so they apply identically no matter which (server-controlled) flag routed the
   * prebuild into this verifier.
   */
  private verifyStrictConsolidationCalldata(
    wallet: VerifyEthTransactionOptions['wallet'],
    baseAddress: string,
    originalTxHex: string
  ): void {
    let originalTo: string | undefined;
    let originalValue: ethers.BigNumber;
    let tokenContractAddress: string;
    let parentAddress: string;
    let encryptedHandle: string;
    let forwarderAddress: string;
    let sendMultiSigAmount: string | undefined;
    let callFromParentValue: bigint | undefined;

    try {
      // addHexPrefix: TransactionBuilder.from() accepts unprefixed serialized txHex
      // (RAW_TX_HEX_REGEX), so a producer (e.g. a TSS serializedTxHex) may send it;
      // ethers v5 parseTransaction requires the 0x prefix. addHexPrefix is idempotent.
      const originalTx: { to?: string; value: ethers.BigNumber; data?: string } = ethers.utils.parseTransaction(
        addHexPrefix(originalTxHex)
      );
      originalTo = originalTx.to;
      originalValue = originalTx.value;
      const originalData: string = originalTx.data ?? '0x';
      if (originalData.startsWith(sendMultisigMethodId)) {
        const decoded = decodeSendMultiSigFlushERC7984Data(originalData);
        forwarderAddress = decoded.forwarderAddress;
        sendMultiSigAmount = decoded.amount;
        callFromParentValue = decoded.callFromParentValue;
        tokenContractAddress = decoded.tokenContractAddress;
        parentAddress = decoded.parentAddress;
        encryptedHandle = decoded.encryptedHandle;
      } else if (originalData.startsWith(callFromParentMethodId)) {
        if (!originalTo) {
          throw new Error('consolidation transaction has no destination');
        }
        const decoded = decodeFlushERC7984ForwarderTokenCalldata(originalData);
        tokenContractAddress = decoded.tokenContractAddress;
        callFromParentValue = decoded.callFromParentValue;
        parentAddress = decoded.parentAddress;
        encryptedHandle = decoded.encryptedHandle;
        forwarderAddress = originalTo;
      } else {
        throw new Error(`unexpected method ID ${originalData.slice(0, 10)}`);
      }
    } catch (e) {
      throw new Error(
        `verifyConfidentialConsolidation: failed to decode original consolidation calldata — ${(e as Error).message}`
      );
    }
    const isMultisigShape = sendMultiSigAmount !== undefined;

    // 1. Bind the calldata to the token contract, the wallet base address, and a handle.
    if (tokenContractAddress.toLowerCase() !== this.tokenContractAddress.toLowerCase()) {
      throw new Error(
        `verifyConfidentialConsolidation: token contract address mismatch — ` +
          `expected ${this.tokenContractAddress}, got ${tokenContractAddress}`
      );
    }
    if (parentAddress.toLowerCase() !== baseAddress.toLowerCase()) {
      throw new Error(
        `verifyConfidentialConsolidation: parent address mismatch — expected ${baseAddress}, got ${parentAddress}`
      );
    }
    if (!encryptedHandle || encryptedHandle === '0x') {
      throw new Error('verifyConfidentialConsolidation: encryptedHandle is missing or empty in transaction calldata');
    }

    // 2. A consolidation moves confidential balances via calldata only; a non-zero outer
    //    value sends native funds to whatever address the transaction targets.
    if (!originalValue.isZero()) {
      throw new Error(
        `verifyConfidentialConsolidation: expected transaction value 0 but got ${originalValue.toString()}`
      );
    }

    // 3. Inner value words must both be zero.
    if (isMultisigShape && sendMultiSigAmount !== '0') {
      throw new Error(`verifyConfidentialConsolidation: sendMultiSig amount must be 0 but got ${sendMultiSigAmount}`);
    }
    if (callFromParentValue !== undefined && callFromParentValue !== 0n) {
      throw new Error(
        `verifyConfidentialConsolidation: callFromParent must carry value 0 but got ${callFromParentValue}`
      );
    }

    // The remaining sendMultiSig parameters (expireTime, sequenceId, signature) are
    // deliberately not bound here: they are enforced by the on-chain wallet contract
    // and the platform co-signature, and are not client-verifiable.

    // 4. Multisig shape: the outer call targets the wallet contract itself, not any
    //    other contract the platform picked.
    if (isMultisigShape) {
      if (!originalTo || originalTo.toLowerCase() !== baseAddress.toLowerCase()) {
        throw new Error(
          `verifyConfidentialConsolidation: multisig consolidation must call the wallet contract ` +
            `(${baseAddress}) but got ${originalTo}`
        );
      }
    }

    // 5. The flushed forwarder must be a wallet-owned address derived locally from the
    //    wallet's own data (fails closed when it cannot be derived). Any wallet-owned
    //    forwarder is acceptable by design: which forwarder to flush is the platform's
    //    choice (consolidations sweep whichever forwarder holds balances), and safety
    //    comes from the parent binding — the flush returns funds to this wallet's base
    //    address (checked above), never elsewhere.
    if (!this.isWalletOwnedForwarderAddress(forwarderAddress, baseAddress, wallet)) {
      throw new Error(
        `verifyConfidentialConsolidation: consolidation destination ${forwarderAddress} is not a ` +
          `wallet-owned forwarder address (verified CREATE2 derivation indices ` +
          `0..${STRICT_CONSOLIDATION_MAX_DERIVATION_INDEX - 1} across forwarder versions ` +
          `${STRICT_CONSOLIDATION_FORWARDER_VERSIONS.join('/')})`
      );
    }
  }

  /**
   * Whether an address is a wallet-owned destination for a consolidation (flush): a
   * forwarder the wallet owns, derived locally from wallet data only — never from the
   * prebuild response (CECHO-2719).
   *
   * BitGo EVM forwarders are deployed via CREATE2 from the wallet's base address with
   * the derivation index as the salt, so every wallet-owned forwarder is reproducible
   * locally from (baseAddress, index) plus the network factory/implementation constants
   * — the same math AbstractEthLikeNewCoins.deriveAddress and isWalletAddress use. All
   * known forwarder versions are scanned (v4 only when the wallet carries its fee
   * address, because the fee is part of the v4 CREATE2 salt — see
   * getCreateForwarderParamsAndTypes / verifyForwarderAddress), so the result does not
   * depend on wallet version metadata; an attacker-chosen address can never verify
   * without controlling the wallet's own base address.
   *
   * The wallet's base address is deliberately NOT accepted as a flush destination: a
   * legitimate consolidation always targets a forwarder contract holding confidential
   * balances, never the wallet's own contract or EOA (which has no callFromParent and
   * holds no balances to flush). The multisig shape's outer `to == base` requirement
   * is enforced separately in verifyStrictConsolidationCalldata.
   *
   * The scan starts at index 0 and returns on the first match, so legitimate
   * (low-index) forwarders verify cheaply; only rejections pay the full scan. Indices
   * are bounded by STRICT_CONSOLIDATION_MAX_DERIVATION_INDEX (see its comment).
   * Throws (fails closed) when the network configures no forwarder factory at all, or —
   * naming the missing fee address — when v4 derivations were impossible and the
   * destination matched nothing.
   */
  private isWalletOwnedForwarderAddress(
    destination: string,
    baseAddress: string,
    wallet: VerifyEthTransactionOptions['wallet']
  ): boolean {
    const destinationLower = destination.toLowerCase();

    const coinSpecific = typeof wallet?.coinSpecific === 'function' ? wallet.coinSpecific() : wallet?.coinSpecific;
    const feeAddress = (coinSpecific as { feeAddress?: string } | undefined)?.feeAddress;
    let anyFactoryConfigured = false;
    let v4SkippedForMissingFee = false;

    for (const forwarderVersion of STRICT_CONSOLIDATION_FORWARDER_VERSIONS) {
      let factoryAddresses: { forwarderFactoryAddress: string; forwarderImplementationAddress: string };
      try {
        factoryAddresses = this.getForwarderFactoryAddressesAndForwarderImplementationAddress(forwarderVersion);
      } catch {
        // This network does not configure the factory for this forwarder version; skip it.
        continue;
      }
      anyFactoryConfigured = true;
      // Only the v4 CREATE2 salt layout includes the enterprise fee address; every
      // other version derives with an empty fee address, and v4 cannot be derived
      // without one.
      const versionFeeAddress: string = forwarderVersion === 4 ? feeAddress ?? '' : '';
      if (forwarderVersion === 4 && !versionFeeAddress) {
        // Not silently: without the wallet's fee address the v4 salt layout is not
        // reproducible offline; the rejection after the scan names the missing data.
        v4SkippedForMissingFee = true;
        continue;
      }
      for (let index = 0; index < STRICT_CONSOLIDATION_MAX_DERIVATION_INDEX; index++) {
        let forwarder: string;
        try {
          forwarder = this.generateForwarderAddress(
            baseAddress,
            versionFeeAddress,
            factoryAddresses.forwarderFactoryAddress,
            factoryAddresses.forwarderImplementationAddress,
            index
          );
        } catch {
          // Derivation for this index failed; keep scanning the remaining indices.
          // Fee-less v4 is already skipped before the loop, so a catch here can only be
          // a malformed derivation input (e.g. an invalid base address), and the
          // destination comparison below fails closed on it regardless.
          continue;
        }
        if (forwarder.toLowerCase() === destinationLower) {
          return true;
        }
      }
    }

    if (!anyFactoryConfigured) {
      throw new Error(
        'verifyConfidentialConsolidation: unable to derive any wallet-owned forwarder address — ' +
          'no forwarder factory addresses are configured for this network'
      );
    }
    if (v4SkippedForMissingFee) {
      throw new Error(
        `verifyConfidentialConsolidation: consolidation destination ${destination} is not a wallet-owned ` +
          `forwarder address (verified CREATE2 derivation indices ` +
          `0..${STRICT_CONSOLIDATION_MAX_DERIVATION_INDEX - 1} across forwarder versions 1/2/5). ` +
          'v4-salted forwarders were NOT verifiable because the wallet record carries no feeAddress, ' +
          'and the fee address is part of the v4 CREATE2 salt — if the flush targets a v4/v5-wallet ' +
          'forwarder, the wallet data must carry its feeAddress'
      );
    }
    return false;
  }

  /**
   * Verifies a confidential token transfer (SendERC7984) transaction.
   *
   * With txHex — two on-chain shapes are supported:
   *
   *   sendMultiSig-wrapped (multisig / smart-contract wallet):
   *     tx.to   = wallet contract
   *     tx.data = sendMultiSig(tokenAddr, 0, confidentialTransfer(recipient, handle, proof), ...)
   *     Token contract address is decoded from the sendMultiSig inner calldata.
   *
   *   Direct call (hot / TSS EOA wallet):
   *     tx.to   = token contract
   *     tx.data = confidentialTransfer(recipient, handle, proof)
   *     Token contract address is taken from tx.to.
   *
   *   For both shapes the verifier checks:
   *     1. Token contract address matches this coin's tokenContractAddress.
   *     2. Decoded recipient matches txParams.recipients[0].address or buildParams.recipients[0].address.
   *     3. encryptedHandle and inputProof are structurally present (non-empty).
   *     4. txParams.recipients[0].amount is a positive integer and matches buildParams when both present.
   *
   * Without txHex (first-signer / pre-signing path):
   *  1. Requires exactly one recipient in txParams.
   *  2. Validates txParams.recipients[0].address is a valid Ethereum address.
   *  3. Validates txParams.recipients[0].amount is a positive integer.
   *  4. Cross-checks address and amount against buildParams when the server has stored the intent.
   */
  private async verifyConfidentialTransfer(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild } = params;

    if (!txPrebuild?.txHex) {
      // No raw tx available (multisig first-signer path).
      // Validate ERC7984-specific invariants from txParams and buildParams.
      const recipients = txParams?.recipients;
      if (!recipients || recipients.length === 0) {
        throw new Error('verifyConfidentialTransfer: recipients must contain at least one entry');
      }
      if (recipients.length !== 1) {
        throw new Error(
          `verifyConfidentialTransfer: confidential transfers support exactly 1 recipient, got ${recipients.length}`
        );
      }
      const recipient = recipients[0];
      if (!recipient.address || !this.isValidAddress(recipient.address)) {
        throw new Error(`verifyConfidentialTransfer: recipient address is missing or invalid: ${recipient.address}`);
      }
      const amountStr = String(recipient.amount);
      if (!Erc7984Token.isPositiveIntegerString(amountStr)) {
        throw new Error(
          `verifyConfidentialTransfer: amount must be a positive integer string in base units, got '${amountStr}'`
        );
      }
      // Cross-check against buildParams when the server has already stored the intent
      const buildParamsRecipient = txPrebuild?.buildParams?.recipients?.[0];
      if (buildParamsRecipient?.address !== undefined) {
        if (recipient.address.toLowerCase() !== buildParamsRecipient.address.toLowerCase()) {
          throw new Error(
            `verifyConfidentialTransfer: recipient address mismatch — ` +
              `txParams has '${recipient.address}' but buildParams has '${buildParamsRecipient.address}'`
          );
        }
      }
      const buildParamsAmount = buildParamsRecipient?.amount;
      if (buildParamsAmount !== undefined && buildParamsAmount !== amountStr) {
        throw new Error(
          `verifyConfidentialTransfer: amount mismatch — txParams has '${amountStr}' but buildParams has '${buildParamsAmount}'`
        );
      }
      return true;
    }

    // Parse and decode the raw transaction
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txPrebuild.txHex);
    const tx = await txBuilder.build();
    const txJson = tx.toJson();

    let toAddress: string;
    let tokenContractAddress: string;
    let encryptedHandle: string;
    let inputProof: string;

    try {
      if (txJson.data.startsWith(sendMultisigMethodId)) {
        // sendMultiSig-wrapped path: smart-contract wallet relays the confidentialTransfer call.
        // Token contract address is encoded inside the sendMultiSig calldata.
        const decoded = decodeConfidentialTransferData(txJson.data);
        toAddress = decoded.toAddress;
        tokenContractAddress = decoded.tokenContractAddress;
        encryptedHandle = decoded.encryptedHandle;
        inputProof = decoded.inputProof;
      } else if (txJson.data.startsWith(confidentialTransferWithProofMethodId)) {
        // Direct call path: hot/TSS EOA wallet calls the token contract directly.
        // The transaction's `to` field is the token contract address.
        if (!txJson.to) {
          throw new Error('direct confidentialTransfer call is missing transaction to address');
        }
        const decoded = decodeDirectConfidentialTransferCalldata(txJson.data);
        toAddress = decoded.toAddress;
        tokenContractAddress = txJson.to;
        encryptedHandle = decoded.encryptedHandle;
        inputProof = decoded.inputProof;
      } else {
        throw new Error(`unexpected method ID ${txJson.data.slice(0, 10)}`);
      }
    } catch (e) {
      throw new Error(
        `verifyConfidentialTransfer: failed to decode confidential transfer calldata — ${(e as Error).message}`
      );
    }

    // 1. Token contract address must match this coin
    if (tokenContractAddress.toLowerCase() !== this.tokenContractAddress.toLowerCase()) {
      throw new Error(
        `verifyConfidentialTransfer: token contract address mismatch — ` +
          `expected ${this.tokenContractAddress}, got ${tokenContractAddress}`
      );
    }

    // 2. Recipient address must match txParams.recipients[0] or buildParams.recipients[0]
    const expectedRecipient = txParams?.recipients?.[0]?.address ?? txPrebuild.buildParams?.recipients?.[0]?.address;
    if (!expectedRecipient) {
      throw new Error(
        'verifyConfidentialTransfer: missing expected recipient (provide txParams.recipients or txPrebuild.buildParams.recipients)'
      );
    }
    if (toAddress.toLowerCase() !== expectedRecipient.toLowerCase()) {
      throw new Error(
        `verifyConfidentialTransfer: recipient address mismatch — ` + `expected ${expectedRecipient}, got ${toAddress}`
      );
    }

    // 3. encryptedHandle must be a non-trivial hex value (not bare '0x')
    if (!encryptedHandle || encryptedHandle === '0x') {
      throw new Error('verifyConfidentialTransfer: encryptedHandle is missing or empty in transaction calldata');
    }

    // 4. inputProof must be a non-trivial hex value
    if (!inputProof || inputProof === '0x') {
      throw new Error('verifyConfidentialTransfer: inputProof is missing or empty in transaction calldata');
    }

    // 5. Verify plaintext intent: txParams amount must be valid and consistent with buildParams
    const rawTxParamsAmount = txParams?.recipients?.[0]?.amount;
    if (rawTxParamsAmount !== undefined) {
      const txParamsAmount = String(rawTxParamsAmount);
      if (!Erc7984Token.isPositiveIntegerString(txParamsAmount)) {
        throw new Error(
          `verifyConfidentialTransfer: amount must be a positive integer string in base units, got '${txParamsAmount}'`
        );
      }
      const buildParamsAmount = txPrebuild.buildParams?.recipients?.[0]?.amount;
      if (buildParamsAmount !== undefined && txParamsAmount !== buildParamsAmount) {
        throw new Error(
          `verifyConfidentialTransfer: amount mismatch — txParams has '${txParamsAmount}' but buildParams has '${buildParamsAmount}'`
        );
      }
    }

    return true;
  }

  private static isPositiveIntegerString(value: string): boolean {
    return /^\d+$/.test(value) && BigInt(value) > 0n;
  }

  /**
   * Verifies a token enablement transaction for ERC-7984 decryption delegation.
   *
   * TSS path: decodes the raw tx and verifies it calls the ACL contract with
   * calldata that covers all requested token contract addresses.
   *
   * Multisig path: verifies the buildParams recipients carry the correct tokenNames
   * and zero amounts.
   */
  private async verifyEnableTokenTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, walletType } = params;

    if (walletType === 'tss') {
      // TSS path: full raw-tx decode
      const enableTokens = txParams.enableTokens;
      if (!enableTokens || enableTokens.length === 0) {
        throw new Error('verifyEnableTokenTransaction: enableTokens must be non-empty for TSS path');
      }
      if (!txPrebuild.txHex) {
        throw new Error('verifyEnableTokenTransaction: missing txHex in txPrebuild');
      }

      // Resolve requested token names → contract addresses
      const requestedAddresses = enableTokens.map((t) => {
        const tokenCoin = this.bitgo.coin(t.name) as Erc7984Token;
        return tokenCoin.tokenContractAddress.toLowerCase();
      });

      // Parse the raw transaction
      const txBuilder = this.getTransactionBuilder();
      txBuilder.from(txPrebuild.txHex);
      const tx = await txBuilder.build();
      const txJson = tx.toJson();

      // Verify transaction targets the correct contract based on calldata shape
      const network = this.getNetwork() as EthereumNetwork;
      const aclContractAddress = network?.zamaAclContractAddress;
      if (!aclContractAddress) {
        throw new Error('verifyEnableTokenTransaction: zamaAclContractAddress not configured for this network');
      }
      if (!txJson.to) {
        throw new Error('verifyEnableTokenTransaction: transaction is missing recipient address');
      }

      // Inspect calldata method ID to distinguish root wallet from forwarder wallet:
      //   aclMulticallMethodId   → root wallet: to = ACL contract directly
      //   callFromParentMethodId → forwarder wallet: to = forwarder, ACL address is inside calldata
      const calldataMethodId = txJson.data.slice(0, 10);
      if (calldataMethodId === aclMulticallMethodId) {
        // Root wallet (base address): tx calls the ACL contract directly
        if (txJson.to.toLowerCase() !== aclContractAddress.toLowerCase()) {
          throw new Error(
            `verifyEnableTokenTransaction: transaction target ${txJson.to} does not match ACL contract ${aclContractAddress}`
          );
        }
      } else if (calldataMethodId === callFromParentMethodId) {
        // Forwarder wallet: tx calls the forwarder, which calls the ACL via callFromParent.
        // The forwarder address is wallet-specific and cannot be statically verified here;
        // token address correctness is still verified below via calldata decoding.
      } else {
        throw new Error(
          `verifyEnableTokenTransaction: unrecognised calldata method ID ${calldataMethodId}; expected multicall or callFromParent`
        );
      }

      // Verify value is 0
      if (txJson.value !== '0') {
        throw new Error(`verifyEnableTokenTransaction: expected transaction value 0 but got ${txJson.value}`);
      }

      // Decode token addresses from calldata and verify all requested tokens are present
      const decodedAddresses = decodeTokenAddressesFromDelegationCalldata(txJson.data);
      for (const requested of requestedAddresses) {
        if (!decodedAddresses.includes(requested)) {
          throw new Error(
            `verifyEnableTokenTransaction: requested token ${requested} not found in delegation calldata`
          );
        }
      }

      // CECHO-2720 rollout gate: strict delegation verification is enforced on test and
      // staging environments first; prod keeps the legacy checks above for one release
      // cycle while staging/testnet validation proves there are no false positives.
      // This gate must be removed (enforcing everywhere) in the next release.
      if (this.bitgo.env === 'test' || this.bitgo.env === 'staging') {
        this.verifyStrictEnableTokenCalldata(txJson, aclContractAddress, requestedAddresses);
      }

      return true;
    } else {
      // Multisig path: buildParams-level check
      const recipients = txPrebuild.buildParams?.recipients as
        | Array<{ tokenName?: string; amount?: string }>
        | undefined;
      if (!recipients || recipients.length === 0) {
        throw new Error('verifyEnableTokenTransaction: missing buildParams.recipients for multisig path');
      }

      // Determine requested token names from txParams
      const requestedTokenNames: string[] = [];
      if (txParams.enableTokens && txParams.enableTokens.length > 0) {
        requestedTokenNames.push(...txParams.enableTokens.map((t) => t.name));
      } else if (txParams.recipients && txParams.recipients.length > 0) {
        requestedTokenNames.push(...txParams.recipients.map((r: any) => r.tokenName).filter(Boolean));
      }

      // Verify all recipients have tokenName and amount = '0'
      for (const recipient of recipients) {
        if (!recipient.tokenName) {
          throw new Error('verifyEnableTokenTransaction: recipient is missing tokenName in buildParams');
        }
        if (recipient.amount !== '0') {
          throw new Error(
            `verifyEnableTokenTransaction: expected amount 0 for token enablement but got ${recipient.amount}`
          );
        }
      }

      // Verify requested token names are present in recipients
      if (requestedTokenNames.length > 0) {
        const recipientTokenNames = recipients.map((r) => r.tokenName);
        for (const requested of requestedTokenNames) {
          if (!recipientTokenNames.includes(requested)) {
            throw new Error(
              `verifyEnableTokenTransaction: requested token ${requested} not found in buildParams recipients`
            );
          }
        }
      }

      return true;
    }
  }

  /**
   * Strict CECHO-2720 checks on the delegation calldata, enforced on test/staging
   * environments during the staged rollout. Binds every security-relevant field:
   *   1. every inner multicall entry is a well-formed delegateForUserDecryption call
   *      (fail-closed decoding — no smuggled calls)
   *   2. the decoded token set exactly matches the (deduplicated) requested token set
   *   3. all delegations grant the same delegate, which must equal the pinned
   *      BitGo enterprise viewing key — fail closed when the network pins none
   *   4. every delegation expiry is in the future
   *   5. callFromParent shape: the forwarder must call the ACL contract with zero
   *      native value (blocks forwarder fund exfiltration to an attacker contract)
   *
   * The wallet-owned-forwarder (txJson.to) check of the callFromParent shape is not
   * statically verifiable here; the on-chain onlyParent modifier plus the enforced
   * target/value checks close the fund-theft vector regardless of which forwarder
   * the transaction targets.
   */
  private verifyStrictEnableTokenCalldata(
    txJson: { to?: string; data: string; value: string },
    aclContractAddress: string,
    requestedAddresses: string[]
  ): void {
    const delegation = decodeDelegationCallsFromCalldata(txJson.data);

    // Exact token-set match (CECHO-2720 review: compare as deduplicated sets): every
    // requested token is delegated, nothing unrequested is, and no token twice.
    const requestedTokens = [...new Set(requestedAddresses)];
    const decodedTokens = delegation.calls.map((call) => call.tokenAddress);
    const decodedTokenSet = new Set(decodedTokens);
    for (const requested of requestedTokens) {
      if (!decodedTokenSet.has(requested)) {
        throw new Error(`verifyEnableTokenTransaction: requested token ${requested} not found in delegation calldata`);
      }
    }
    if (decodedTokens.length !== decodedTokenSet.size) {
      throw new Error(
        'verifyEnableTokenTransaction: delegation calldata contains duplicate delegations for the same token'
      );
    }
    if (decodedTokenSet.size !== requestedTokens.length) {
      throw new Error(
        `verifyEnableTokenTransaction: delegation calldata must contain exactly ${requestedTokens.length} distinct token delegation(s) but found ${decodedTokenSet.size}`
      );
    }

    // Delegate binding: all delegations must grant the same delegate, and it must be
    // the pinned BitGo enterprise viewing key. Fail closed when the network pins
    // nothing: without the pin, WHO receives decryption rights cannot be verified.
    const delegates = new Set(delegation.calls.map((call) => call.delegate));
    if (delegates.size !== 1) {
      throw new Error('verifyEnableTokenTransaction: delegation calldata grants inconsistent delegates');
    }
    const expectedDelegate = (this.getNetwork() as EthereumNetwork)?.zamaViewingKeyAddress?.toLowerCase();
    if (expectedDelegate === undefined) {
      throw new Error(
        'verifyEnableTokenTransaction: zamaViewingKeyAddress is not pinned for this network — cannot verify the delegation delegate (fail closed)'
      );
    }
    const [delegate] = [...delegates];
    if (delegate !== expectedDelegate) {
      throw new Error(
        `verifyEnableTokenTransaction: delegation delegate ${delegate} does not match the expected enterprise viewing key ${expectedDelegate}`
      );
    }

    // Expiry sanity: a delegation that is already expired is never legitimate.
    const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
    for (const call of delegation.calls) {
      if (call.expiry <= nowSeconds) {
        throw new Error(`verifyEnableTokenTransaction: delegation for token ${call.tokenAddress} has already expired`);
      }
    }

    // Forwarder shape: the forwarder must call the ACL contract with no native value.
    if (delegation.shape === 'callFromParent') {
      if (delegation.callFromParentTarget !== aclContractAddress.toLowerCase()) {
        throw new Error(
          `verifyEnableTokenTransaction: callFromParent target ${delegation.callFromParentTarget} does not match ACL contract ${aclContractAddress}`
        );
      }
      if (delegation.callFromParentValue !== 0n) {
        throw new Error(
          `verifyEnableTokenTransaction: callFromParent must carry value 0 but got ${delegation.callFromParentValue}`
        );
      }
    }
  }

  /**
   * Override gas limit for ERC-7984 confidential token recovery.
   * Actual on-chain usage is ~506-530k gas based on testnet results.
   * Default: 800,000 (comfortable buffer over observed usage).
   */
  setGasLimit(userGasLimit?: number): number {
    if (!userGasLimit) {
      return 800000;
    }
    return super.setGasLimit(userGasLimit);
  }

  /**
   * Queries the encrypted balance handle for a wallet address via eth_call to the
   * token contract's confidentialBalanceOf(address) function.
   *
   * @param walletAddress - the wallet contract address to query balance for
   * @param apiKey - optional Etherscan API key
   * @returns bytes32 encrypted handle (0x-prefixed, 66 chars).
   *   Note: handles are always non-zero even for zero balances (encrypted domain).
   */
  async queryConfidentialBalance(walletAddress: string, apiKey?: string): Promise<string> {
    const methodSignature = optionalDeps.ethAbi.methodID('confidentialBalanceOf', ['address']);
    const encodedArgs = optionalDeps.ethAbi.rawEncode(['address'], [walletAddress]);
    const calldata = Buffer.concat([methodSignature, encodedArgs]).toString('hex');

    const result = await this.recoveryBlockchainExplorerQuery(
      {
        chainid: this.getChainId().toString(),
        module: 'proxy',
        action: 'eth_call',
        to: this.tokenContractAddress,
        data: calldata,
        tag: 'latest',
      },
      apiKey
    );

    if (!result || !result.result) {
      throw new RecoveryProviderError(
        `Could not obtain confidential balance for ${walletAddress} from token ${this.tokenContractAddress}`
      );
    }

    const handle = result.result as string;
    if (!handle.startsWith('0x') || handle.length !== 66) {
      throw new RecoveryProviderError(`Unexpected confidentialBalanceOf response format: ${handle}`);
    }

    return handle;
  }

  /**
   * Builds a non-BitGo recovery transaction for ERC-7984 confidential tokens.
   *
   * Uses the no-proof handle sweep: confidentialTransfer(recipient, handle) with 2 args.
   * No FHE decryption or proof generation is needed — the wallet transfers its entire
   * encrypted balance handle without knowing the plaintext amount.
   *
   * The outer transaction shape is:
   *   tx.to   = walletContractAddress
   *   tx.data = sendMultiSig(tokenContractAddr, 0, confidentialTransfer(recoveryDest, handle), ...)
   */
  async recover(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    if (params.isTss === true) {
      throw new Error('ERC-7984 TSS recovery is not yet supported');
    }

    if (_.isUndefined(params.userKey)) {
      throw new Error('missing userKey');
    }

    if (_.isUndefined(params.backupKey)) {
      throw new Error('missing backupKey');
    }

    if (_.isUndefined(params.walletPassphrase) && !params.userKey.startsWith('xpub')) {
      throw new Error('missing wallet passphrase');
    }

    if (_.isUndefined(params.walletContractAddress) || !this.isValidAddress(params.walletContractAddress)) {
      throw new Error('invalid walletContractAddress');
    }

    if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    const recoveryKeys = classifyRecoveryKeys(params);
    const { backupKey, isKrsRecovery, isUnsignedSweep } = recoveryKeys;
    let userKey = recoveryKeys.userKey;

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider, { checkCoinFamilySupport: false });
    }

    const gasPrice = params.eip1559
      ? new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas)
      : new optionalDeps.ethUtil.BN(this.setGasPrice(params.gasPrice));
    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit));

    // Decrypt private keys from KeyCard values
    if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
      try {
        userKey = await this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${(e as Error).message}`);
      }
    }

    let backupKeyAddress: string;
    let backupSigningKey: Buffer;

    if (isKrsRecovery || isUnsignedSweep) {
      const backupHDNode = bip32.fromBase58(backupKey);
      backupSigningKey = backupHDNode.publicKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
    } else {
      let backupPrv: string;
      try {
        backupPrv = await this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${(e as Error).message}`);
      }

      const backupHDNode = bip32.fromBase58(backupPrv);
      backupSigningKey = backupHDNode.privateKey as Buffer;
      backupKeyAddress = `0x${optionalDeps.ethUtil.privateToAddress(backupSigningKey).toString('hex')}`;
    }

    await this.assertRecoveryKeysAreWalletSigners(
      userKey,
      backupKeyAddress,
      params.walletContractAddress,
      params.apiKey
    );

    const backupKeyNonce = await this.getAddressNonce(backupKeyAddress, params.apiKey);

    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress, params.apiKey);
    const totalGasNeeded = gasPrice.mul(gasLimit);
    const weiToGwei = 10 ** 9;
    if (backupKeyBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${(backupKeyBalance / weiToGwei).toString()} Gwei.` +
          `This address must have a balance of at least ${(totalGasNeeded / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some ETH to this address then retry.`
      );
    }

    // Get the encrypted balance handle (auto-query or user-provided)
    let encryptedHandle: string;
    if (params.encryptedHandle) {
      encryptedHandle = params.encryptedHandle;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      encryptedHandle = await this.queryConfidentialBalance(params.walletContractAddress, params.apiKey);
    }

    // Note: encrypted handles are always non-zero even for zero balances (encrypted domain).
    // The transfer will execute but move 0 tokens if the wallet is empty.

    // Build the inner calldata: confidentialTransfer(recoveryDestination, handle)
    const innerCalldata = buildConfidentialTransferByHandleCalldata(params.recoveryDestination, encryptedHandle);

    // For sendMultiSig: recipient is the token contract, amount is 0, data carries the confidentialTransfer calldata
    const recipients = [
      {
        address: this.tokenContractAddress,
        amount: '0',
        data: optionalDeps.ethUtil.stripHexPrefix(innerCalldata),
      },
    ];

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(params.walletContractAddress, params.apiKey);

    let operationHash: string | undefined;
    let signature: string | undefined;
    if (!isUnsignedSweep) {
      operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
      signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userKey));

      try {
        Util.ecRecoverEthAddress(operationHash, signature);
      } catch (e) {
        throw new Error('Invalid signature');
      }
    }

    const txInfo = {
      recipient: recipients[0],
      expireTime: this.getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      operationHash: operationHash,
      signature: signature ?? '',
      gasLimit: gasLimit.toString(10),
    };

    const sendMethodArgs = this.getSendMethodArgs(txInfo);
    const methodSignature = optionalDeps.ethAbi.methodID(this.sendMethodName, _.map(sendMethodArgs, 'type'));
    const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
    const sendData = Buffer.concat([methodSignature, encodedArgs]);

    let tx = Eth.buildTransaction({
      to: params.walletContractAddress,
      nonce: backupKeyNonce,
      value: 0,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      data: sendData,
      eip1559: params.eip1559,
      replayProtectionOptions: params.replayProtectionOptions,
    });

    if (isUnsignedSweep) {
      return this.formatForOfflineVault(
        txInfo,
        tx,
        userKey,
        backupKey,
        gasPrice,
        gasLimit,
        params.eip1559,
        params.replayProtectionOptions,
        params.apiKey
      ) as any;
    }

    if (!isKrsRecovery) {
      tx = tx.sign(backupSigningKey);
    }

    const signedTx: RecoveryInfo = {
      id: optionalDeps.ethUtil.bufferToHex(tx.hash()),
      tx: tx.serialize().toString('hex'),
    };

    if (isKrsRecovery) {
      signedTx.backupKey = backupKey;
      signedTx.coin = this.getChain();
    }

    return signedTx;
  }

  /**
   * Returns a DecryptionDelegationBuilder for constructing Zama ACL decryption
   * delegation transactions.
   *
   * The builder produces a DecryptionDelegationTxRequest {to, data, value} that is
   * wallet-type-agnostic — WP routes it to the correct signing path:
   * - MPC: submit as a raw TSS transaction
   * - Multisig: wrap in sendMultiSig(walletContract, to, 0, data, ...)
   *
   * Example:
   *   const req = coin.getDecryptionDelegationBuilder().build({
   *     aclContractAddress: '0xf0Ff...',
   *     delegateAddress:    enterpriseViewingKey,
   *     tokenContractAddresses: [tokenAddress],
   *     expiryTimestamp:    Math.floor(Date.now() / 1000) + 365 * 86400,
   *   });
   */
  getDecryptionDelegationBuilder(): DecryptionDelegationBuilder {
    return new DecryptionDelegationBuilder();
  }
}
