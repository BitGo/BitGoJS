import { BaseCoin as StaticsBaseCoin, CoinFamily, coins, FlareNetwork } from '@bitgo/statics';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  VerifyAddressOptions,
  TransactionType,
  ITransactionRecipient,
  InvalidAddressError,
  UnexpectedAddressError,
  InvalidTransactionError,
  BaseTransaction,
  SigningError,
  MethodNotImplementedError,
  SignableTransaction,
  isAvalancheAtomicTx,
} from '@bitgo/sdk-core';
import * as FlrpLib from './lib';
import {
  ADDRESS_SEPARATOR,
  CreatePairedWalletParams,
  CreatePairedWalletResponse,
  FlrpEntry,
  FlrpExplainTransactionOptions,
  FlrpSignTransactionOptions,
  FlrpTransactionParams,
  FlrpVerifyTransactionOptions,
} from './lib/iface';
import utils from './lib/utils';
import BigNumber from 'bignumber.js';
import { isValidAddress as isValidEthAddress } from 'ethereumjs-util';
import { pvmSerial, TransferOutput, UnsignedTx } from '@flarenetwork/flarejs';

/**
 * FlareJS import gas model, mirroring the gas-cost function flarejs applies in
 * newImportTxFromBaseFee: one gas per serialized unsigned-tx byte, gas per signature
 * slot, plus the fixed AtomicTxBaseCost.
 */
const IMPORT_GAS_PER_SIGNATURE = 1000n;
const IMPORT_TX_BASE_GAS = 10000n;

/**
 * Verification-time ceiling on the per-gas fee rate (nFLR per gas unit) an import may
 * burn (CECHO-2717 review follow-up). Flare C-chain base fees are historically in the
 * tens of nFLR per gas (the CECHO-2717 fixtures use 25); 1000 nFLR/gas is ~40x that,
 * absorbing base-fee volatility and P-chain fee-state spikes while still bounding a
 * compromised prebuild: the burned fee can never exceed gasCost x 1000, however many
 * UTXOs the import consumes.
 */
const MAX_IMPORT_FEE_RATE_PER_GAS = 1000n;

/**
 * Normalize an address (or tilde-joined owner set) for comparison: case-insensitive
 * and order-insensitive over the sorted owner set. Handles both single addresses and
 * multisig owner sets for P-chain destinations.
 */
function normalizeAddressSet(address: string): string {
  return address
    .split(ADDRESS_SEPARATOR)
    .map((a) => a.trim().toLowerCase())
    .sort()
    .join(ADDRESS_SEPARATOR);
}

export class Flrp extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Flrp(bitgo, staticsCoin);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }
  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }
  getFullName(): string {
    return this._staticsCoin.fullName;
  }
  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritdoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritdoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  async verifyTransaction(params: FlrpVerifyTransactionOptions): Promise<boolean> {
    const txHex = params.txPrebuild && params.txPrebuild.txHex;
    if (!txHex) {
      throw new Error('missing required tx prebuild property txHex');
    }
    let tx;
    try {
      const txBuilder = this.getBuilder().from(txHex);
      tx = await txBuilder.build();
    } catch (error) {
      throw new Error(`Invalid transaction: ${error.message}`);
    }
    const explainedTx = tx.explainTransaction();

    const type = params.txParams.type;
    // WP intentType aliases (lowercase) must map to TransactionType enum keys.
    // 'ImportToC' aliases to 'Import' (TransactionType has no ImportToC key — the previous
    // gate exemption for it was masking that gap and skipped the type check entirely).
    const normalizedType =
      type === 'stake'
        ? 'AddPermissionlessDelegator'
        : type === 'export'
        ? 'Export'
        : type === 'import' || type === 'importtoc' || type === 'ImportToC'
        ? 'Import'
        : type;

    // When type is provided, verify it matches the parsed transaction.
    // When type is not provided (MPC/TSS intent flow where buildParams are unavailable),
    // rely on explainedTx.type from the parsed hex — but every branch below still
    // validates the destination/value fields it can bind to intent.
    if (normalizedType && explainedTx.type !== TransactionType[normalizedType]) {
      throw new Error('Tx type does not match with expected txParams type');
    }

    switch (explainedTx.type) {
      case TransactionType.Export:
        if (!params.txParams.recipients || params.txParams.recipients?.length !== 1) {
          throw new Error('Export Tx requires a recipient');
        } else {
          this.validateExportTx(params.txParams.recipients, explainedTx, tx);
        }
        break;
      case TransactionType.Import:
        if (tx.isTransactionForCChain) {
          // Import to C-chain: the single output pays all imported value to a C-chain
          // address, which must equal the expected recipient (CECHO-2717) — a prebuild
          // paying the wallet's in-flight UTXOs to any other address must fail.
          if (explainedTx.outputs.length !== 1) {
            throw new Error('Expected 1 output in import transaction');
          }
          if (!params.txParams.recipients || params.txParams.recipients.length !== 1) {
            throw new Error('Expected 1 recipient in import transaction');
          }
          const importDestination = explainedTx.outputs[0].address;
          const expectedCDestination = params.txParams.recipients[0].address;
          if (!isValidEthAddress(importDestination)) {
            throw new Error(`Invalid C-chain import destination: ${importDestination}`);
          }
          // The expected recipient must come from the caller's request — the TSS signing
          // flow resolves recipients from the persisted intent, and prebuild flows carry
          // the caller's request params. RESIDUAL TRUST ASSUMPTION: on the TSS path the
          // intent itself is stored server-side, so a platform that controls both the
          // intent and the prebuild is not caught by this comparison; there is no
          // wallet-side C-chain anchor to cross-check against either (the paired C
          // address is keccak(pubkey)[12:], which cannot be derived from the P-chain
          // rootAddress — bech32 carries only ripemd160(pubkey)). Defense against a
          // fully compromised platform rests on the sdk-core digest-binding work, not here.
          if (typeof expectedCDestination !== 'string' || !isValidEthAddress(expectedCDestination)) {
            throw new Error(`Invalid expected C-chain import recipient: ${expectedCDestination}`);
          }
          if (importDestination.toLowerCase() !== expectedCDestination.toLowerCase()) {
            throw new Error(
              `Import destination ${importDestination} does not match the expected recipient ${expectedCDestination}`
            );
          }
          this.validateImportTx(explainedTx.inputs, params.txParams);
          this.validateImportFee(explainedTx, tx);
        } else {
          // Import to P-chain: the output owner set receiving the imported value must be
          // the wallet's own address, with its spend policy preserved (CECHO-2717).
          if (explainedTx.outputs.length !== 1) {
            throw new Error('Expected 1 output in import transaction');
          }
          this.validateImportTx(explainedTx.inputs, params.txParams);
          this.validateImportDestination(explainedTx.outputs[0].address, params);
          this.validateImportOutputPolicy(tx, params);
          this.validateImportFee(explainedTx, tx);
        }
        break;
      case TransactionType.AddPermissionlessDelegator:
        if (params.txParams.stakingOptions) {
          this.validateDelegationTx(params.txParams, explainedTx);
          this.validateDelegationOwners(tx, params);
        }
        break;
      default:
        throw new Error('Tx type is not supported yet');
    }
    return true;
  }

  /**
   * Check if export txn is valid, based on expected tx params.
   *
   * @param {ITransactionRecipient[]} recipients expected recipients and info
   * @param {FlrpLib.TransactionExplanation} explainedTx explained export transaction
   * @param {FlrpLib.Transaction} tx parsed transaction, used to distinguish the export direction
   */
  validateExportTx(
    recipients: ITransactionRecipient[],
    explainedTx: FlrpLib.TransactionExplanation,
    tx: FlrpLib.Transaction
  ): void {
    if (recipients.length !== 1 || explainedTx.outputs.length !== 1) {
      throw new Error('Export Tx requires one recipient');
    }

    const maxImportFee = (this._staticsCoin.network as FlareNetwork).maxImportFee;
    const recipientAmount = new BigNumber(recipients[0].amount);
    if (
      recipientAmount.isGreaterThan(explainedTx.outputAmount) ||
      recipientAmount.plus(maxImportFee).isLessThan(explainedTx.outputAmount)
    ) {
      throw new Error(
        `Tx total amount ${explainedTx.outputAmount} does not match with expected total amount field ${recipientAmount} and max import fee ${maxImportFee}`
      );
    }

    if (explainedTx.outputs && !utils.isValidAddress(explainedTx.outputs[0].address)) {
      throw new Error(`Invalid P-chain address ${explainedTx.outputs[0].address}`);
    }

    if (tx.isTransactionForCChain) {
      // C→P export: the outputs are the P-chain owner set the recipient names. Bind the
      // destination when the caller carries a non-empty address (review hardening for
      // CECHO-2717); an empty placeholder (destination supplied by the later import) is
      // not comparable.
      const expectedExportDestination = recipients[0].address;
      if (expectedExportDestination) {
        if (!utils.isValidAddress(expectedExportDestination)) {
          throw new Error(`Invalid expected export destination: ${expectedExportDestination}`);
        }
        const exportDestination = explainedTx.outputs[0].address;
        if (normalizeAddressSet(exportDestination) !== normalizeAddressSet(expectedExportDestination)) {
          throw new Error(
            `Export destination ${exportDestination} does not match the expected recipient ${expectedExportDestination}`
          );
        }
      }
    }
    // P→C export: the exported outputs are owned by the wallet's own addresses
    // (ExportInPTxBuilder pays the wallet's fromAddresses — the C destination is the
    // wallet's paired C address, supplied by the later import). A non-empty recipient
    // here is the C-chain destination, which is not comparable to the P-form output
    // owner set, so it is deliberately not bound — binding it would reject flows that
    // pass the C destination.
  }

  /**
   * Check if import txn into P is valid, based on expected tx params.
   *
   * @param {FlrpEntry[]} explainedTxInputs tx inputs (unspents to be imported)
   * @param {FlrpTransactionParams} txParams expected tx info to check against
   */
  validateImportTx(explainedTxInputs: FlrpEntry[], txParams: FlrpTransactionParams): void {
    if (txParams.unspents) {
      if (explainedTxInputs.length !== txParams.unspents.length) {
        throw new Error(`Expected ${txParams.unspents.length} UTXOs, transaction had ${explainedTxInputs.length}`);
      }

      const unspents = new Set(txParams.unspents);

      for (const unspent of explainedTxInputs) {
        if (!unspents.has(unspent.id)) {
          throw new Error(`Transaction should not contain the UTXO: ${unspent.id}`);
        }
      }
    }
  }

  /**
   * Check that an import to P-chain pays the wallet's own address (CECHO-2717).
   * The expected destination comes from txParams recipients when supplied, else from
   * the wallet's rootAddress. Addresses are tilde-joined owner sets; comparison is
   * order- and case-insensitive over the sorted owner set.
   *
   * @param {string} outputAddress P-chain destination of the import output (from the parsed prebuild)
   * @param {FlrpVerifyTransactionOptions} params verification params carrying intent and wallet
   * @throws Error when no expected destination is available or the destination does not match
   */
  validateImportDestination(outputAddress: string, params: FlrpVerifyTransactionOptions): void {
    const recipientAddress =
      params.txParams.recipients && params.txParams.recipients.length > 0
        ? params.txParams.recipients[0].address
        : undefined;
    const walletRootAddress = params.wallet?.coinSpecific()?.rootAddress;

    // When both intent sources are present they must agree — an import pays the wallet
    // itself, so a recipient that disagrees with the wallet's rootAddress is ambiguous
    // and fails closed instead of one source silently overriding the other (review
    // hardening for CECHO-2717).
    if (recipientAddress && walletRootAddress) {
      if (!utils.isValidAddress(recipientAddress) || !utils.isValidAddress(walletRootAddress)) {
        throw new Error(`Invalid import destination intent: ${recipientAddress} / ${walletRootAddress}`);
      }
      if (normalizeAddressSet(recipientAddress) !== normalizeAddressSet(walletRootAddress)) {
        throw new Error(
          `Import destination intent conflict: txParams recipient ${recipientAddress} does not match wallet rootAddress ${walletRootAddress}`
        );
      }
    }

    // receiveAddress is a second wallet-anchored source (platform wallet data, not the
    // prebuild under verification) — used as a last-resort anchor so wallets whose
    // coinSpecific lacks a P-form rootAddress still verify instead of failing closed.
    const walletReceiveAddress = params.wallet?.receiveAddress();
    const expectedDestination = recipientAddress || walletRootAddress || walletReceiveAddress;

    if (!expectedDestination) {
      throw new Error(
        'Unable to verify import destination: no expected address provided in txParams.recipients or wallet rootAddress'
      );
    }

    if (!utils.isValidAddress(outputAddress)) {
      throw new Error(`Invalid P-chain import destination: ${outputAddress}`);
    }
    if (!utils.isValidAddress(expectedDestination)) {
      throw new Error(`Invalid expected import destination: ${expectedDestination}`);
    }

    if (normalizeAddressSet(outputAddress) !== normalizeAddressSet(expectedDestination)) {
      throw new Error(
        `Import destination ${outputAddress} does not match the expected wallet destination ${expectedDestination}`
      );
    }
  }

  /**
   * Bind the import-to-P output's spend policy (review hardening for CECHO-2717):
   * the output must be immediately spendable (locktime 0), consume at least one UTXO,
   * be structurally sound (threshold between 1 and the owner count), and — the binding
   * that matters — spend with the wallet's own spend policy: the output threshold must
   * equal the threshold on the wallet record (1 for TSS wallets, 2 for 2-of-3 multisig),
   * the same independently established value wallet-platform passes to the import
   * builder. A prebuild weakening the spend policy over the wallet's own addresses
   * (for example a 1-of-3 output for a 2-of-3 wallet) must fail verification, and a
   * missing wallet threshold fails closed rather than falling back to the loose range
   * check.
   *
   * The output threshold is deliberately NOT bound to the consumed UTXOs' thresholds:
   * those are set by whoever created the atomic UTXO (the earlier export) and may
   * legitimately differ from the wallet's output threshold — importing a 1-of-N UTXO
   * into a 2-of-3 output is valid.
   *
   * @param {FlrpLib.Transaction} tx the parsed transaction carrying the raw outputs
   * @param {FlrpVerifyTransactionOptions} params verification params carrying the wallet record
   * @throws Error when the output locktime is nonzero, the import consumes no UTXOs,
   * the output threshold is structurally invalid, or the output threshold does not
   * match the wallet's spend threshold
   */
  validateImportOutputPolicy(tx: FlrpLib.Transaction, params: FlrpVerifyTransactionOptions): void {
    const pvmImportTx = (tx.getFlareTransaction() as UnsignedTx).getTx() as pvmSerial.ImportTx;
    const output = pvmImportTx.baseTx.outputs[0].output as TransferOutput;

    const locktime = output.getLocktime();
    if (locktime !== 0n) {
      throw new Error(
        `Import output locktime ${locktime} must be 0 — a time-locked output would freeze the wallet's funds`
      );
    }

    if (pvmImportTx.ins.length === 0) {
      throw new Error('Import transaction consumes no UTXOs; refusing to verify');
    }

    const threshold = output.getThreshold();
    const ownerCount = output.getOwners().length;
    if (threshold < 1 || threshold > ownerCount) {
      throw new Error(`Import output threshold ${threshold} is invalid for ${ownerCount} owner(s); refusing to verify`);
    }

    // The wallet record is platform wallet data, not the prebuild under verification —
    // the threshold it carries is the independently established wallet spend policy.
    // Cast: the flrp wallet subdocument serializes its P-chain spend threshold into
    // coinSpecific (wallet-platform flrp.schema), which sdk-core's WalletCoinSpecific
    // does not model; the typeof guard below validates the value before use.
    const coinSpecific = params.wallet?.coinSpecific() as { threshold?: unknown } | undefined;
    const walletThreshold = coinSpecific?.threshold;
    if (typeof walletThreshold !== 'number' || !Number.isInteger(walletThreshold) || walletThreshold < 1) {
      throw new Error(
        'Import output threshold cannot be verified: the wallet spend threshold is unavailable; refusing to verify'
      );
    }
    if (threshold !== walletThreshold) {
      throw new Error(
        `Import output threshold ${threshold} does not match the wallet's spend threshold ${walletThreshold}; refusing to verify`
      );
    }
  }

  /**
   * Bound the fee burned by an import (review hardening for CECHO-2717): the
   * difference between consumed input value and the output value is burned as the
   * import fee. The bound is gas-aware because flarejs charges per serialized byte
   * and per signature slot (plus the fixed AtomicTxBaseCost): a large import
   * legitimately burns a fee that scales with its own size, so a flat cap alone would
   * reject every such import. The burned fee must stay within the larger of the
   * network's flat maxImportFee and this transaction's own gas cost priced at the
   * MAX_IMPORT_FEE_RATE_PER_GAS ceiling — a prebuild paying the right destination a
   * dust amount while burning the rest as fee still exceeds that bound and fails.
   *
   * @param {FlrpLib.TransactionExplanation} explainedTx parsed import explanation
   * @param {FlrpLib.Transaction} tx the parsed transaction whose gas cost bounds the fee
   * @throws Error when the burned fee exceeds the gas-aware import fee bound
   */
  validateImportFee(explainedTx: FlrpLib.TransactionExplanation, tx: FlrpLib.Transaction): void {
    const maxImportFee = new BigNumber((this._staticsCoin.network as FlareNetwork).maxImportFee);
    // Input entries carry `value`; output entries carry `amount` (explainTransaction
    // maps outputs to { address, amount }). Fail closed when either total is not a
    // finite number — a field mismatch must never silently disable the cap.
    const consumedTotal = (explainedTx.inputs as unknown as FlrpEntry[]).reduce(
      (sum, input) => sum.plus(input.value),
      new BigNumber(0)
    );
    const importedTotal = new BigNumber(explainedTx.outputs[0].amount);
    if (!consumedTotal.isFinite() || !importedTotal.isFinite()) {
      throw new Error('Import fee cap: input/output totals are not finite numbers; refusing to verify');
    }
    const burnedFee = consumedTotal.minus(importedTotal);
    const feeBound = BigNumber.max(maxImportFee, this.importGasCost(tx).times(MAX_IMPORT_FEE_RATE_PER_GAS.toString()));
    if (burnedFee.isGreaterThan(feeBound)) {
      throw new Error(
        `Import burns ${burnedFee.toString()} in fees, exceeding the gas-aware import fee bound ${feeBound.toString()} (network maxImportFee ${maxImportFee.toString()})`
      );
    }
  }

  /**
   * Gas this import charges under FlareJS's import gas model: one gas per serialized
   * unsigned-tx byte, IMPORT_GAS_PER_SIGNATURE per signature slot, plus the fixed
   * IMPORT_TX_BASE_GAS (AtomicTxBaseCost). Mirrors the gas-cost function flarejs
   * applies in newImportTxFromBaseFee, computed from the parsed transaction under
   * verification so the fee bound tracks the transaction's real cost.
   *
   * @param {FlrpLib.Transaction} tx the parsed import transaction
   * @returns {BigNumber} the import's gas cost in gas units
   */
  importGasCost(tx: FlrpLib.Transaction): BigNumber {
    const unsignedTx = tx.getFlareTransaction() as UnsignedTx;
    const sigIndices = unsignedTx.getSigIndices() as number[][];
    const signatureCount = sigIndices.reduce((total, indices) => total + indices.length, 0);
    const gasUnits =
      BigInt(unsignedTx.toBytes().length) + IMPORT_GAS_PER_SIGNATURE * BigInt(signatureCount) + IMPORT_TX_BASE_GAS;
    return new BigNumber(gasUnits.toString());
  }

  /**
   * Validate AddPermissionlessDelegator transaction parameters.
   * Validates both expected txParams and the parsed explainedTx for consistency.
   *
   * @param {FlrpTransactionParams} txParams - Expected transaction parameters
   * @param {FlrpLib.TransactionExplanation} explainedTx - Parsed transaction explanation
   */
  validateDelegationTx(txParams: FlrpTransactionParams, explainedTx: FlrpLib.TransactionExplanation): void {
    if (!txParams.stakingOptions) {
      throw new Error('Delegation transaction requires stakingOptions');
    }

    const { nodeID, amount, durationSeconds, rewardAddress } = txParams.stakingOptions;

    if (!nodeID) {
      throw new Error('Delegation transaction requires nodeID');
    }

    if (!amount) {
      throw new Error('Delegation transaction requires amount');
    }

    if (!durationSeconds) {
      throw new Error('Delegation transaction requires durationSeconds');
    }

    if (!rewardAddress) {
      throw new Error('Delegation transaction requires rewardAddress');
    }

    // Validate nodeID format using utility method
    if (!utils.isValidNodeID(nodeID)) {
      throw new Error(`Invalid nodeID format: ${nodeID}`);
    }
    // Bind the staked node: the parsed transaction's validator nodeId (exposed as the
    // delegation output address) must equal the requested nodeID — a prebuild staking
    // to a different node than the user chose must fail (review hardening for CECHO-2717).
    // Fail closed when the parsed tx exposes no nodeId: there is nothing to compare.
    const txNodeId = explainedTx.outputs.length > 0 ? explainedTx.outputs[0].address : undefined;
    if (!txNodeId) {
      throw new Error('Delegation transaction does not expose the validator nodeId; refusing to verify');
    }
    if (txNodeId !== nodeID) {
      throw new Error(`Delegation nodeID mismatch: expected ${nodeID}, transaction delegates to ${txNodeId}`);
    }

    // Validate that the parsed transaction's output amount matches the expected staking amount
    // The outputAmount in explainedTx represents the total stake amount in the transaction
    if (explainedTx.outputAmount) {
      const expectedAmount = new BigNumber(amount);
      const actualAmount = new BigNumber(explainedTx.outputAmount);
      if (!expectedAmount.isEqualTo(actualAmount)) {
        throw new Error(`Delegation amount mismatch: expected ${amount}, transaction has ${explainedTx.outputAmount}`);
      }
    }
  }

  /**
   * Bind the delegation's stake and reward ownership (review hardening for CECHO-2717):
   * a compromised platform can serve a delegation to the right node for the right
   * amount while returning the stake to an attacker owner set or paying rewards to an
   * attacker address. The stake owner set is bound to the wallet's own addresses when
   * an anchor is available, and the delegator rewards owner must equal the requested
   * stakingOptions.rewardAddress (P-/C- prefix-insensitive). Fails closed when the
   * parsed transaction exposes no stake outputs or no rewards owner.
   *
   * @param {FlrpLib.Transaction} tx parsed delegation transaction
   * @param {FlrpVerifyTransactionOptions} params verification params carrying intent and wallet
   */
  validateDelegationOwners(tx: FlrpLib.Transaction, params: FlrpVerifyTransactionOptions): void {
    const rewardAddress = params.txParams.stakingOptions?.rewardAddress;
    if (!rewardAddress) {
      throw new Error('Delegation transaction requires stakingOptions.rewardAddress');
    }
    const network = this._staticsCoin.network as FlareNetwork;
    const pvmDelegatorTx = (tx.getFlareTransaction() as UnsignedTx).getTx() as pvmSerial.AddPermissionlessDelegatorTx;

    if (pvmDelegatorTx.stake.length === 0) {
      throw new Error('Delegation transaction exposes no stake outputs; refusing to verify');
    }
    const stakeOwners = (pvmDelegatorTx.stake[0].output as TransferOutput)
      .getOwners()
      .map((owner) => utils.addressToString(network.hrp, 'P', Buffer.from(owner)))
      .sort()
      .join(ADDRESS_SEPARATOR);

    // Stake outputs are built from the signing keys (user+bitgo, or backup+bitgo in
    // recovery), which are a SUBSET of the wallet's full owner set — exact-set equality
    // against the wallet anchor would reject every multisig delegation. Require the
    // stake owners to be contained in the wallet's owner set instead.
    const walletAnchor = params.wallet?.coinSpecific()?.rootAddress || params.wallet?.receiveAddress();
    if (walletAnchor) {
      const anchorOwners = new Set(normalizeAddressSet(walletAnchor).split(ADDRESS_SEPARATOR));
      const stakeOwnerList = normalizeAddressSet(stakeOwners).split(ADDRESS_SEPARATOR);
      const foreignOwner = stakeOwnerList.find((owner) => !anchorOwners.has(owner));
      if (foreignOwner) {
        throw new Error(
          `Delegation stake owner ${foreignOwner} is not one of the wallet's own addresses ${walletAnchor}`
        );
      }
    }

    // Compare rewards owners by decoded address bytes so every accepted form of
    // stakingOptions.rewardAddress matches: bech32 P-/C- prefixed forms and 0x-prefixed
    // or raw hex (parseAddress decodes all of them).
    const rewardsOwner = pvmDelegatorTx.getDelegatorRewardsOwner();
    if (rewardsOwner.addrs.length !== 1) {
      throw new Error(
        `Delegation rewards owner must be a single address, transaction has ${rewardsOwner.addrs.length} owner(s)`
      );
    }
    const onChainRewardBytes = Buffer.from(rewardsOwner.addrs[0].toBytes());
    let expectedRewardBytes: Buffer;
    try {
      expectedRewardBytes = utils.parseAddress(rewardAddress);
    } catch (error) {
      throw new Error(`Invalid stakingOptions.rewardAddress '${rewardAddress}': ${(error as Error).message}`);
    }
    if (!onChainRewardBytes.equals(expectedRewardBytes)) {
      throw new Error(
        `Delegation rewards owner 0x${onChainRewardBytes.toString(
          'hex'
        )} does not match the requested rewardAddress ${rewardAddress}`
      );
    }
  }

  private getBuilder(): FlrpLib.TransactionBuilderFactory {
    return new FlrpLib.TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /**
   * Check if address is valid, then make sure it matches the root address.
   *
   * @param params.address address to validate
   * @param params.keychains public keys to generate the wallet
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    const { address, keychains } = params;

    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }

    // multisig addresses are separated by ~
    const splitAddresses = address.split('~');

    // MPC/TSS: single address derived from common keychain
    if (splitAddresses.length === 1 && keychains?.length === 1) {
      const expectedAddr = new FlrpLib.KeyPair({ pub: keychains[0].pub }).getAddress(this._staticsCoin.network.type);
      if (expectedAddr !== address) {
        throw new UnexpectedAddressError(`address validation failure: ${address} is not of this wallet`);
      }
      return true;
    }

    if (!keychains || keychains.length !== 3) {
      throw new Error('Invalid keychains');
    }

    // derive addresses from keychain
    const unlockAddresses = keychains.map((keychain) =>
      new FlrpLib.KeyPair({ pub: keychain.pub }).getAddress(this._staticsCoin.network.type)
    );

    if (splitAddresses.length !== unlockAddresses.length) {
      throw new UnexpectedAddressError(`address validation failure: multisig address length does not match`);
    }

    if (!this.adressesArraysMatch(splitAddresses, unlockAddresses)) {
      throw new UnexpectedAddressError(`address validation failure: ${address} is not of this wallet`);
    }

    return true;
  }

  /**
   * Validate that two multisig address arrays have the same elements, order doesnt matter
   * @param addressArray1
   * @param addressArray2
   * @returns true if address arrays have the same addresses
   * @private
   */
  private adressesArraysMatch(addressArray1: string[], addressArray2: string[]) {
    return JSON.stringify(addressArray1.sort()) === JSON.stringify(addressArray2.sort());
  }

  /**
   * Generate Flrp key pair
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new FlrpLib.KeyPair({ seed }) : new FlrpLib.KeyPair();
    const keys = keyPair.getKeys();

    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }

    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {string} pub the prv to be checked
   * @returns is it valid?
   */
  isValidPub(pub: string): boolean {
    try {
      new FlrpLib.KeyPair({ pub });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Return boolean indicating whether input is valid private key for the coin
   *
   * @param {string} prv the prv to be checked
   * @returns is it valid?
   */
  isValidPrv(prv: string): boolean {
    try {
      new FlrpLib.KeyPair({ prv });
      return true;
    } catch (e) {
      return false;
    }
  }

  isValidAddress(address: string | string[]): boolean {
    if (address === undefined) {
      return false;
    }

    // validate eth address for cross-chain txs to c-chain
    if (typeof address === 'string' && isValidEthAddress(address)) {
      return true;
    }

    return FlrpLib.Utils.isValidAddress(address);
  }

  /**
   * Get the raw bytes that need to be signed by the MPC ceremony.
   * MPC.sign() internally SHA-256 hashes, so return raw unsigned tx bytes.
   */
  async getSignablePayload(txHex: string): Promise<Buffer> {
    const txBuilder = this.getBuilder().from(txHex);
    const tx = (await txBuilder.build()) as FlrpLib.Transaction;
    return Buffer.from(tx.signablePayload);
  }

  /**
   * Inject an MPC-produced signature into an unsigned transaction.
   * @param txHex - Unsigned transaction hex
   * @param signature - 65-byte ECDSA signature (r || s || recovery)
   * @returns Signed transaction hex
   */
  async addSignatureToTransaction(txHex: string, signature: Buffer): Promise<string> {
    const txBuilder = this.getBuilder().from(txHex);
    const tx = await txBuilder.build();
    (tx as FlrpLib.Transaction).addExternalSignature(new Uint8Array(signature));
    return tx.toBroadcastFormat();
  }

  /**
   * Signs Avaxp transaction
   */
  async signTransaction(params: FlrpSignTransactionOptions): Promise<SignedTransaction> {
    // deserialize raw transaction (note: fromAddress has onchain order)
    const txBuilder = this.getBuilder().from(params.txPrebuild.txHex);
    const key = params.prv;

    // push the keypair to signer array
    txBuilder.sign({ key });

    // build the transaction
    const transaction: BaseTransaction = await txBuilder.build();
    if (!transaction) {
      throw new InvalidTransactionError('Error while trying to build transaction');
    }
    return transaction.signature.length >= 2
      ? { txHex: transaction.toBroadcastFormat() }
      : { halfSigned: { txHex: transaction.toBroadcastFormat() } };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Explain a Avaxp transaction from txHex
   * @param params
   * @param callback
   */
  async explainTransaction(params: FlrpExplainTransactionOptions): Promise<FlrpLib.TransactionExplanation> {
    const txHex = params.txHex ?? params?.halfSigned?.txHex;
    if (!txHex) {
      throw new Error('missing transaction hex');
    }
    try {
      const txBuilder = this.getBuilder().from(txHex);
      const tx = (await txBuilder.build()) as FlrpLib.Transaction;
      const explanation = tx.explainTransaction();

      // For a C→P export (ExportInC viewed from the FLRP P-chain perspective), the
      // exportedOutputs contain the P-chain UTXO amount, which is the gross amount
      // BEFORE the import fee is deducted. The platform uses this explanation to show
      // the "pending import amount" before the ImportInP is confirmed. To avoid
      // displaying a higher-than-actual amount, subtract the minimum import-to-P fee
      // so the displayed amount reflects the expected net P-chain receipt.
      if (tx.isTransactionForCChain && explanation.type === TransactionType.Export) {
        const minImportToPFee = BigInt((this._staticsCoin.network as FlareNetwork).minImportToPFee);
        const adjustedOutputs = explanation.outputs.map((o) => ({
          ...o,
          amount: (BigInt(o.amount) - minImportToPFee).toString(),
        }));
        const adjustedOutputAmount = (BigInt(explanation.outputAmount) - minImportToPFee).toString();
        return {
          ...explanation,
          outputs: adjustedOutputs,
          outputAmount: adjustedOutputAmount,
        };
      }

      return explanation;
    } catch (e) {
      throw new Error(`Invalid transaction: ${e.message}`);
    }
  }

  recoverySignature(messageHash: Buffer, signature: Buffer): Buffer {
    return FlrpLib.Utils.recoverySignature(messageHash, signature);
  }

  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const prv = new FlrpLib.KeyPair(key).getPrivateKey();
    if (!prv) {
      throw new SigningError('Invalid key pair options');
    }
    if (typeof message === 'string') {
      message = Buffer.from(message, 'hex');
    }
    return FlrpLib.Utils.createSignature(this._staticsCoin.network as FlareNetwork, message, prv);
  }

  /**
   * Returns true when the signableHex for this transaction is already the
   * final signing hash (SHA-256 for Avalanche atomic txs), and the MPC
   * signing flow should use it directly without additional hashing.
   */
  isSignablePreHashed(unsignedTx: SignableTransaction): boolean {
    return isAvalancheAtomicTx(unsignedTx);
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams): void {
    throw new MethodNotImplementedError();
  }

  async createPairedWallet(params: CreatePairedWalletParams): Promise<CreatePairedWalletResponse> {
    const { walletId, label } = params;
    return this.bitgo
      .post(this.url(`/wallet/${walletId}/create-paired-wallet`))
      .send(label ? { label } : {})
      .result();
  }
}
