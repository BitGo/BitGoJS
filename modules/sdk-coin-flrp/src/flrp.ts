import { FlareNetwork, BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo-beta/statics';
import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  VerifyAddressOptions,
  SignedTransaction,
  ParseTransactionOptions,
  BaseTransaction,
  InvalidTransactionError,
  SigningError,
  TransactionType,
  InvalidAddressError,
  UnexpectedAddressError,
  ITransactionRecipient,
  ParsedTransaction,
  MultisigType,
  multisigTypes,
  AuditDecryptedKeyParams,
  MethodNotImplementedError,
} from '@bitgo-beta/sdk-core';
import * as FlrpLib from './lib';
import {
  FlrpSignTransactionOptions,
  ExplainTransactionOptions,
  FlrpVerifyTransactionOptions,
  FlrpTransactionStakingOptions,
  FlrpTransactionParams,
} from './lib/iface';
import utils from './lib/utils';
import BigNumber from 'bignumber.js';

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
    return multisigTypes.onchain;
  }

  /**
   * Check if staking txn is valid, based on expected tx params.
   *
   * @param {FlrpTransactionStakingOptions} stakingOptions expected staking params to check against
   * @param {FlrpLib.TransactionExplanation} explainedTx explained staking transaction
   */
  validateStakingTx(stakingOptions: FlrpTransactionStakingOptions, explainedTx: FlrpLib.TransactionExplanation): void {
    const filteredRecipients = [{ address: stakingOptions.nodeID, amount: stakingOptions.amount }];
    const filteredOutputs = explainedTx.outputs.map((output) => utils.pick(output, ['address', 'amount']));

    if (!utils.isEqual(filteredOutputs, filteredRecipients)) {
      throw new Error('Tx outputs does not match with expected txParams');
    }
    if (stakingOptions?.amount !== explainedTx.outputAmount) {
      throw new Error('Tx total amount does not match with expected total amount field');
    }
  }

  /**
   * Check if export txn is valid, based on expected tx params.
   *
   * @param {ITransactionRecipient[]} recipients expected recipients and info
   * @param {FlrpLib.TransactionExplanation} explainedTx explained export transaction
   */
  validateExportTx(recipients: ITransactionRecipient[], explainedTx: FlrpLib.TransactionExplanation): void {
    if (recipients.length !== 1 || explainedTx.outputs.length !== 1) {
      throw new Error('Export Tx requires one recipient');
    }

    const maxImportFee = (this._staticsCoin.network as FlareNetwork).maxImportFee || '0';
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
  }

  /**
   * Check if import txn into P is valid, based on expected tx params.
   *
   * @param {FlrpLib.FlrpEntry[]} explainedTxInputs tx inputs (unspents to be imported)
   * @param {FlrpTransactionParams} txParams expected tx info to check against
   */
  validateImportTx(explainedTxInputs: FlrpLib.FlrpEntry[], txParams: FlrpTransactionParams): void {
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
      throw new Error('Invalid transaction');
    }
    const explainedTx = tx.explainTransaction();

    const { type, stakingOptions } = params.txParams;
    // TODO(BG-62112): change ImportToC type to Import
    if (!type || (type !== 'ImportToC' && explainedTx.type !== TransactionType[type])) {
      throw new Error('Tx type does not match with expected txParams type');
    }

    switch (explainedTx.type) {
      // @deprecated
      case TransactionType.AddDelegator:
      case TransactionType.AddValidator:
      case TransactionType.AddPermissionlessDelegator:
      case TransactionType.AddPermissionlessValidator:
        if (stakingOptions) {
          this.validateStakingTx(stakingOptions, explainedTx);
        }
        break;
      case TransactionType.Export:
        if (!params.txParams.recipients || params.txParams.recipients?.length !== 1) {
          throw new Error('Export Tx requires a recipient');
        } else {
          this.validateExportTx(params.txParams.recipients, explainedTx);
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
      default:
        throw new Error('Tx type is not supported yet');
    }
    return true;
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
    if (!keychains || keychains.length !== 3) {
      throw new Error('Invalid keychains');
    }

    // multisig addresses are separated by ~
    const splitAddresses = address.split('~');

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
    if (typeof address === 'string' && utils.isValidEthereumAddress(address)) {
      return true;
    }

    return FlrpLib.Utils.isValidAddress(address);
  }

  /**
   * Signs Flrp transaction
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
   * Explain a Flrp transaction from txHex
   * @param params
   * @param callback
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<FlrpLib.TransactionExplanation> {
    const txHex = params.txHex ?? params?.halfSigned?.txHex;
    if (!txHex) {
      throw new Error('missing transaction hex');
    }
    try {
      const txBuilder = this.getBuilder().from(txHex);
      const tx = await txBuilder.build();
      return tx.explainTransaction();
    } catch (e) {
      throw new Error(`Invalid transaction: ${e.message}`);
    }
  }

  recoverySignature(message: Buffer, signature: Buffer): Buffer {
    return FlrpLib.Utils.recoverySignature(this._staticsCoin.network as FlareNetwork, message, signature);
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

  private getBuilder(): FlrpLib.TransactionBuilderFactory {
    return new FlrpLib.TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc */
  auditDecryptedKey(params: AuditDecryptedKeyParams): void {
    /** https://bitgoinc.atlassian.net/browse/COIN-4213 */
    throw new MethodNotImplementedError();
  }
}
