import { BaseCoin as StaticsBaseCoin, CoinFamily, coins, FlareNetwork } from '@bitgo/statics';
import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  EcdsaUtils,
  IWallet,
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
  CreatePairedWalletParams,
  CreatePairedWalletResponse,
  ADDRESS_SEPARATOR,
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
    const normalizedType =
      type === 'stake'
        ? 'AddPermissionlessDelegator'
        : type === 'import'
        ? 'Import'
        : type === 'importtoc'
        ? 'ImportToC'
        : type;

    // When type is provided, verify it matches the parsed transaction.
    // When type is not provided (MPC/TSS intent flow where buildParams are unavailable),
    // skip the type match check and rely on explainedTx.type from the parsed hex —
    // the transaction was built by wallet-platform and the hex is the source of truth.
    if (normalizedType && normalizedType !== 'ImportToC' && explainedTx.type !== TransactionType[normalizedType]) {
      throw new Error('Tx type does not match with expected txParams type');
    }

    switch (explainedTx.type) {
      case TransactionType.Export:
        if (!params.txParams.recipients || params.txParams.recipients?.length !== 1) {
          throw new Error('Export Tx requires a recipient');
        } else {
          await this.validateExportTx(params.txParams.recipients, explainedTx, tx, params);
        }
        break;
      case TransactionType.Import:
        if (tx.isTransactionForCChain) {
          // Import to C-chain
          if (explainedTx.outputs.length !== 1) {
            throw new Error('Expected 1 output in import transaction');
          }
          if (!params.txParams.recipients || params.txParams.recipients.length !== 1) {
            throw new Error('Expected 1 recipient in import transaction');
          }
        } else {
          // Import to P-chain
          if (explainedTx.outputs.length !== 1) {
            throw new Error('Expected 1 output in import transaction');
          }
          this.validateImportTx(explainedTx.inputs, params.txParams);
        }
        break;
      case TransactionType.AddPermissionlessDelegator:
        if (params.txParams.stakingOptions) {
          this.validateDelegationTx(params.txParams, explainedTx);
        }
        break;
      default:
        throw new Error('Tx type is not supported yet');
    }
    return true;
  }

  /**
   * Check if export txn is valid, based on expected tx params.
   * Besides the amount window, binds the exported outputs and change outputs to
   * wallet-owned addresses (CECHO-2716): a malicious prebuild spending the wallet's
   * UTXOs while paying an attacker-owned export output or change must fail.
   *
   * @param {ITransactionRecipient[]} recipients expected recipients and info
   * @param {FlrpLib.TransactionExplanation} explainedTx explained export transaction
   * @param {FlrpLib.Transaction} tx parsed transaction, used to distinguish the export direction
   * @param {FlrpVerifyTransactionOptions} params verification params carrying the wallet
   */
  async validateExportTx(
    recipients: ITransactionRecipient[],
    explainedTx: FlrpLib.TransactionExplanation,
    tx: FlrpLib.Transaction,
    params: FlrpVerifyTransactionOptions
  ): Promise<void> {
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
      // C→P export: the exported output pays the P-chain destination named by the
      // recipient. Bind it when the caller carries the destination (CECHO-2716).
      // RESIDUAL: an empty placeholder leaves the destination unbound — legitimate
      // external destinations are held server-side, so wallet-binding here would
      // false-reject cross-wallet exports. Tracked as CECHO-2867 (supply the
      // destination client-side so it can be bound).
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
    } else {
      // P→C export: the SDK builder pays the wallet's own addresses both for the
      // exported output and for the P-chain change (baseTx.outputs) — the C destination
      // is the wallet's paired C address. Require both to be wallet-owned so an
      // attacker-owned export output or redirected change fails verification
      // (CECHO-2716).
      //
      // The owner anchor is DERIVED FROM THE WALLET'S KEYCHAINS (client-verified key
      // material, the same derivation isWalletAddress uses) — not from platform-served
      // wallet fields: a compromised platform controls the prebuild AND
      // rootAddress/receiveAddress, so those cannot anchor the ownership check.
      // Fail closed when the keychain-derived owner set is unavailable.
      const anchorOwners = await this.deriveWalletOwnerSetFromKeychains(params.wallet);
      if (anchorOwners.size === 0) {
        throw new Error('Unable to verify P-chain export: could not derive the wallet owner set from keychains');
      }
      this.requireWalletOwnedAddresses('Export output', explainedTx.outputs[0].address, anchorOwners);
      for (const changeOutput of explainedTx.changeOutputs) {
        this.requireWalletOwnedAddresses('Export change output', changeOutput.address, anchorOwners);
      }
      // Locktime/threshold policy on the raw outputs (review hardening for
      // CECHO-2716): a wallet-owned output with a far-future locktime or a malformed
      // threshold would lock or strand the funds rather than steal them, but must
      // still fail verification.
      this.validateExportOutputPolicy(tx);
      // Bound the implied burned fee (review hardening for CECHO-2716): without
      // this, a prebuild with a tiny wallet-owned change could burn the remainder
      // of the spent UTXOs as fee and still verify.
      this.validateExportFee(explainedTx);
    }
  }

  /**
   * Derive the wallet's P-chain owner addresses from its keychain public keys —
   * the same derivation isWalletAddress performs. Keychains are fetched by the
   * wallet's key IDs; their public key material is the client-trusted source of
   * wallet identity, unlike platform-served wallet fields (rootAddress/receiveAddress),
   * which a compromised platform controls alongside the prebuild.
   * TSS/MPC keychains carry the joint public key in `commonKeychain` (130 hex chars:
   * 33-byte compressed public key + 32-byte chain code — the same field sdk-core's
   * verifyMPCWalletAddress reads) and may not populate `pub`. The compressed public
   * key is extracted from it exactly as sdk-core's EcdsaUtils does; a malformed
   * commonKeychain throws and fails closed. The address is derived from the root
   * public key — the same convention flrp's isWalletAddress MPC branch uses, which
   * production createAddress verification already exercises. A keychain with neither
   * field yields an incomplete owner set that fails closed in the caller.
   *
   * @param {IWallet} wallet the wallet whose keychains define the owner set
   * @returns the wallet's normalized owner addresses; empty when no keychains resolve
   */
  private async deriveWalletOwnerSetFromKeychains(wallet: IWallet | undefined): Promise<Set<string>> {
    if (!wallet) {
      return new Set();
    }
    const keyIds = wallet.keyIds();
    if (keyIds.length === 0) {
      return new Set();
    }
    const keychains = await Promise.all(keyIds.map(async (keyId) => wallet.baseCoin.keychains().get({ id: keyId })));
    const publicKeys = keychains.map((keychain) => {
      if (typeof keychain.pub === 'string') {
        return keychain.pub;
      }
      if (typeof keychain.commonKeychain === 'string') {
        // A TSS commonKeychain is the 33-byte compressed public key followed by the
        // 32-byte chain code (130 hex chars) — NOT a bare public key. Extract the
        // public key exactly as sdk-core's EcdsaUtils does; a malformed length throws
        // and fails closed rather than feeding chain-code bytes to KeyPair.
        return EcdsaUtils.getPublicKeyFromCommonKeychain(keychain.commonKeychain);
      }
      return undefined;
    });
    if (publicKeys.some((pub) => typeof pub !== 'string')) {
      return new Set();
    }
    const networkType = this._staticsCoin.network.type;
    const ownerAddresses = publicKeys.map((pub) => new FlrpLib.KeyPair({ pub: pub as string }).getAddress(networkType));
    return new Set(ownerAddresses.map((address) => address.toLowerCase()));
  }

  /**
   * Bind the P→C export's output spend policy (review hardening for CECHO-2716):
   * every exported output and change output must be immediately spendable
   * (locktime 0) and structurally sound (threshold between 1 and the owner count).
   * A wallet-owned output with a far-future locktime freezes the funds; a threshold
   * above the owner count strands them. The exact threshold is not bound to the
   * wallet's configuration — no authoritative expected threshold reaches
   * verifyTransaction (TSS wallets use 1, custodial m-of-n uses m), and the SDK's
   * MPC builder legitimately produces single-key outputs, so neither threshold
   * equality nor a minimum owner count can be enforced without false-rejecting
   * legitimate exports. The keychain-derived wallet-ownership requirement in
   * validateExportTx is what prevents platform-controlled theft; pinning the
   * expected owner set / threshold by wallet type is tracked as CECHO-2868.
   *
   * @param {FlrpLib.Transaction} tx parsed P→C export carrying the raw outputs
   * @throws Error when any output locktime is nonzero or its threshold is invalid
   */
  private validateExportOutputPolicy(tx: FlrpLib.Transaction): void {
    const pvmExportTx = (tx.getFlareTransaction() as UnsignedTx).getTx() as pvmSerial.ExportTx;
    const outputs = [...pvmExportTx.outs, ...pvmExportTx.baseTx.outputs];
    for (const transferableOutput of outputs) {
      const output = transferableOutput.output as TransferOutput;
      const locktime = output.getLocktime();
      if (locktime !== 0n) {
        throw new Error(
          `Export output locktime ${locktime} must be 0 — a time-locked output would freeze the wallet's funds`
        );
      }
      const threshold = output.getThreshold();
      const ownerCount = output.getOwners().length;
      if (threshold < 1 || threshold > ownerCount) {
        throw new Error(
          `Export output threshold ${threshold} is invalid for ${ownerCount} owner(s); refusing to verify`
        );
      }
    }
  }

  /**
   * Bound the fee burned by a P→C export (review hardening for CECHO-2716): the
   * difference between the consumed input value and the exported amount plus change
   * is burned as the export fee. Without this check, a prebuild with a tiny
   * wallet-owned change output could burn the remainder of the spent UTXOs as fee
   * and still verify. The network maxImportFee is the ceiling — the same network fee
   * bound validateExportTx already uses for the amount window, and it sits above the
   * builder's dynamic fee-state fees (fixture and MPC builds burn ~1.3M vs the 10M
   * ceiling). Fails closed when any total is not a finite number.
   *
   * @param {FlrpLib.TransactionExplanation} explainedTx parsed export explanation
   * @throws Error when the burned fee exceeds the network fee bound or totals are
   * not finite
   */
  private validateExportFee(explainedTx: FlrpLib.TransactionExplanation): void {
    const maxImportFee = (this._staticsCoin.network as FlareNetwork).maxImportFee;
    // Input entries carry `value`; output and change entries carry `amount`.
    const consumedTotal = (explainedTx.inputs as unknown as FlrpEntry[]).reduce(
      (sum, input) => sum.plus(input.value),
      new BigNumber(0)
    );
    const payoutTotal = explainedTx.outputs
      .concat(explainedTx.changeOutputs)
      .reduce((sum, output) => sum.plus((output as unknown as FlrpEntry).value ?? output.amount), new BigNumber(0));
    if (!consumedTotal.isFinite() || !payoutTotal.isFinite()) {
      throw new Error('Export fee bound: input/output totals are not finite numbers; refusing to verify');
    }
    const burnedFee = consumedTotal.minus(payoutTotal);
    if (burnedFee.isGreaterThan(maxImportFee)) {
      throw new Error(`Export burns ${burnedFee.toString()} in fees, exceeding the network fee bound ${maxImportFee}`);
    }
  }

  /**
   * Require every address in an (optionally tilde-joined) owner set to be one of the
   * wallet's own addresses. Addresses are normalized (case-insensitive, sorted).
   *
   * @param {string} label which output is being checked, for the error message
   * @param {string} address the output's tilde-joined owner-set address from the parsed tx
   * @param {Set<string>} anchorOwners the wallet's normalized owner addresses
   */
  private requireWalletOwnedAddresses(label: string, address: string, anchorOwners: Set<string>): void {
    if (!utils.isValidAddress(address)) {
      throw new Error(`Invalid ${label} address: ${address}`);
    }
    const foreignOwner = normalizeAddressSet(address)
      .split(ADDRESS_SEPARATOR)
      .find((owner) => !anchorOwners.has(owner));
    if (foreignOwner) {
      throw new Error(`${label} pays non-wallet address ${foreignOwner}; refusing to verify`);
    }
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
