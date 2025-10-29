import { Transaction as VetTransaction } from '@vechain/sdk-core';
import { BaseTransactionBuilderFactory, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder/transactionBuilder';
import { TransferBuilder } from './transactionBuilder/transferBuilder';
import { AddressInitializationBuilder } from './transactionBuilder/addressInitializationBuilder';
import { FlushTokenTransactionBuilder } from './transactionBuilder/flushTokenTransactionBuilder';
import { ExitDelegationBuilder } from './transactionBuilder/exitDelegationBuilder';
import { BurnNftBuilder } from './transactionBuilder/burnNftBuilder';
import { ClaimRewardsBuilder } from './transactionBuilder/claimRewardsBuilder';
import { Transaction } from './transaction/transaction';
import utils from './utils';
import { AddressInitializationTransaction } from './transaction/addressInitializationTransaction';
import { FlushTokenTransaction } from './transaction/flushTokenTransaction';
import { ExitDelegationTransaction } from './transaction/exitDelegation';
import { BurnNftTransaction } from './transaction/burnNftTransaction';
import { ClaimRewardsTransaction } from './transaction/claimRewards';
import { TokenTransactionBuilder } from './transactionBuilder/tokenTransactionBuilder';
import { TokenTransaction } from './transaction/tokenTransaction';
import { StakingBuilder } from './transactionBuilder/stakingBuilder';
import { StakingTransaction } from './transaction/stakingTransaction';
import { NFTTransactionBuilder } from './transactionBuilder/nftTransactionBuilder';
import { NFTTransaction } from './transaction/nftTransaction';
import { StakeClauseTransaction } from './transaction/stakeClauseTransaction';
import { StakeClauseTxnBuilder } from './transactionBuilder/stakeClauseTxnBuilder';
import { DelegateTxnBuilder } from './transactionBuilder/delegateTxnBuilder';
import { DelegateClauseTransaction } from './transaction/delegateClauseTransaction';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(signedRawTx: string): TransactionBuilder {
    try {
      const signedTx = Transaction.deserializeTransaction(signedRawTx);
      const type = this.getTransactionTypeFromSignedTxn(signedTx);
      switch (type) {
        case TransactionType.Send:
          const transferTx = new Transaction(this._coinConfig);
          transferTx.fromDeserializedSignedTransaction(signedTx);
          return this.getTransferBuilder(transferTx);
        case TransactionType.AddressInitialization:
          const addressInitializationTx = new AddressInitializationTransaction(this._coinConfig);
          addressInitializationTx.fromDeserializedSignedTransaction(signedTx);
          return this.getAddressInitializationBuilder(addressInitializationTx);
        case TransactionType.FlushTokens:
          const flushTokenTx = new FlushTokenTransaction(this._coinConfig);
          flushTokenTx.fromDeserializedSignedTransaction(signedTx);
          return this.getFlushTokenTransactionBuilder(flushTokenTx);
        case TransactionType.SendToken:
          const tokenTransferTx = new TokenTransaction(this._coinConfig);
          tokenTransferTx.fromDeserializedSignedTransaction(signedTx);
          return this.getTokenTransactionBuilder(tokenTransferTx);
        case TransactionType.SendNFT:
          const nftTransferTx = new NFTTransaction(this._coinConfig);
          nftTransferTx.fromDeserializedSignedTransaction(signedTx);
          return this.getNFTTransactionBuilder(nftTransferTx);
        case TransactionType.ContractCall:
          const stakingTx = new StakingTransaction(this._coinConfig);
          stakingTx.fromDeserializedSignedTransaction(signedTx);
          return this.getStakingBuilder(stakingTx);
        case TransactionType.StakingActivate:
          const stakeClauseTx = new StakeClauseTransaction(this._coinConfig);
          stakeClauseTx.fromDeserializedSignedTransaction(signedTx);
          return this.getStakingActivateBuilder(stakeClauseTx);
        case TransactionType.StakingDelegate:
          const delegateClauseTx = new DelegateClauseTransaction(this._coinConfig);
          delegateClauseTx.fromDeserializedSignedTransaction(signedTx);
          return this.getStakingDelegateBuilder(delegateClauseTx);
        case TransactionType.StakingUnlock:
          const exitDelegationTx = new ExitDelegationTransaction(this._coinConfig);
          exitDelegationTx.fromDeserializedSignedTransaction(signedTx);
          return this.getExitDelegationBuilder(exitDelegationTx);
        case TransactionType.StakingWithdraw:
          const burnNftTx = new BurnNftTransaction(this._coinConfig);
          burnNftTx.fromDeserializedSignedTransaction(signedTx);
          return this.getBurnNftBuilder(burnNftTx);
        case TransactionType.StakingClaim:
          const claimRewardsTx = new ClaimRewardsTransaction(this._coinConfig);
          claimRewardsTx.fromDeserializedSignedTransaction(signedTx);
          return this.getClaimRewardsBuilder(claimRewardsTx);
        default:
          throw new InvalidTransactionError('Invalid transaction type');
      }
    } catch (e) {
      throw e;
    }
  }

  /** @inheritdoc */
  getTransferBuilder(tx?: Transaction): TransferBuilder {
    return this.initializeBuilder(tx, new TransferBuilder(this._coinConfig));
  }

  getAddressInitializationBuilder(tx?: AddressInitializationTransaction): AddressInitializationBuilder {
    return this.initializeBuilder(tx, new AddressInitializationBuilder(this._coinConfig));
  }

  getFlushTokenTransactionBuilder(tx?: FlushTokenTransaction): FlushTokenTransactionBuilder {
    return this.initializeBuilder(tx, new FlushTokenTransactionBuilder(this._coinConfig));
  }

  getTokenTransactionBuilder(tx?: Transaction): TokenTransactionBuilder {
    return this.initializeBuilder(tx, new TokenTransactionBuilder(this._coinConfig));
  }

  getStakingBuilder(tx?: StakingTransaction): StakingBuilder {
    return this.initializeBuilder(tx, new StakingBuilder(this._coinConfig));
  }

  getStakingDelegateBuilder(tx?: DelegateClauseTransaction): DelegateTxnBuilder {
    return this.initializeBuilder(tx, new DelegateTxnBuilder(this._coinConfig));
  }

  getStakingActivateBuilder(tx?: StakeClauseTransaction): StakeClauseTxnBuilder {
    return this.initializeBuilder(tx, new StakeClauseTxnBuilder(this._coinConfig));
  }

  /**
   * Gets an nft transaction builder.
   *
   * @param {NFTTransaction} tx - The nft transaction to use
   * @returns {NFTTransactionBuilder} The nft transaction builder
   */
  getNFTTransactionBuilder(tx?: Transaction): NFTTransactionBuilder {
    return this.initializeBuilder(tx, new NFTTransactionBuilder(this._coinConfig));
  }

  /**
   * Gets an exit delegation transaction builder.
   *
   * @param {ExitDelegationTransaction} tx - The exit delegation transaction to use
   * @returns {ExitDelegationBuilder} The exit delegation transaction builder
   */
  getExitDelegationBuilder(tx?: ExitDelegationTransaction): ExitDelegationBuilder {
    return this.initializeBuilder(tx, new ExitDelegationBuilder(this._coinConfig));
  }

  /**
   * Gets a burn NFT transaction builder.
   *
   * @param {BurnNftTransaction} tx - The burn NFT transaction to use
   * @returns {BurnNftBuilder} The burn NFT transaction builder
   */
  getBurnNftBuilder(tx?: BurnNftTransaction): BurnNftBuilder {
    return this.initializeBuilder(tx, new BurnNftBuilder(this._coinConfig));
  }

  /**
   * Gets a claim rewards transaction builder.
   *
   * @param {ClaimRewardsTransaction} tx - The claim rewards transaction to use
   * @returns {ClaimRewardsBuilder} The claim rewards transaction builder
   */
  getClaimRewardsBuilder(tx?: ClaimRewardsTransaction): ClaimRewardsBuilder {
    return this.initializeBuilder(tx, new ClaimRewardsBuilder(this._coinConfig));
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): void {
    throw new Error('Method not implemented.');
  }

  getTransactionTypeFromSignedTxn(signedTxn: VetTransaction): TransactionType {
    return utils.getTransactionTypeFromClause(signedTxn.body.clauses);
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
