import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { StakingActivateBuilder } from './StakingActivateBuilder';
import { StakingDeactivateBuilder } from './StakingDeactivateBuilder';
import { StakingWithdrawRewardsBuilder } from './StakingWithdrawRewardsBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    const tx = new Transaction(this._coinConfig);
    tx.enrichTransactionDetailsFromRawTransaction(raw);
    try {
      switch (tx.type) {
        case TransactionType.Send:
          return this.getTransferBuilder(tx);
        case TransactionType.StakingActivate:
          return this.getStakingActivateBuilder(tx);
        case TransactionType.StakingDeactivate:
          return this.getStakingDeactivateBuilder(tx);
        case TransactionType.StakingWithdraw:
          return this.getStakingWithdrawRewardsBuilder(tx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw new InvalidTransactionError('Invalid transaction: ' + e.message);
    }
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }
  /** @inheritdoc */
  getStakingActivateBuilder(tx?: Transaction): StakingActivateBuilder {
    return this.initializeBuilder(tx, new StakingActivateBuilder(this._coinConfig));
  }
  /** @inheritdoc */
  getStakingDeactivateBuilder(tx?: Transaction): StakingDeactivateBuilder {
    return this.initializeBuilder(tx, new StakingDeactivateBuilder(this._coinConfig));
  }
  /** @inheritdoc */
  getStakingWithdrawRewardsBuilder(tx?: Transaction): StakingWithdrawRewardsBuilder {
    return this.initializeBuilder(tx, new StakingWithdrawRewardsBuilder(this._coinConfig));
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
  private initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
