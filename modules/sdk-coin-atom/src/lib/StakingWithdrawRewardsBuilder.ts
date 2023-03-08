import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { withdrawDelegatorRewardMsgTypeUrl } from './constants';
import { WithdrawDelegatorRewardsMessage } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class StakingWithdrawRewardsBuilder extends TransactionBuilder {
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
        typeUrl: withdrawDelegatorRewardMsgTypeUrl,
        value: withdrawRewardsMessage,
      };
    });
    return this;
  }
}
