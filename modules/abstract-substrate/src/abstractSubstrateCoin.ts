import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { CoinFamily, BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { KeyPair as SubstrateKeyPair } from './lib';
import { DEFAULT_SUBSTRATE_PREFIX } from './lib/constants';
import { SignTransactionOptions, VerifiedTransactionParameters } from './lib/iface';
import utils from './lib/utils';

export class SubstrateCoin extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  /**
   * Creates an instance of TransactionBuilderFactory for the coin specific sdk
   */
  getBuilder(): any {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritDoc **/
  getChain(): string {
    return this._staticsCoin.name;
  }

  /** @inheritDoc **/
  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  /** @inheritDoc **/
  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc **/
  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  /** @inheritDoc **/
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new SubstrateKeyPair({ seed }) : new SubstrateKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /** @inheritDoc **/
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /** @inheritDoc **/
  isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new Error('Method not implemented');
  }

  /** @inheritDoc **/
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  /** @inheritDoc **/
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txParams } = params;
    if (Array.isArray(txParams.recipients) && txParams.recipients.length > 1) {
      throw new Error(
        `${this.getChain()} doesn't support sending to more than 1 destination address within a single transaction. Try again, using only a single recipient.`
      );
    }
    return true;
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params?.prv;
    const txHex = params?.txPrebuild?.txHex;

    if (typeof txHex !== 'string') {
      throw new Error(`txHex must be string, got type ${typeof txHex}`);
    }

    if (typeof prv !== 'string') {
      throw new Error(`prv must be string, got type ${typeof prv}`);
    }

    return { txHex, prv };
  }

  /** @inheritDoc **/
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const { txHex, prv } = this.verifySignTransactionParams(params);
    const factory = this.getBuilder();
    const txBuilder = factory.from(txHex);
    const keyPair = new SubstrateKeyPair({ prv: prv });
    const { referenceBlock, blockNumber, transactionVersion, sender } = params.txPrebuild.transaction;

    txBuilder
      .validity({ firstValid: blockNumber, maxDuration: this.getMaxValidityDurationBlocks() })
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
   * Retrieves the address format for the substrate coin.
   *
   * @returns {number} The address format as a number.
   */
  protected getAddressFormat(): number {
    return DEFAULT_SUBSTRATE_PREFIX;
  }

  /**
   * Retrieves the maximum validity duration in blocks.
   *
   * This method is intended to be overridden by subclasses to provide the specific
   * maximum validity duration for different types of Substrate-based coins.
   *
   * @returns {number} The maximum validity duration in blocks.
   * @throws {Error} If the method is not implemented by the subclass.
   */
  protected getMaxValidityDurationBlocks(): number {
    throw new Error('Method not implemented.');
  }
}
