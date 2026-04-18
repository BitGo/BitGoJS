import { BaseCoin as CoinConfig } from '@bitgo/statics';
import Long from 'long';
import { proto } from '@hashgraph/proto';
import { BaseKey, BuildTransactionError, SigningError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { buildHederaAccountID, isValidAddress, stringifyAccountId } from './utils';
import { DEFAULT_SIGNER_NUMBER } from './constants';

export class AccountUpdateBuilder extends TransactionBuilder {
  private readonly _txBodyData: proto.CryptoUpdateTransactionBody;
  private _accountId: string;
  private _stakedNodeId?: Long;
  private _declineStakingReward?: boolean;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._txBodyData = new proto.CryptoUpdateTransactionBody();
    this._txBody.cryptoUpdateAccount = this._txBodyData;
  }

  /** @inheritdoc */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);
    const updateBody = tx.txBody.cryptoUpdateAccount;
    if (updateBody) {
      if (updateBody.accountIDToUpdate) {
        this._accountId = stringifyAccountId(updateBody.accountIDToUpdate);
      }
      if (updateBody.stakedNodeId != null) {
        this._stakedNodeId = Long.fromValue(updateBody.stakedNodeId);
      }
      if (updateBody.declineReward != null) {
        const raw = updateBody.declineReward;
        this._declineStakingReward = typeof raw === 'boolean' ? raw : (raw as { value: boolean }).value;
      }
    }
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    if (this._multiSignerKeyPairs.length >= DEFAULT_SIGNER_NUMBER) {
      throw new SigningError('A maximum of ' + DEFAULT_SIGNER_NUMBER + ' can sign the transaction.');
    }
    return super.signImplementation(key);
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._txBodyData.accountIDToUpdate = buildHederaAccountID(this._accountId || this._source.address);
    if (this._stakedNodeId !== undefined) {
      this._txBodyData.stakedNodeId = this._stakedNodeId;
    }
    if (this._declineStakingReward !== undefined) {
      this._txBodyData.declineReward = { value: this._declineStakingReward };
    }
    this.transaction.setTransactionType(TransactionType.AccountUpdate);
    return await super.buildImplementation();
  }

  /** @inheritdoc */
  validateMandatoryFields(): void {
    if (this._stakedNodeId === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing stakedNodeId');
    }
    super.validateMandatoryFields();
  }

  /**
   * Set the account to update. Defaults to the source account if not set.
   *
   * @param {string} accountId - The account ID in format <shard>.<realm>.<account>
   * @returns {AccountUpdateBuilder} - This builder
   */
  account(accountId: string): this {
    if (!isValidAddress(accountId)) {
      throw new BuildTransactionError('Invalid account address: ' + accountId);
    }
    this._accountId = accountId;
    return this;
  }

  /**
   * Set the staked node ID. Use -1 to unstake.
   *
   * @param {number} nodeId - The consensus node ID to stake to, or -1 to clear staking
   * @returns {AccountUpdateBuilder} - This builder
   */
  stakedNodeId(nodeId: number): this {
    this._stakedNodeId = Long.fromNumber(nodeId);
    return this;
  }

  /**
   * Set whether to decline staking rewards.
   *
   * @param {boolean} decline - True to decline rewards, false to accept
   * @returns {AccountUpdateBuilder} - This builder
   */
  declineStakingReward(decline: boolean): this {
    this._declineStakingReward = decline;
    return this;
  }
}
