import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { BaseKey } from '@bitgo/sdk-core';
import { Utils } from '../';

/**
 * Common functionalities for claiming rewards and withdrawing unstaked builders.
 */
export abstract class StakingBaseClaimBuilder extends TransactionBuilder {
  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    return super.fromImplementation(rawTransaction);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    return super.signImplementation(key);
  }

  /**
   * Creates a withdrawal to add to our transaction body so we can withdraw from our rewards/stake address
   *
   * @param stakingPubKey User's public stake key
   * @param value Amount from the rewards address we're withdrawing
   */
  addWithdrawal(stakingPubKey: string, value: string) {
    const coinName = this._coinConfig.name;
    const rewardAddress = Utils.default.getRewardAddress(stakingPubKey, coinName);
    this._withdrawals.push({
      stakeAddress: rewardAddress,
      value,
    });
    return this;
  }
}
