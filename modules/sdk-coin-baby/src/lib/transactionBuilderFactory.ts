import {
  ContractCallBuilder,
  CosmosTransaction,
  CosmosTransactionBuilder,
  CosmosTransferBuilder,
  StakingActivateBuilder,
  StakingDeactivateBuilder,
  StakingRedelegateBuilder,
  StakingWithdrawRewardsBuilder,
} from '@bitgo/abstract-cosmos';
import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { EpochedStakingActivateBuilder } from './EpochedStakingActivateBuilder';
import { EpochedStakingDeactivateBuilder } from './EpochedStakingDeactivateBuilder';
import { EpochedStakingRedelegateBuilder } from './EpochedStakingRedelegateBuilder';
import { CustomTransactionBuilder } from './CustomTransactionBuilder';
import { CustomTxMessage } from './iface';
import utils from './utils';
import { BabylonTransaction } from './BabylonTransaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): CosmosTransactionBuilder<CustomTxMessage> {
    const tx = new BabylonTransaction(this._coinConfig, utils);
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
        case TransactionType.CustomTx:
          return this.getCustomTransactionBuilder(tx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw new InvalidTransactionError('Invalid transaction: ' + e.message);
    }
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: CosmosTransaction<CustomTxMessage>): CosmosTransferBuilder<CustomTxMessage> {
    return this.initializeBuilder(tx, new CosmosTransferBuilder(this._coinConfig, utils));
  }
  /** @inheritdoc */
  getStakingActivateBuilder(tx?: CosmosTransaction<CustomTxMessage>): StakingActivateBuilder<CustomTxMessage> {
    return this.initializeBuilder(tx, new EpochedStakingActivateBuilder(this._coinConfig, utils));
  }
  /** @inheritdoc */
  getStakingDeactivateBuilder(tx?: CosmosTransaction<CustomTxMessage>): StakingDeactivateBuilder<CustomTxMessage> {
    return this.initializeBuilder(tx, new EpochedStakingDeactivateBuilder(this._coinConfig, utils));
  }
  /** @inheritdoc */
  getStakingWithdrawRewardsBuilder(
    tx?: CosmosTransaction<CustomTxMessage>
  ): StakingWithdrawRewardsBuilder<CustomTxMessage> {
    return this.initializeBuilder(tx, new StakingWithdrawRewardsBuilder(this._coinConfig, utils));
  }

  getContractCallBuilder(tx?: CosmosTransaction<CustomTxMessage>): ContractCallBuilder<CustomTxMessage> {
    return this.initializeBuilder(tx, new ContractCallBuilder(this._coinConfig, utils));
  }

  getStakingRedelegateBuilder(tx?: CosmosTransaction<CustomTxMessage>): StakingRedelegateBuilder<CustomTxMessage> {
    return this.initializeBuilder(tx, new EpochedStakingRedelegateBuilder(this._coinConfig, utils));
  }

  getCustomTransactionBuilder(tx?: CosmosTransaction<CustomTxMessage>): CosmosTransactionBuilder<CustomTxMessage> {
    return this.initializeBuilder(tx, new CustomTransactionBuilder(this._coinConfig, utils));
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
  private initializeBuilder<T extends CosmosTransactionBuilder<CustomTxMessage>>(
    tx: CosmosTransaction<CustomTxMessage> | undefined,
    builder: T
  ): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
