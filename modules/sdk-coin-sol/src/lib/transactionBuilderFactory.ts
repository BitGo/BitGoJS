import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransferBuilder } from './transferBuilder';
import { WalletInitializationBuilder } from './walletInitializationBuilder';
import { TransactionBuilder } from './transactionBuilder';
import { StakingActivateBuilder } from './stakingActivateBuilder';
import { StakingDeactivateBuilder } from './stakingDeactivateBuilder';
import { Transaction } from './transaction';
import { validateRawTransaction } from './utils';
import { StakingWithdrawBuilder } from './stakingWithdrawBuilder';
import { AtaInitializationBuilder } from './ataInitializationBuilder';
import { AtaInitializationTransaction } from './ataInitializationTransaction';
import { TokenTransferBuilder } from './tokenTransferBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Returns a proper builder for the given encoded transaction
   *
   * @param { string} raw - Encoded transaction in base64 string format
   */
  from(raw: string): TransactionBuilder {
    validateRawTransaction(raw);
    const tx = this.parseTransaction(raw);
    try {
      switch (tx.type) {
        case TransactionType.Send:
          if (tx.inputs[0].coin === 'sol' || tx.inputs[0].coin === 'tsol') {
            return this.getTransferBuilder(tx);
          } else {
            return this.getTokenTransferBuilder(tx);
          }
        case TransactionType.WalletInitialization:
          return this.getWalletInitializationBuilder(tx);
        case TransactionType.StakingActivate:
          return this.getStakingActivateBuilder(tx);
        case TransactionType.StakingDeactivate:
          return this.getStakingDeactivateBuilder(tx);
        case TransactionType.StakingWithdraw:
          return this.getStakingWithdrawBuilder(tx);
        case TransactionType.AssociatedTokenAccountInitialization:
          const ataTx = new AtaInitializationTransaction(this._coinConfig);
          ataTx.fromRawTransaction(raw);
          return this.getAtaInitializationBuilder(ataTx);
        default:
          throw new InvalidTransactionError('Invalid transaction');
      }
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(tx?: Transaction): WalletInitializationBuilder {
    return this.initializeBuilder(tx, new WalletInitializationBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getTokenTransferBuilder(tx?: Transaction): TokenTransferBuilder {
    return this.initializeBuilder(tx, new TokenTransferBuilder(this._coinConfig));
  }

  /**
   * Returns the staking builder to create a staking account and also a delegate in one transaction.
   * once the tx reach the network it will automatically by activated on next epoch
   *
   * @see https://docs.solana.com/cluster/stake-delegation-and-rewards#stake-warmup-cooldown-withdrawal
   *
   * @param {Transaction} tx - the transaction to be used to initialize the builder
   * @returns {StakingDeactivateBuilder} - the initialized staking activate builder
   */
  getStakingActivateBuilder(tx?: Transaction): StakingActivateBuilder {
    return this.initializeBuilder(tx, new StakingActivateBuilder(this._coinConfig));
  }

  /**
   * Returns the builder to create a staking deactivate transaction.
   * Deactivated is set in the current epoch + cooldown
   * The account's stake will ramp down to zero by that epoch, and the lamports will be available for withdrawal.
   *
   * @see https://docs.solana.com/cluster/stake-delegation-and-rewards#stake-warmup-cooldown-withdrawal
   *
   * @param {Transaction} tx - the transaction to be used to initialize the builder
   * @returns {StakingDeactivateBuilder} - the initialized staking deactivate builder
   */
  getStakingDeactivateBuilder(tx?: Transaction): StakingDeactivateBuilder {
    return this.initializeBuilder(tx, new StakingDeactivateBuilder(this._coinConfig));
  }

  /**
   * Returns the builder to create a staking withdraw transaction.
   * once the staking account reach 0 SOL it will not be traceable anymore by the network
   *
   * @see https://docs.solana.com/staking/stake-accounts#destroying-a-stake-account
   *
   * @param {Transaction} tx - the transaction to be used to intialize the builder
   * @returns {StakingWithdrawBuilder} - the initialized staking withdraw builder
   */
  getStakingWithdrawBuilder(tx?: Transaction): StakingWithdrawBuilder {
    return this.initializeBuilder(tx, new StakingWithdrawBuilder(this._coinConfig));
  }

  /**
   * Returns the builder to create a create associated token account transaction.
   */
  getAtaInitializationBuilder(tx?: Transaction): AtaInitializationBuilder {
    return this.initializeBuilder(tx, new AtaInitializationBuilder(this._coinConfig));
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

  /** Parse the transaction from a raw transaction
   *
   * @param {string} rawTransaction - the raw tx
   * @returns {Transaction} parsed transaction
   */
  private parseTransaction(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    tx.fromRawTransaction(rawTransaction);
    return tx;
  }
}
