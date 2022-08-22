import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import assert from 'assert';
import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  KeyPair,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { KeyPair as AdaKeyPair, Transaction, TransactionBuilderFactory } from './lib';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import adaUtils from './lib/utils';

export interface TransactionPrebuild {
  txHex: string;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
}

export interface AdaParseTransactionOptions extends BaseParseTransactionOptions {
  txPrebuild: TransactionPrebuild;
}

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export type AdaTransactionExplanation = TransactionExplanation;

export class Ada extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Ada(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e6;
  }

  public getChain(): string {
    return this._staticsCoin.name;
  }

  public getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  public getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getBaseChain(): string {
    return this.getChain();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const transaction = new Transaction(coinConfig);
    assert(txPrebuild.txHex, new Error('missing required tx prebuild property txHex'));
    const rawTx = txPrebuild.txHex;

    transaction.fromRawTransaction(rawTx);
    const explainedTx = transaction.explainTransaction();

    if (txParams.recipients !== undefined) {
      const filteredRecipients = txParams.recipients?.map((recipient) => _.pick(recipient, ['address', 'amount']));
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount']));

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.plus(recipients.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const adaKeypair = new AdaKeyPair({ prv: key.prv });
    const messageHex = message instanceof Buffer ? message.toString('hex') : message;

    return Buffer.from(adaKeypair.signMessage(messageHex));
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<AdaTransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;
    const txRaw = params.txPrebuild.txHex;

    try {
      const transactionBuilder = factory.from(txRaw);
      rebuiltTransaction = await transactionBuilder.build();
    } catch {
      throw new Error('Invalid transaction');
    }

    return rebuiltTransaction.explainTransaction();
  }

  async parseTransaction(params: AdaParseTransactionOptions): Promise<ParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({
      txPrebuild: params.txPrebuild,
    });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    return transactionExplanation as unknown as ParsedTransaction;
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new AdaKeyPair({ seed }) : new AdaKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  isValidPub(pub: string): boolean {
    return adaUtils.isValidPublicKey(pub);
  }

  isValidPrv(prv: string): boolean {
    return adaUtils.isValidPrivateKey(prv);
  }

  isValidAddress(address: string): boolean {
    return adaUtils.isValidAddress(address);
  }

  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const factory = this.getBuilder();
    const txBuilder = factory.from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    const transaction: BaseTransaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid transaction');
    }

    const serializedTx = transaction.toBroadcastFormat();

    return {
      txHex: serializedTx,
    };
  }

  /** inherited doc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }
}
