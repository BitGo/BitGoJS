import {
  CosmosTransaction,
  CosmosTransactionBuilder,
  CosmosTransferBuilder,
  StakingActivateBuilder,
  StakingDeactivateBuilder,
  StakingWithdrawRewardsBuilder,
  ContractCallBuilder,
  StakingRedelegateBuilder,
} from '@bitgo/abstract-cosmos';
import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): CosmosTransactionBuilder {
    const tx = new CosmosTransaction(this._coinConfig, utils);
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
        case TransactionType.ContractCall:
          return this.getContractCallBuilder(tx);
        case TransactionType.StakingRedelegate:
          return this.getStakingRedelegateBuilder(tx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw new InvalidTransactionError('Invalid transaction: ' + e.message);
    }
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: CosmosTransaction): CosmosTransferBuilder {
    return this.initializeBuilder(tx, new CosmosTransferBuilder(this._coinConfig, utils));
  }

  getStakingActivateBuilder(tx?: CosmosTransaction): StakingActivateBuilder {
    return this.initializeBuilder(tx, new StakingActivateBuilder(this._coinConfig, utils));
  }

  getStakingDeactivateBuilder(tx?: CosmosTransaction): StakingDeactivateBuilder {
    return this.initializeBuilder(tx, new StakingDeactivateBuilder(this._coinConfig, utils));
  }

  getStakingWithdrawRewardsBuilder(tx?: CosmosTransaction): StakingWithdrawRewardsBuilder {
    return this.initializeBuilder(tx, new StakingWithdrawRewardsBuilder(this._coinConfig, utils));
  }

  getContractCallBuilder(tx?: CosmosTransaction): ContractCallBuilder {
    return this.initializeBuilder(tx, new ContractCallBuilder(this._coinConfig, utils));
  }

  getStakingRedelegateBuilder(tx?: CosmosTransaction): StakingRedelegateBuilder {
    return this.initializeBuilder(tx, new StakingRedelegateBuilder(this._coinConfig, utils));
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
  private initializeBuilder<T extends CosmosTransactionBuilder>(tx: CosmosTransaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
