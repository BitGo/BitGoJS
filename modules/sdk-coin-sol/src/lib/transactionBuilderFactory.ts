import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AtaInitializationBuilder } from './ataInitializationBuilder';
import { CloseAtaBuilder } from './closeAtaBuilder';
import { StakingActivateBuilder } from './stakingActivateBuilder';
import { StakingAuthorizeBuilder } from './stakingAuthorizeBuilder';
import { StakingDeactivateBuilder } from './stakingDeactivateBuilder';
import { StakingDelegateBuilder } from './stakingDelegateBuilder';
import { StakingRawMsgAuthorizeBuilder } from './stakingRawMsgAuthorizeBuilder';
import { StakingWithdrawBuilder } from './stakingWithdrawBuilder';
import { TokenTransferBuilder } from './tokenTransferBuilder';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferBuilder } from './transferBuilder';
import { TransferBuilderV2 } from './transferBuilderV2';
import { validateRawTransaction } from './utils';
import { WalletInitializationBuilder } from './walletInitializationBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Returns a proper builder for the given encoded transaction
   *
   * @param { string} raw - Encoded transaction in base64 string format
   */
  from(raw: string): TransactionBuilder | StakingRawMsgAuthorizeBuilder {
    validateRawTransaction(raw);
    const tx = this.parseTransaction(raw);
    try {
      switch (tx.type) {
        case TransactionType.Send:
          const uniqueInputCoins = tx.inputs
            .map((input) => input.coin)
            .filter((coin, index, arr) => arr.indexOf(coin) === index);
          if (uniqueInputCoins.includes('sol') || uniqueInputCoins.includes('tsol')) {
            return this.getTransferBuilderV2(tx);
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
          return this.getAtaInitializationBuilder(tx);
        case TransactionType.StakingAuthorize:
          return this.getStakingAuthorizeBuilder(tx);
        case TransactionType.StakingAuthorizeRaw:
          return this.getStakingRawMsgAuthorizeBuilder(tx);
        case TransactionType.StakingDelegate:
          return this.getStakingDelegateBuilder(tx);
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
   * Returns the transfer builder V2 to create a funds transfer transaction
   */
  getTransferBuilderV2(tx?: Transaction): TransferBuilderV2 {
    return this.initializeBuilder(tx, new TransferBuilderV2(this._coinConfig));
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
   * Returns the builder to authorized staking account.
   *
   * @param {Transaction} tx - the transaction to be used to intialize the builder
   * @returns {StakingAuthorizeBuilder} - the initialized staking authorize builder
   */
  getStakingAuthorizeBuilder(tx?: Transaction): StakingAuthorizeBuilder {
    return this.initializeBuilder(tx, new StakingAuthorizeBuilder(this._coinConfig));
  }
  /**
   * Returns the builder to delegate staking account.
   *
   * @param {Transaction} tx - the transaction to be used to delegate staking account
   * @returns {StakingDelegateBuilder} - the staking delegate builder
   */
  getStakingDelegateBuilder(tx?: Transaction): StakingDelegateBuilder {
    return this.initializeBuilder(tx, new StakingDelegateBuilder(this._coinConfig));
  }

  /**
   * Returns the raw message builder to authorized staking account.
   *
   * @param {Transaction} tx - the transaction to be used to intialize the builder
   * @returns {StakingWithdrawBuilder} - the initialized staking authorize builder
   */
  getStakingRawMsgAuthorizeBuilder(tx?: Transaction): StakingRawMsgAuthorizeBuilder {
    const builder = new StakingRawMsgAuthorizeBuilder(this._coinConfig);
    if (tx) {
      builder.initBuilder(tx);
    }
    return builder;
  }

  /**
   * Returns the builder to create a create associated token account transaction.
   */
  getAtaInitializationBuilder(tx?: Transaction): AtaInitializationBuilder {
    return this.initializeBuilder(tx, new AtaInitializationBuilder(this._coinConfig));
  }

  /**
   * Returns the builder to create a close associated token account transaction.
   */
  getCloseAtaInitializationBuilder(tx?: Transaction): CloseAtaBuilder {
    return this.initializeBuilder(tx, new CloseAtaBuilder(this._coinConfig));
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
