import * as _ from 'lodash';
import {
  BaseCoin,
  BitGoBase,
  DotAssetTypes,
  ExplanationResult,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  UnsignedTransaction,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Interface, KeyPair as DotKeyPair, Utils, TransactionBuilderFactory } from './lib';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  transaction: Interface.TxData;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
}

const dotUtils = Utils.default;

export class Dot extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  readonly MAX_VALIDITY_DURATION = 2400;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Dot(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'dot';
  }

  getBaseChain(): string {
    return 'dot';
  }

  getFamily(): string {
    return 'dot';
  }

  getFullName(): string {
    return 'Polkadot';
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? dotUtils.keyPairFromSeed(new Uint8Array(seed)) : new DotKeyPair();
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
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return dotUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid dot private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return dotUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return dotUtils.isValidAddress(address);
  }

  /**
   * Sign message with private key
   *
   * @param key
   * @param message
   * @return {Buffer} A signature over the given message using the given key
   */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const msg = Buffer.isBuffer(message) ? message.toString('utf8') : message;
    // reconstitute keys and sign
    return Buffer.from(new DotKeyPair({ prv: key.prv }).signMessage(msg));
  }

  /**
   * Explain/parse transaction
   * @param unsignedTransaction
   */
  async explainTransaction(unsignedTransaction: UnsignedTransaction): Promise<ExplanationResult> {
    let outputAmount = 0;
    unsignedTransaction.parsedTx.outputs.forEach((o) => {
      outputAmount += parseInt(o.valueString, 10);
    });
    const explanationResult: ExplanationResult = {
      displayOrder: [
        'outputAmount',
        'changeAmount',
        'outputs',
        'changeOutputs',
        'fee',
        'type',
        'sequenceId',
        'id',
        'blockNumber',
      ],
      sequenceId: unsignedTransaction.parsedTx.sequenceId,
      fee: unsignedTransaction.feeInfo?.feeString,
      id: unsignedTransaction.parsedTx.id,
      type: unsignedTransaction.parsedTx.type,
      outputs: unsignedTransaction.parsedTx.outputs,
      blockNumber: unsignedTransaction.coinSpecific?.blockNumber,
      outputAmount: outputAmount,
      changeOutputs: [],
      changeAmount: '0',
    };

    return explanationResult;
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;

    const txHex = params.txPrebuild.txHex;

    if (_.isUndefined(txHex)) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isString(txHex)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txHex}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params, 'pubs')) {
      throw new Error('missing public key parameter to sign transaction');
    }

    return { txHex, prv };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {TransactionPrebuild} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @returns {Promise<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const { txHex, prv } = this.verifySignTransactionParams(params);
    const factory = this.getBuilder();
    const txBuilder = factory.from(txHex);
    const keyPair = new DotKeyPair({ prv: prv });
    const { referenceBlock, blockNumber, transactionVersion, sender } = params.txPrebuild.transaction;

    txBuilder
      .validity({ firstValid: blockNumber, maxDuration: this.MAX_VALIDITY_DURATION })
      .referenceBlock(referenceBlock)
      .version(transactionVersion)
      .sender({ address: sender })
      .sign({ key: keyPair.getKeys().prv });
    const transaction = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid transaction');
    }
    const signedTxHex = transaction.toBroadcastFormat();
    return { txHex: signedTxHex };
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: never): Promise<never> {
    throw new MethodNotImplementedError('Dot recovery not implemented');
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  getAddressFromPublicKey(Pubkey: string): string {
    return new DotKeyPair({ pub: Pubkey }).getAddress(Utils.default.getAddressFormat(this.getChain() as DotAssetTypes));
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }
}
