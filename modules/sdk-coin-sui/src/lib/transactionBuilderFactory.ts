import { BaseTransactionBuilderFactory, InvalidTransactionError } from '@bitgo/sdk-core';
import { TransferBuilder } from './transferBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { StakingBuilder } from './stakingBuilder';
import {
  CustomProgrammableTransaction,
  StakingProgrammableTransaction,
  SuiTransaction,
  SuiTransactionType,
  TransferProgrammableTransaction,
  UnstakingProgrammableTransaction,
} from './iface';
import { StakingTransaction } from './stakingTransaction';
import { TransferTransaction } from './transferTransaction';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';
import { UnstakingBuilder } from './unstakingBuilder';
import { UnstakingTransaction } from './unstakingTransaction';
import { CustomTransaction } from './customTransaction';
import { CustomTransactionBuilder } from './customTransactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder<TransferProgrammableTransaction | StakingProgrammableTransaction> {
    utils.validateRawTransaction(raw);
    const tx = this.parseTransaction(raw);
    try {
      switch (tx.type) {
        case SuiTransactionType.Transfer:
          const transferTx = new TransferTransaction(this._coinConfig);
          transferTx.fromRawTransaction(raw);
          return this.getTransferBuilder(transferTx);
        case SuiTransactionType.AddStake:
          const stakingTransaction = new StakingTransaction(this._coinConfig);
          stakingTransaction.fromRawTransaction(raw);
          return this.getStakingBuilder(stakingTransaction);
        case SuiTransactionType.WithdrawStake:
          const unstakingTransaction = new UnstakingTransaction(this._coinConfig);
          unstakingTransaction.fromRawTransaction(raw);
          return this.getUnstakingBuilder(unstakingTransaction);
        case SuiTransactionType.CustomTx:
          const customTransaction = new CustomTransaction(this._coinConfig);
          customTransaction.fromRawTransaction(raw);
          return this.getCustomTransactionBuilder(customTransaction);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction<TransferProgrammableTransaction>): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getStakingBuilder(tx?: Transaction<StakingProgrammableTransaction>): StakingBuilder {
    return this.initializeBuilder(tx, new StakingBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getUnstakingBuilder(tx?: Transaction<UnstakingProgrammableTransaction>): UnstakingBuilder {
    return this.initializeBuilder(tx, new UnstakingBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getCustomTransactionBuilder(tx?: Transaction<CustomProgrammableTransaction>): CustomTransactionBuilder {
    return this.initializeBuilder(tx, new CustomTransactionBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private initializeBuilder<
    T extends TransactionBuilder<TransferProgrammableTransaction | StakingProgrammableTransaction>
  >(tx: Transaction<TransferProgrammableTransaction | StakingProgrammableTransaction> | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /** Parse the transaction from a raw transaction
   *
   * @param {string} rawTransaction - the raw tx
   * @returns {Transaction} parsedtransaction
   */
  private parseTransaction(
    rawTransaction: string
  ): SuiTransaction<TransferProgrammableTransaction | StakingProgrammableTransaction> {
    return Transaction.deserializeSuiTransaction(rawTransaction);
  }
}
