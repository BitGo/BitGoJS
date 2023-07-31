import { AvalancheNetwork, BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  VerifyAddressOptions,
  SignedTransaction,
  ParseTransactionOptions,
  BaseTransaction,
  InvalidTransactionError,
  FeeEstimateOptions,
  SigningError,
  TransactionType,
  InvalidAddressError,
  UnexpectedAddressError,
  ITransactionRecipient,
  ParsedTransaction,
} from '@bitgo/sdk-core';
import * as AvaxpLib from './lib';
import {
  AvaxpSignTransactionOptions,
  TransactionFee,
  ExplainTransactionOptions,
  AvaxpVerifyTransactionOptions,
  AvaxpTransactionStakingOptions,
  AvaxpTransactionParams,
} from './iface';
import utils from './lib/utils';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { isValidAddress as isValidEthAddress } from 'ethereumjs-util';

export class AvaxP extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxP(bitgo, staticsCoin);
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

  /**
   * Check if staking txn is valid, based on expected tx params.
   *
   * @param {AvaxpTransactionStakingOptions} stakingOptions expected staking params to check against
   * @param {AvaxpLib.TransactionExplanation} explainedTx explained staking transaction
   */
  validateStakingTx(
    stakingOptions: AvaxpTransactionStakingOptions,
    explainedTx: AvaxpLib.TransactionExplanation
  ): void {
    const filteredRecipients = [{ address: stakingOptions.nodeID, amount: stakingOptions.amount }];
    const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount']));

    if (!_.isEqual(filteredOutputs, filteredRecipients)) {
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
   * @param {string} memo txn memo to verify
   * @param {AvaxpLib.TransactionExplanation} explainedTx explained export transaction
   */
  validateExportTx(
    recipients: ITransactionRecipient[],
    memo: string,
    explainedTx: AvaxpLib.TransactionExplanation
  ): void {
    if (recipients.length !== 1 || explainedTx.outputs.length !== 1) {
      throw new Error('Export Tx requires one recipient');
    }

    const recipientAmount = new BigNumber(recipients[0].amount);

    if (
      recipientAmount.isGreaterThan(explainedTx.outputAmount) ||
      recipientAmount.plus(explainedTx.fee.fee).isLessThan(explainedTx.outputAmount)
    ) {
      throw new Error(
        `Tx total amount ${explainedTx.outputAmount} does not match with expected total amount field ${recipientAmount} and fixed fee ${explainedTx.fee.fee}`
      );
    }

    if (explainedTx.outputs && !utils.isValidAddress(explainedTx.outputs[0].address)) {
      throw new Error(`Invalid P-chain address ${explainedTx.outputs[0].address}`);
    }

    const memoValue = memo.split('~');
    if (!isValidEthAddress(memoValue[0])) {
      throw new Error(`Txn memo must contain valid C-chain address destination, received: ${memo}`);
    } else if (memoValue[0] !== recipients[0].address) {
      throw new Error(
        `Invalid C-chain receive address ${memoValue[0]}, does not match expected params address ${recipients[0].address}`
      );
    }
  }

  /**
   * Check if import txn into P is valid, based on expected tx params.
   *
   * @param {AvaxpLib.AvaxpEntry[]} explainedTxInputs tx inputs (unspents to be imported)
   * @param {AvaxpTransactionParams} txParams expected tx info to check against
   */
  validateImportTx(explainedTxInputs: AvaxpLib.AvaxpEntry[], txParams: AvaxpTransactionParams): void {
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

  async verifyTransaction(params: AvaxpVerifyTransactionOptions): Promise<boolean> {
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
      case TransactionType.AddDelegator:
      case TransactionType.AddValidator:
        if (params.txParams.memo && explainedTx.memo !== params.txParams.memo.value) {
          throw new Error('Tx memo does not match with expected txParams memo');
        }

        this.validateStakingTx(stakingOptions, explainedTx);
        break;
      case TransactionType.Export:
        if (!params.txParams.recipients) {
          throw new Error('Export Tx requires a recipient');
        } else if (!explainedTx.memo) {
          throw new Error('Export Tx requires a memo with c-chain address');
        } else {
          this.validateExportTx(params.txParams.recipients, explainedTx.memo, explainedTx);
        }
        break;
      case TransactionType.Import:
        if (tx.isTransactionForCChain) {
          // Import to C-chain
          if (
            (params.txParams.recipients && params.txParams.recipients.length !== 0) ||
            explainedTx.outputs.length !== 1
          ) {
            throw new Error('Expected 1 output in import txn and does not require recipients');
          }
        } else {
          // Import to P-chain
          if (explainedTx.outputs.length !== 1) {
            throw new Error('Expected 1 output in import txn');
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
      new AvaxpLib.KeyPair({ pub: keychain.pub }).getAddress(this._staticsCoin.network.type)
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
   * Generate Avaxp key pair
   *
   * @param {Buffer} seed - Seed from which the new keypair should be generated, otherwise a random seed is used
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new AvaxpLib.KeyPair({ seed }) : new AvaxpLib.KeyPair();
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
      new AvaxpLib.KeyPair({ pub });
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
      new AvaxpLib.KeyPair({ prv });
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

    return AvaxpLib.Utils.isValidAddress(address);
  }

  /**
   * Signs Avaxp transaction
   */
  async signTransaction(params: AvaxpSignTransactionOptions): Promise<SignedTransaction> {
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

  async feeEstimate(params: FeeEstimateOptions): Promise<TransactionFee> {
    // staking transactions are fee-less
    return { fee: '0' };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /**
   * Explain a Avaxp transaction from txHex
   * @param params
   * @param callback
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<AvaxpLib.TransactionExplanation> {
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
    return AvaxpLib.Utils.recoverySignature(this._staticsCoin.network as AvalancheNetwork, message, signature);
  }

  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const prv = new AvaxpLib.KeyPair(key).getPrivateKey();
    if (!prv) {
      throw new SigningError('Invalid key pair options');
    }
    if (typeof message === 'string') {
      message = Buffer.from(message, 'hex');
    }
    return AvaxpLib.Utils.createSignature(this._staticsCoin.network as AvalancheNetwork, message, prv);
  }

  private getBuilder(): AvaxpLib.TransactionBuilderFactory {
    return new AvaxpLib.TransactionBuilderFactory(coins.get(this.getChain()));
  }
}
