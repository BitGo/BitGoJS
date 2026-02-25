import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError } from '@bitgo/sdk-core';

import { StakingWithdrawBuilder } from './stakingWithdrawBuilder';
import { StakingContractMethodNames } from './constants';

export class MetaPoolWithdrawBuilder extends StakingWithdrawBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.contractCallWrapper.methodName = StakingContractMethodNames.WithdrawAll;
    this.contractCallWrapper.args = {};
  }

  /** @inheritdoc */
  public amount(_amount: string): this {
    throw new BuildTransactionError('amount is not applicable for withdraw_all');
  }

  /** @inheritdoc */
  protected validateArgs(_args: Record<string, unknown>): void {
    // withdraw_all has no amount arg; amount is resolved on-chain
  }
}
