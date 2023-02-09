import { BaseTransactionBuilderFactory, InvalidTransactionError } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { Transaction } from './transaction';
import { StakingBuilder } from './stakingBuilder';
import { MoveCallTx, PayTx, SuiTransaction, SuiTransactionType } from './iface';
import { StakingTransaction } from './stakingTransaction';
import { TransferTransaction } from './transferTransaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder<PayTx | MoveCallTx> {
    utils.validateRawTransaction(raw);
    const tx = this.parseTransaction(raw);
    try {
      switch (tx.type) {
        case SuiTransactionType.Pay:
        case SuiTransactionType.PaySui:
        case SuiTransactionType.PayAllSui:
          const payTx = new TransferTransaction(this._coinConfig);
          payTx.fromRawTransaction(raw);
          return this.getTransferBuilder(payTx);
        case SuiTransactionType.AddDelegation:
        case SuiTransactionType.WithdrawDelegation:
        case SuiTransactionType.SwitchDelegation:
          const stakingTransaction = new StakingTransaction(this._coinConfig);
          stakingTransaction.fromRawTransaction(raw);
          return this.getStakingBuilder(stakingTransaction);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction<PayTx>): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getStakingBuilder(tx?: Transaction<MoveCallTx>): StakingBuilder {
    return this.initializeBuilder(tx, new StakingBuilder(this._coinConfig));
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
  private initializeBuilder<T extends TransactionBuilder<PayTx | MoveCallTx>>(
    tx: Transaction<PayTx | MoveCallTx> | undefined,
    builder: T
  ): T {
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
  private parseTransaction(rawTransaction: string): SuiTransaction<PayTx | MoveCallTx> {
    return Transaction.deserializeSuiTransaction(rawTransaction);
  }
}
