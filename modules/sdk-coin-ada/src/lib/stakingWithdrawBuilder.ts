import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Transaction } from './transaction';
import { StakingBaseClaimBuilder } from './stakingBaseClaimBuilder';

/**
 * Transaction builder for withdrawing unstaked ADAs.
 */
export class StakingWithdrawBuilder extends StakingBaseClaimBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._type = TransactionType.StakingWithdraw;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const tx = await super.buildImplementation();
    tx.setTransactionType(TransactionType.StakingWithdraw);
    return tx;
  }
}
