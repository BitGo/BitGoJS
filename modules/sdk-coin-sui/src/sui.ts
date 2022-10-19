import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  KeyPair,
  MethodNotImplementedError,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  TransactionExplanation,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { Transaction, TransactionBuilderFactory } from './lib';
import utils from './lib/utils';
import * as _ from 'lodash';

export interface ExplainTransactionOptions {
  txHex: string;
}

export type SuiTransactionExplanation = TransactionExplanation;

export class Sui extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Sui(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e9;
  }

  public getChain(): string {
    return 'sui';
  }

  public getFamily(): string {
    return 'sui';
  }

  public getFullName(): string {
    return 'Sui';
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const transaction = new Transaction(coinConfig);
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }

    transaction.fromRawTransaction(rawTx);
    const explainedTx = transaction.explainTransaction();

    if (txParams.recipients && txParams.recipients.length > 0) {
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
    throw new MethodNotImplementedError();
  }

  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    throw new Error('Method not implemented.');
  }

  isValidPub(pub: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidPrv(prv: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Explain a Sui transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<SuiTransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;

    try {
      const transactionBuilder = factory.from(params.txHex);
      rebuiltTransaction = await transactionBuilder.build();
    } catch {
      throw new Error('Invalid transaction');
    }

    return rebuiltTransaction.explainTransaction();
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }
}
