import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { WithdrawDelegatorRewardsMessage, CosmosConstants } from '@bitgo/abstract-cosmos';
import utils from './utils';
import { OsmoTransactionBuilder } from './transactionBuilder';

export class StakingWithdrawRewardsBuilder extends OsmoTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /** @inheritdoc */
  messages(withdrawRewardsMessages: WithdrawDelegatorRewardsMessage[]): this {
    this._messages = withdrawRewardsMessages.map((withdrawRewardsMessage) => {
      utils.validateWithdrawRewardsMessage(withdrawRewardsMessage);
      return {
        typeUrl: CosmosConstants.withdrawDelegatorRewardMsgTypeUrl,
        value: withdrawRewardsMessage,
      };
    });
    return this;
  }
}
