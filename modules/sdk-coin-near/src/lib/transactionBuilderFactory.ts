import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { AbstractDelegateBuilder } from './abstractDelegateBuilder';
import { DelegateTransaction } from './delegateTransaction';
import { FungibleTokenTransferBuilder } from './fungibleTokenTransferBuilder';
import { InitializableBuilder } from './initializableBuilder';
import { StakingActivateBuilder } from './stakingActivateBuilder';
import { StakingDeactivateBuilder } from './stakingDeactivateBuilder';
import { StakingWithdrawBuilder } from './stakingWithdrawBuilder';
import { StorageDepositTransferBuilder } from './storageDepositTransferBuilder';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransactionFactory } from './transactionFactory';
import { TransferBuilder } from './transferBuilder';
import { WalletInitializationBuilder } from './walletInitializationBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder | AbstractDelegateBuilder {
    try {
      const tx = TransactionFactory.fromRawTransaction(raw, this._coinConfig);
      switch (tx.type) {
        case TransactionType.Send:
          return this.getTransferBuilder(tx as Transaction);
        case TransactionType.WalletInitialization:
          return this.getWalletInitializationBuilder(tx as Transaction);
        case TransactionType.StakingActivate:
          return this.getStakingActivateBuilder(tx as Transaction);
        case TransactionType.StakingDeactivate:
          return this.getStakingDeactivateBuilder(tx as Transaction);
        case TransactionType.StakingWithdraw:
          return this.getStakingWithdrawBuilder(tx as Transaction);
        case TransactionType.SendToken:
          return this.getFungibleTokenTransferBuilder(tx as DelegateTransaction);
        case TransactionType.StorageDeposit:
          return this.getStorageDepositTransferBuilder(tx as DelegateTransaction);
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

  getStakingDeactivateBuilder(tx?: Transaction): StakingDeactivateBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new StakingDeactivateBuilder(this._coinConfig));
  }

  getStakingWithdrawBuilder(tx?: Transaction): StakingWithdrawBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new StakingWithdrawBuilder(this._coinConfig));
  }

  getFungibleTokenTransferBuilder(tx?: DelegateTransaction): FungibleTokenTransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new FungibleTokenTransferBuilder(this._coinConfig));
  }

  getStorageDepositTransferBuilder(tx?: DelegateTransaction): StorageDepositTransferBuilder {
    return TransactionBuilderFactory.initializeBuilder(tx, new StorageDepositTransferBuilder(this._coinConfig));
  }

  /**
   * Initialize the builder with the given transaction
   *
   * @param {Transaction | undefined} tx - the transaction used to initialize the builder
   * @param {TransactionBuilder} builder - the builder to be initialized
   * @returns {TransactionBuilder} the builder initialized
   */
  private static initializeBuilder<T extends InitializableBuilder>(
    tx: Transaction | DelegateTransaction | undefined,
    builder: T
  ): T {
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }
}
