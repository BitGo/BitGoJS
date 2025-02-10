import * as _ from 'lodash';
import {
  BaseCoin,
  BitGoBase,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import { KeyPair as SubstrateKeyPair } from './lib';
import utils from './lib/utils';
import { TransactionBuilderFactory } from './lib/transactionBuilderFactory';
import { SignTransactionOptions, VerifiedTransactionParameters } from './lib/iface';

export abstract class SubstrateCoin extends BaseCoin {
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
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
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
  allowsAccountConsolidations(): boolean {
    return true;
  }

  /** @inheritDoc **/
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
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
    const prv = params.prv;
    const txHex = params.txPrebuild.txHex;
    if (!txHex || typeof txHex !== 'string') {
      throw new Error('invalid txHex parameter');
    }
    if (!prv || typeof prv !== 'string') {
      throw new Error('invalid prv parameter');
    }
    if (!_.has(params, 'pubs')) {
      throw new Error('missing public key parameter to sign transaction');
    }
    return { txHex, prv };
  }

  /** @inheritDoc **/
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const { txHex, prv } = this.verifySignTransactionParams(params);
    const factory = this.getBuilder();
    const txBuilder = factory.from(txHex);
    const keyPair = new SubstrateKeyPair({ prv: prv });
    const { referenceBlock, blockNumber, sender } = params.txPrebuild.transaction;

    txBuilder
      .validity({ firstValid: blockNumber, maxDuration: this.getMaxValidityDurationBlocks() })
      .referenceBlock(referenceBlock)
      .sender({ address: sender })
      .sign({ key: keyPair.getKeys().prv });
    const transaction = await txBuilder.build();
    if (!transaction) {
      throw new Error('Invalid transaction');
    }
    const signedTxHex = transaction.toBroadcastFormat();
    return { txHex: signedTxHex };
  }

  abstract getMaxValidityDurationBlocks(): number;

  abstract getSS58Format(): number;
}
