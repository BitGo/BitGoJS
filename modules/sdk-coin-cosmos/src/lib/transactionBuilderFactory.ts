import {
  CosmosTransaction,
  CosmosTransactionBuilder,
  CosmosTransferBuilder,
  StakingActivateBuilder,
  StakingDeactivateBuilder,
  StakingRedelegateBuilder,
  StakingWithdrawRewardsBuilder,
  ContractCallBuilder,
} from '@bitgo-beta/abstract-cosmos';
import { BaseCoin as CoinConfig, CosmosNetwork } from '@bitgo-beta/statics';
import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo-beta/sdk-core';
import { Utils } from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  private readonly _utils: Utils;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._utils = new Utils(_coinConfig.network as CosmosNetwork);
  }

  /** @inheritdoc */
  from(raw: string): CosmosTransactionBuilder {
    const tx = new CosmosTransaction(this._coinConfig, this._utils);
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
    return this.initializeBuilder(tx, new CosmosTransferBuilder(this._coinConfig, this._utils));
  }

  /** @inheritdoc */
  getStakingActivateBuilder(tx?: CosmosTransaction): StakingActivateBuilder {
    return this.initializeBuilder(tx, new StakingActivateBuilder(this._coinConfig, this._utils));
  }

  /** @inheritdoc */
  getStakingDeactivateBuilder(tx?: CosmosTransaction): StakingDeactivateBuilder {
    return this.initializeBuilder(tx, new StakingDeactivateBuilder(this._coinConfig, this._utils));
  }

  /** @inheritdoc */
  getStakingWithdrawRewardsBuilder(tx?: CosmosTransaction): StakingWithdrawRewardsBuilder {
    return this.initializeBuilder(tx, new StakingWithdrawRewardsBuilder(this._coinConfig, this._utils));
  }

  /** @inheritdoc */
  getStakingRedelegateBuilder(tx?: CosmosTransaction): StakingRedelegateBuilder {
    return this.initializeBuilder(tx, new StakingRedelegateBuilder(this._coinConfig, this._utils));
  }

  /** @inheritdoc */
  getContractCallBuilder(tx?: CosmosTransaction): ContractCallBuilder {
    return this.initializeBuilder(tx, new ContractCallBuilder(this._coinConfig, this._utils));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {CosmosTransaction | undefined} tx - the transaction used to initialize the builder
   * @param {CosmosTransactionBuilder} builder - the builder to be initialized
   * @returns {CosmosTransactionBuilder} the builder initialized
   */
  private initializeBuilder<T extends CosmosTransactionBuilder>(tx: CosmosTransaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
