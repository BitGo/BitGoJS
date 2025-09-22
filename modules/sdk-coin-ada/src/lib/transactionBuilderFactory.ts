import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo-beta/sdk-core';
import { TransferBuilder } from './transferBuilder';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { StakingActivateBuilder } from './stakingActivateBuilder';
import { StakingDeactivateBuilder } from './stakingDeactivateBuilder';
import { StakingWithdrawBuilder } from './stakingWithdrawBuilder';
import { StakingPledgeBuilder } from './stakingPledgeBuilder';
import { StakingClaimRewardsBuilder } from './stakingClaimRewardsBuilder';
import { VoteDelegationBuilder } from './voteDelegationBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: Uint8Array | string): TransactionBuilder {
    if (raw instanceof Uint8Array) {
      return this.from(Buffer.from(raw).toString('hex'));
    }
    try {
      const tx = new Transaction(this._coinConfig);
      tx.fromRawTransaction(raw);
      switch (tx.type) {
        case TransactionType.Send:
          return this.getTransferBuilder(tx);
        case TransactionType.StakingActivate:
          return this.getStakingActivateBuilder(tx);
        case TransactionType.StakingClaim:
          return this.getStakingClaimRewardsBuilder(tx);
        case TransactionType.StakingDeactivate:
          return this.getStakingDeactivateBuilder(tx);
        case TransactionType.StakingWithdraw:
          return this.getStakingWithdrawBuilder(tx);
        case TransactionType.WalletInitialization:
          return this.getWalletInitializationBuilder(tx);
        case TransactionType.StakingPledge:
          return this.getStakingPledgeBuilder(tx);
        case TransactionType.VoteDelegation:
          return this.getVoteDelegationBuilder(tx);
        default:
          throw new InvalidTransactionError('unsupported transaction');
      }
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  getStakingActivateBuilder(tx?: Transaction): StakingActivateBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new StakingActivateBuilder(this._coinConfig));
  }

  getVoteDelegationBuilder(tx?: Transaction): VoteDelegationBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new VoteDelegationBuilder(this._coinConfig));
  }

  getStakingClaimRewardsBuilder(tx?: Transaction): StakingClaimRewardsBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new StakingClaimRewardsBuilder(this._coinConfig));
  }

  getStakingDeactivateBuilder(tx?: Transaction): StakingDeactivateBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new StakingDeactivateBuilder(this._coinConfig));
  }

  getStakingWithdrawBuilder(tx?: Transaction): StakingWithdrawBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new StakingWithdrawBuilder(this._coinConfig));
  }

  getStakingPledgeBuilder(tx?: Transaction): StakingPledgeBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new StakingPledgeBuilder(this._coinConfig));
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private static initializeBuilder<T extends TransactionBuilder>(tx: Transaction | undefined, builder: T): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
