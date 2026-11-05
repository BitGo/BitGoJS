/***
 * @developerReferences
 * - Developer Hub: https://dev.flare.network/
 * - Doc: https://docs.flare.network/user/wallets/
 *
 * @coinFullName Flare
 * @coinWebsite https://flarescan.com
 */

import { BigNumber } from 'bignumber.js';
import { bip32 } from '@bitgo/secp256k1';
import Keccak from 'keccak';
import * as secp256k1 from 'secp256k1';
import * as _ from 'lodash';
import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  common,
  FeeEstimateOptions,
  IWallet,
  isAvalancheAtomicTx,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  Recipient,
  SignableTransaction,
  TransactionExplanation,
  TransactionType,
  Entry,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, FlareNetwork } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  optionalDeps,
  recoveryBlockchainExplorerQuery,
  UnsignedSweepTxMPCv2,
  RecoverOptions,
  OfflineVaultTxInfo,
  VerifyEthTransactionOptions,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import { FlrPLib } from '@bitgo/sdk-coin-flrp';
import { pubToAddress } from 'ethereumjs-util';
import {
  BuildOptions,
  ExplainTransactionOptions,
  FeeEstimate,
  HopParams,
  HopPrebuild,
  HopTransactionBuildOptions,
  PresignTransactionOptions,
  TransactionPrebuild,
  VerifyFlrTransactionOptions,
} from './iface';

/**
 * Extended TransactionExplanation interface with inputs for atomic transactions
 */
interface AtomicTransactionExplanation extends TransactionExplanation {
  inputs: Entry[];
  /** Decoded transaction type, set by the atomic builder's explainTransaction. */
  type?: TransactionType;
}

/** The user intent a TSS transaction must satisfy, taken from the one source that speaks for it. */
interface FlrDeclaredTssIntent {
  type?: string;
  recipients: Array<{ address: string; amount: string }>;
}

export class Flr extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Flr(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /**
   * Returns true when the signableHex for this transaction is already the
   * final signing hash. Cross-chain export atomic transactions from FLR
   * C-chain to FLRP P-chain are pre-hashed with SHA-256(txBody); the MPC
   * signing flow must use that digest directly without applying keccak256.
   */
  isSignablePreHashed(unsignedTx: SignableTransaction): boolean {
    return isAvalancheAtomicTx(unsignedTx);
  }

  protected async buildUnsignedSweepTxnTSS(params: RecoverOptions): Promise<OfflineVaultTxInfo | UnsignedSweepTxMPCv2> {
    return this.buildUnsignedSweepTxnMPCv2(params);
  }

  /**
   * Validates if an address is valid for FLR
   * Also validates P-chain addresses for cross-chain transactions
   * @param {string} address - address to validate
   * @returns {boolean} - validation result
   */
  isValidAddress(address: string): boolean {
    // also validate p-chain address for cross-chain txs
    return !!address && (super.isValidAddress(address) || FlrPLib.Utils.isValidAddress(address));
  }

  /**
   * Get the corresponding P-chain coin name
   * @returns {string} flrp or tflrp depending on mainnet/testnet
   */
  getFlrP(): string {
    return this.getChain().toString() === 'flr' ? 'flrp' : 'tflrp';
  }

  /**
   * Get the atomic transaction builder factory for cross-chain operations
   * @returns {FlrPLib.TransactionBuilderFactory} the atomic builder factory
   */
  protected getAtomicBuilder(): FlrPLib.TransactionBuilderFactory {
    return new FlrPLib.TransactionBuilderFactory(coins.get(this.getFlrP()));
  }

  /**
   * Check if this coin is a token
   * @returns {boolean} false for FLR (base chain)
   */
  isToken(): boolean {
    return false;
  }

  /**
   * Decode atomic transaction bytes with the atomic builder.
   * @param {string} txHex - the transaction hex
   * @returns {Promise<BaseTransaction>} the built atomic transaction
   * @private
   */
  private async getAtomicTransaction(txHex: string): Promise<BaseTransaction> {
    return this.getAtomicBuilder().from(txHex).build();
  }

  /**
   * Explains an atomic transaction using atomic builder.
   * @param {string} txHex - the transaction hex
   * @returns {Promise<AtomicTransactionExplanation>} the transaction explanation
   * @private
   */
  private async explainAtomicTransaction(txHex: string): Promise<AtomicTransactionExplanation> {
    const tx = await this.getAtomicTransaction(txHex);
    return tx.explainTransaction() as AtomicTransactionExplanation;
  }

  /**
   * Verify signature for an atomic transaction using atomic builder.
   * @param {string} txHex - the transaction hex
   * @returns {Promise<boolean>} true if signature is from the input address
   * @private
   */
  private async verifySignatureForAtomicTransaction(txHex: string): Promise<boolean> {
    const tx = await this.getAtomicTransaction(txHex);
    const payload = tx.signablePayload;
    const signatures = tx.signature.map((s) => Buffer.from(FlrPLib.Utils.removeHexPrefix(s), 'hex'));
    const recoverPubkey = signatures.map((s) => FlrPLib.Utils.recoverySignature(payload, s));
    const expectedSenders = recoverPubkey.map((r) => pubToAddress(r, true));
    const senders = tx.inputs.map((i) => FlrPLib.Utils.parseAddress(i.address));
    return expectedSenders.every((e) => senders.some((sender) => e.equals(sender)));
  }

  /**
   * Explain a transaction from txHex, overriding BaseCoins
   * transaction can be either atomic or eth txn.
   * @param {ExplainTransactionOptions} params The options with which to explain the transaction
   * @returns {Promise<TransactionExplanation>} the transaction explanation
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex) {
      throw new Error('missing txHex in explain tx parameters');
    }
    // Avalanche atomic transactions are identified by their codec prefix (0x00000000).
    // Auto-detect them so callers don't need to pass crossChainType explicitly.
    const hexWithout0x = txHex.startsWith('0x') ? txHex.slice(2) : txHex;
    if (params.crossChainType || hexWithout0x.startsWith('0000')) {
      return this.explainAtomicTransaction(txHex);
    }
    if (!params.feeInfo) {
      throw new Error('missing feeInfo in explain tx parameters');
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = await txBuilder.build();
    return Object.assign(this.explainEVMTransaction(tx), { fee: params.feeInfo });
  }

  /**
   * Explains an EVM transaction using regular eth txn builder
   * @param {BaseTransaction} tx - the transaction to explain
   * @returns {Object} the transaction explanation
   * @private
   */
  private explainEVMTransaction(tx: BaseTransaction) {
    const outputs = tx.outputs.map((output) => {
      return {
        address: output.address,
        amount: output.value,
      };
    });
    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];
    return {
      displayOrder,
      id: tx.id,
      outputs: outputs,
      outputAmount: outputs
        .reduce((accumulator, output) => accumulator.plus(output.amount), new BigNumber('0'))
        .toFixed(0),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
    };
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param {VerifyFlrTransactionOptions} params
   * @param params.txParams params object passed to send
   * @param params.txPrebuild prebuild object returned by server
   * @param params.wallet Wallet object to obtain keys to verify against
   * @returns {Promise<boolean>}
   */
  async verifyTransaction(params: VerifyFlrTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet, walletType } = params;

    // For TSS wallets, use the parent class's TSS-specific verification
    if (walletType === 'tss') {
      return super.verifyTransaction(params);
    }

    if (!txParams?.recipients || !txPrebuild?.recipients || !wallet) {
      throw new Error(`missing params`);
    }
    if (txParams.hop && txParams.recipients.length > 1) {
      throw new Error(`tx cannot be both a batch and hop transaction`);
    }
    if (txPrebuild.recipients.length > 1) {
      throw new Error(
        `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
      );
    }
    if (txParams.hop && txPrebuild.hopTransaction) {
      // Check recipient amount for hop transaction
      if (txParams.recipients.length !== 1) {
        throw new Error(`hop transaction only supports 1 recipient but ${txParams.recipients.length} found`);
      }
      // Check tx sends to hop address
      let expectedHopAddress;
      if (txPrebuild.hopTransaction.type === 'Export') {
        const decodedHopTx = await this.explainAtomicTransaction(txPrebuild.hopTransaction.tx);
        expectedHopAddress = optionalDeps.ethUtil.stripHexPrefix(decodedHopTx.inputs[0].address);
      } else {
        const decodedHopTx = optionalDeps.EthTx.TransactionFactory.fromSerializedData(
          optionalDeps.ethUtil.toBuffer(txPrebuild.hopTransaction.tx)
        );
        expectedHopAddress = optionalDeps.ethUtil.stripHexPrefix(decodedHopTx.getSenderAddress().toString());
      }
      const actualHopAddress = optionalDeps.ethUtil.stripHexPrefix(txPrebuild.recipients[0].address);
      if (expectedHopAddress.toLowerCase() !== actualHopAddress.toLowerCase()) {
        throw new Error('recipient address of txPrebuild does not match hop address');
      }

      // Convert TransactionRecipient array to Recipient array
      const recipients: Recipient[] = txParams.recipients.map((r) => {
        return {
          address: r.address,
          amount: typeof r.amount === 'number' ? r.amount.toString() : r.amount,
        };
      });

      // Check destination address and amount
      await this.validateHopPrebuild(wallet, txPrebuild.hopTransaction, { recipients });
    } else if (txParams.recipients.length > 1) {
      // Check total amount for batch transaction
      let expectedTotalAmount = new BigNumber(0);
      for (let i = 0; i < txParams.recipients.length; i++) {
        expectedTotalAmount = expectedTotalAmount.plus(txParams.recipients[i].amount);
      }
      if (!expectedTotalAmount.isEqualTo(txPrebuild.recipients[0].amount)) {
        throw new Error(
          'batch transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
      }
    } else {
      // Check recipient address and amount for normal transaction
      if (txParams.recipients.length !== 1) {
        throw new Error(`normal transaction only supports 1 recipient but ${txParams.recipients.length} found`);
      }
      const expectedAmount = new BigNumber(txParams.recipients[0].amount);
      if (!expectedAmount.isEqualTo(txPrebuild.recipients[0].amount)) {
        throw new Error(
          'normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
      }
      if (
        Flr.isFLRAddress(txParams.recipients[0].address) &&
        txParams.recipients[0].address !== txPrebuild.recipients[0].address
      ) {
        throw new Error('destination address in normal txPrebuild does not match that in txParams supplied by client');
      }
    }
    // Check coin is correct for all transaction types
    if (!this.verifyCoin(txPrebuild)) {
      throw new Error(`coin in txPrebuild did not match that in txParams supplied by client`);
    }
    return true;
  }

  /**
   * Verify a TSS transaction against the intent the user approved.
   *
   * A C-chain -> P-chain export is signed as an Avalanche atomic transaction, which the EVM
   * transaction decoder cannot parse, so it is verified here before the parent verifier runs.
   * Every other FLR TSS transaction keeps the parent's EVM intent verification unchanged.
   *
   * @param {VerifyEthTransactionOptions} params
   * @returns {Promise<boolean>}
   */
  async verifyTssTransaction(params: VerifyEthTransactionOptions): Promise<boolean> {
    const intent = Flr.resolveDeclaredTssIntent(params);
    const declaredExport = Flr.isExportIntent(intent);
    if (!Flr.isAtomicTransactionHex(params.txPrebuild?.txHex)) {
      if (declaredExport) {
        // Exporting from the C-chain is only ever an atomic transaction: bytes that are not atomic
        // can never satisfy a declared export, and no warn / strict policy may downgrade that.
        throw new Error('declared export intent requires an atomic transaction in txPrebuild.txHex');
      }
      return super.verifyTssTransaction(params);
    }
    if (!declaredExport) {
      // Other atomic formats (import / importtoc) keep the parent baseline: this verifier owns
      // only the C-chain -> P-chain export shape, so their policy is not decided here.
      return super.verifyTssTransaction(params);
    }
    return this.verifyAtomicExportTssTransaction(params, intent);
  }

  /**
   * Verify the Avalanche atomic export bytes about to be signed against the declared intent.
   *
   * The amount follows the Export convention already used by {@link validateHopPrebuild}: the
   * declared C-chain amount is in wei, the P-chain output is in nanoFLR, and the output must cover
   * the declared amount plus the import fee, up to the network's maximum import fee.
   *
   * @param {VerifyEthTransactionOptions} params
   * @param {FlrDeclaredTssIntent} intent - the intent resolved by the caller
   * @returns {Promise<boolean>}
   * @private
   */
  private async verifyAtomicExportTssTransaction(
    params: VerifyEthTransactionOptions,
    intent: FlrDeclaredTssIntent
  ): Promise<boolean> {
    const { txPrebuild, wallet } = params;
    if (!wallet || !txPrebuild?.txHex) {
      throw new Error('missing params');
    }

    let tx: BaseTransaction;
    let explained: AtomicTransactionExplanation;
    try {
      tx = await this.getAtomicTransaction(txPrebuild.txHex);
      explained = tx.explainTransaction() as AtomicTransactionExplanation;
    } catch (e) {
      throw new Error(`transaction bytes could not be decoded to verify intent: ${(e as Error).message}`);
    }

    if (explained.type !== TransactionType.Export) {
      throw new Error(`atomic transaction type ${String(explained.type)} does not match the declared export intent`);
    }
    // Explanations map every owner onto this coin's P-chain alias, so matching the output address
    // does not prove the export targets the P-chain. Read the chains encoded in the bytes.
    const { sourceChain, destinationChain } = (tx as FlrPLib.Transaction).toJson();
    if (sourceChain !== 'C' || destinationChain !== 'P') {
      throw new Error(
        `atomic export must be a C-chain to P-chain export but encodes ${sourceChain} -> ${destinationChain}`
      );
    }
    const outputs = explained.outputs;
    if (outputs.length !== 1) {
      throw new Error(`atomic export transaction must have exactly 1 output but ${outputs.length} found`);
    }
    if (intent.recipients.length !== 1) {
      throw new Error(`atomic export requires exactly 1 recipient but ${intent.recipients.length} found`);
    }

    const declaredRecipient = intent.recipients[0];
    const declaredDestination = Flr.normalizePChainAddressSet(declaredRecipient.address);
    if (!declaredDestination) {
      throw new Error(`atomic export recipient ${declaredRecipient.address} is not a valid P-chain address`);
    }
    const decodedDestination = Flr.normalizePChainAddressSet(outputs[0].address);
    if (!decodedDestination) {
      throw new Error(`atomic export destination ${outputs[0].address} is not a valid P-chain address`);
    }
    if (declaredDestination !== decodedDestination) {
      throw new Error(
        `atomic export destination ${outputs[0].address} does not match the declared recipient ${declaredRecipient.address}`
      );
    }

    this.assertAtomicExportAmount(declaredRecipient.amount, explained.outputAmount);
    return true;
  }

  /**
   * Resolve the intent that speaks for the user, with the same precedence as the parent verifier:
   * the caller's own params when it declared a type or recipients, otherwise the stored tx request
   * intent. `txParams` cannot answer this because the linking path back-fills it from the stored
   * intent, so `callerTxParams` (the untouched caller input) decides.
   *
   * @param {VerifyEthTransactionOptions} params
   * @returns {FlrDeclaredTssIntent}
   * @private
   */
  private static resolveDeclaredTssIntent(params: VerifyEthTransactionOptions): FlrDeclaredTssIntent {
    const callerParams = params.callerTxParams ?? (params.intent ? undefined : params.txParams);
    const callerDeclaresIntent = !!(callerParams?.type || callerParams?.recipients?.length);
    const storedIntent = params.intent && !callerDeclaresIntent ? params.intent : undefined;

    if (storedIntent) {
      return {
        type: storedIntent.intentType,
        recipients: (storedIntent.recipients ?? []).map((recipient) => ({
          address: recipient.address.address,
          amount: String(recipient.amount.value),
        })),
      };
    }

    const declared = callerParams ?? params.txParams;
    return {
      type: declared?.type,
      recipients: (declared?.recipients ?? []).map((recipient) => ({
        address: recipient.address,
        amount: String(recipient.amount),
      })),
    };
  }

  /** True when the declared intent type selects an export, in either the caller or stored spelling. */
  private static isExportIntent(intent: FlrDeclaredTssIntent): boolean {
    return (intent.type ?? '').trim().toLowerCase() === 'export';
  }

  /**
   * Avalanche atomic transactions are identified by their codec prefix (0x0000), the same marker
   * used by {@link explainTransaction} and {@link isSignablePreHashed}.
   */
  private static isAtomicTransactionHex(txHex?: string): boolean {
    const hex = txHex?.startsWith('0x') ? txHex.slice(2) : txHex;
    return !!hex && hex.startsWith('0000');
  }

  /**
   * Normalize a P-chain address (a single address or a `~`-separated multisig set) so address
   * order and case cannot make two descriptions of the same destination compare unequal.
   *
   * @param {string} address - the P-chain address or address set
   * @returns {string | undefined} the normalized set, undefined when any address is invalid
   * @private
   */
  private static normalizePChainAddressSet(address?: string): string | undefined {
    const addresses = (address ?? '')
      .split('~')
      .map((part) => part.trim())
      .filter((part) => !!part);
    if (!addresses.length || !addresses.every((part) => FlrPLib.Utils.isValidAddress(part))) {
      return undefined;
    }
    return addresses
      .map((part) => part.toLowerCase())
      .sort()
      .join('~');
  }

  /**
   * Check that the atomic export output covers the declared C-chain amount plus an import fee.
   *
   * The declared amount is in wei and the export output is in nanoFLR (the same wei -> nanoFLR
   * conversion {@link validateHopPrebuild} applies). The output may not exceed the declared amount
   * plus the network's maximum import fee, which is also the bound Flrp.validateExportTx applies.
   *
   * @param {string} declaredAmount - the C-chain amount declared by the user, in wei
   * @param {string} outputAmount - the amount the atomic export pays on the P-chain, in nanoFLR
   * @private
   */
  private assertAtomicExportAmount(declaredAmount: string, outputAmount?: string): void {
    const flrpNetwork = coins.get(this.getFlrP()).network as FlareNetwork;
    const amount = new BigNumber(declaredAmount);
    const output = new BigNumber(outputAmount ?? '');
    if (!amount.isFinite() || amount.isNegative() || !output.isFinite() || output.isNegative()) {
      throw new Error(`atomic export amount ${declaredAmount} or output amount ${outputAmount} is not a valid amount`);
    }
    const expectedOutput = amount.div(1e9);
    const minOutput = expectedOutput.plus(flrpNetwork.minImportToPFee);
    const maxOutput = expectedOutput.plus(flrpNetwork.maxImportFee);
    if (output.isLessThan(minOutput) || output.isGreaterThan(maxOutput)) {
      throw new Error(
        `atomic export output amount ${outputAmount} is outside the expected range [${minOutput.toFixed()}, ${maxOutput.toFixed()}] for the declared amount ${declaredAmount}`
      );
    }
  }

  /**
   * Check if an address is a FLR C-chain address (0x format)
   * @param {string} address - the address to check
   * @returns {boolean} true if it's a C-chain address
   * @private
   */
  private static isFLRAddress(address: string): boolean {
    return !!address.match(/0x[a-fA-F0-9]{40}/);
  }

  /**
   * Verify that the coin matches in the prebuild
   * @param {TransactionPrebuild} txPrebuild - the transaction prebuild
   * @returns {boolean} true if coin matches
   */
  verifyCoin(txPrebuild: TransactionPrebuild): boolean {
    return txPrebuild.coin === this.getChain();
  }

  /**
   * Coin-specific things done before signing a transaction, i.e. verification
   * @param {PresignTransactionOptions} params - the presign options
   * @returns {Promise<PresignTransactionOptions>}
   */
  async presignTransaction(params: PresignTransactionOptions): Promise<PresignTransactionOptions> {
    if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
      await this.validateHopPrebuild(params.wallet, params.hopTransaction);
    }
    return params;
  }

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   * @param {TransactionPrebuild} params - the transaction prebuild
   * @returns {Promise<TransactionPrebuild>}
   */
  async postProcessPrebuild(params: TransactionPrebuild): Promise<TransactionPrebuild> {
    if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
      await this.validateHopPrebuild(params.wallet, params.hopTransaction, params.buildParams);
    }
    return params;
  }

  /**
   * Validates that the hop prebuild from the HSM is valid and correct
   * @param {IWallet} wallet The wallet that the prebuild is for
   * @param {HopPrebuild} hopPrebuild The prebuild to validate
   * @param {Object} originalParams The original parameters passed to prebuildTransaction
   * @returns {Promise<void>}
   * @throws Error if The prebuild is invalid
   */
  async validateHopPrebuild(
    wallet: IWallet,
    hopPrebuild: HopPrebuild,
    originalParams?: { recipients: Recipient[] }
  ): Promise<void> {
    const { tx, id, signature } = hopPrebuild;

    // first, validate the HSM signature
    const serverXpub = common.Environments[this.bitgo.getEnv()].hsmXpub;
    const serverPubkeyBuffer: Buffer = bip32.fromBase58(serverXpub).publicKey;
    const signatureBuffer: Buffer = Buffer.from(optionalDeps.ethUtil.stripHexPrefix(signature), 'hex');
    const messageBuffer: Buffer =
      hopPrebuild.type === 'Export' ? Flr.getTxHash(tx) : Buffer.from(optionalDeps.ethUtil.stripHexPrefix(id), 'hex');

    const sig = new Uint8Array(signatureBuffer.length === 64 ? signatureBuffer : signatureBuffer.slice(1));
    const isValidSignature: boolean = secp256k1.ecdsaVerify(sig, messageBuffer, serverPubkeyBuffer);
    if (!isValidSignature) {
      throw new Error(`Hop txid signature invalid`);
    }

    if (hopPrebuild.type === 'Export') {
      const explainHopExportTx = await this.explainAtomicTransaction(tx);
      // If original params are given, we can check them against the transaction prebuild params
      if (!_.isNil(originalParams)) {
        const { recipients } = originalParams;

        // Get the P-chain import fee from network configuration
        const flrpCoin = coins.get(this.getFlrP());
        const minImportTxFee = (flrpCoin.network as any).minImportToPFee || '1261000';

        // Then validate that the tx params actually equal the requested params to nano flr plus import tx fee.
        const originalAmount = new BigNumber(recipients[0].amount).div(1e9).plus(minImportTxFee).toFixed(0);
        const originalDestination: string | undefined = recipients[0].address;
        const hopAmount = explainHopExportTx.outputAmount;
        const hopDestination = explainHopExportTx.outputs[0].address;
        if (new BigNumber(hopAmount).isLessThan(originalAmount)) {
          throw new Error(`Hop amount: ${hopAmount} is less than required amount: ${originalAmount}`);
        }
        if (originalDestination && hopDestination.toLowerCase() !== originalDestination.toLowerCase()) {
          throw new Error(
            `Hop destination: ${hopDestination} does not equal original recipient: ${originalDestination}`
          );
        }
      }
      if (!(await this.verifySignatureForAtomicTransaction(tx))) {
        throw new Error(`Invalid hop transaction signature, txid: ${id}`);
      }
    } else {
      const builtHopTx = optionalDeps.EthTx.TransactionFactory.fromSerializedData(optionalDeps.ethUtil.toBuffer(tx));
      // If original params are given, we can check them against the transaction prebuild params
      if (!_.isNil(originalParams)) {
        const { recipients } = originalParams;

        // Then validate that the tx params actually equal the requested params
        const originalAmount = new BigNumber(recipients[0].amount);
        const originalDestination: string = recipients[0].address;

        const hopAmount = new BigNumber(optionalDeps.ethUtil.bufferToHex(builtHopTx.value as unknown as Buffer));
        if (!builtHopTx.to) {
          throw new Error(`Transaction does not have a destination address`);
        }
        const hopDestination = builtHopTx.to.toString();
        if (!hopAmount.eq(originalAmount)) {
          throw new Error(`Hop amount: ${hopAmount} does not equal original amount: ${originalAmount}`);
        }
        if (hopDestination.toLowerCase() !== originalDestination.toLowerCase()) {
          throw new Error(
            `Hop destination: ${hopDestination} does not equal original recipient: ${originalDestination}`
          );
        }
      }

      if (!builtHopTx.verifySignature()) {
        // We don't want to continue at all in this case, at risk of FLR being stuck on the hop address
        throw new Error(`Invalid hop transaction signature, txid: ${id}`);
      }
      if (optionalDeps.ethUtil.addHexPrefix(builtHopTx.hash().toString('hex')) !== id) {
        throw new Error(`Signed hop txid does not equal actual txid`);
      }
    }
  }

  /**
   * Modify prebuild before sending it to the server. Add things like hop transaction params
   * @param {BuildOptions} buildParams The whitelisted parameters for this prebuild
   * @param {boolean} buildParams.hop True if this should prebuild a hop tx, else false
   * @param {Recipient[]} buildParams.recipients The recipients array of this transaction
   * @param {Wallet} buildParams.wallet The wallet sending this tx
   * @param {string} buildParams.walletPassphrase the passphrase for this wallet
   * @returns {Promise<BuildOptions>}
   */
  async getExtraPrebuildParams(buildParams: BuildOptions): Promise<BuildOptions> {
    // MPC/TSS wallets don't use hop transactions — atomic tx is signed directly
    if (buildParams.wallet?.multisigType() === 'tss') {
      return {};
    }

    if (
      !_.isUndefined(buildParams.hop) &&
      buildParams.hop &&
      !_.isUndefined(buildParams.wallet) &&
      !_.isUndefined(buildParams.recipients)
    ) {
      if (this.isToken()) {
        throw new Error(
          `Hop transactions are not enabled for FLR tokens, nor are they necessary. Please remove the 'hop' parameter and try again.`
        );
      }
      return (await this.createHopTransactionParams({
        recipients: buildParams.recipients,
        type: buildParams.type as HopTransactionBuildOptions['type'],
      })) as unknown as BuildOptions;
    }
    return {};
  }

  /**
   * Creates the extra parameters needed to build a hop transaction
   * @param {HopTransactionBuildOptions} params The original build parameters
   * @returns {Promise<HopParams>} extra parameters object to merge with the original build parameters object and send to the platform
   */
  async createHopTransactionParams({ recipients, type }: HopTransactionBuildOptions): Promise<HopParams> {
    if (!recipients || !Array.isArray(recipients)) {
      throw new Error('expecting array of recipients');
    }

    // Right now we only support 1 recipient
    if (recipients.length !== 1) {
      throw new Error('must send to exactly 1 recipient');
    }
    const recipientAddress = recipients[0].address;
    const recipientAmount = recipients[0].amount;
    const feeEstimateParams = {
      recipient: recipientAddress,
      amount: recipientAmount,
      hop: true,
      type,
    };
    const feeEstimate: FeeEstimate = await this.feeEstimate(feeEstimateParams);

    const gasLimit = feeEstimate.gasLimitEstimate;
    // Even if `feeEstimate < gasLimit`, we shouldn't end up with `gasPrice === 0`.
    const gasPrice = Math.max(Math.round(feeEstimate.feeEstimate / gasLimit), 1);
    const gasPriceMax = gasPrice * 5;
    // Payment id is a random number so its different for every tx
    const paymentId = Math.floor(Math.random() * 10000000000).toString();

    const userReqSig = '0x';

    return {
      hopParams: {
        userReqSig,
        gasPriceMax,
        paymentId,
        gasLimit,
      },
    };
  }

  /**
   * Fetch fee estimate information from the server
   * @param {FeeEstimateOptions} params The params passed into the function
   * @param {Boolean} [params.hop] True if we should estimate fee for a hop transaction
   * @param {String} [params.recipient] The recipient of the transaction to estimate a send to
   * @param {String} [params.data] The data to estimate a send for
   * @returns {Promise<FeeEstimate>} The fee info returned from the server
   */
  async feeEstimate(params: FeeEstimateOptions): Promise<FeeEstimate> {
    const query: FeeEstimateOptions = {};
    if (params && params.hop) {
      query.hop = params.hop;
    }
    if (params && params.recipient) {
      query.recipient = params.recipient;
    }
    if (params && params.data) {
      query.data = params.data;
    }
    if (params && params.amount) {
      query.amount = params.amount;
    }
    if (params && params.type) {
      query.type = params.type;
    }

    return await this.bitgo.get(this.url('/tx/fee')).query(query).result();
  }

  /**
   * Calculate tx hash like evm from tx hex.
   * @param {string} tx - the transaction hex
   * @returns {Buffer} tx hash
   */
  static getTxHash(tx: string): Buffer {
    const hash = Keccak('keccak256');
    hash.update(optionalDeps.ethUtil.stripHexPrefix(tx), 'hex');
    return hash.digest();
  }

  /**
   * Make a query to Flare explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @param {string} apiKey optional API key to use instead of the one from the environment
   * @returns {Promise<Object>} response from Flare explorer
   */
  async recoveryBlockchainExplorerQuery(
    query: Record<string, string>,
    apiKey?: string
  ): Promise<Record<string, unknown>> {
    const apiToken = apiKey || common.Environments[this.bitgo.getEnv()].flrExplorerApiToken;
    const explorerUrl = common.Environments[this.bitgo.getEnv()].flrExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }
}
