import { TransactionType } from '@bitgo/sdk-core';
import { StakingBaseClaimBuilder } from './stakingBaseClaimBuilder';

/**
 * Transaction builder for claiming staking rewards.
 */
export class StakingClaimRewardsBuilder extends StakingBaseClaimBuilder {
  constructor(_coinConfig) {
    super(_coinConfig);
    this._type = TransactionType.StakingClaim;
  }

  /** @inheritdoc */
  async buildImplementation() {
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StakingClaim);
    return tx;
  }
}
