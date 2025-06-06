import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import * as constants from './constants';
import { WithdrawDelegatorRewardsMessage } from './iface';
import { CosmosTransactionBuilder } from './transactionBuilder';
import { CosmosUtils } from './utils';

export class StakingWithdrawRewardsBuilder<CustomMessage = never> extends CosmosTransactionBuilder<CustomMessage> {
  protected _utils: CosmosUtils<CustomMessage>;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: CosmosUtils<CustomMessage>) {
    super(_coinConfig, utils);
    this._utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /** @inheritdoc */
  messages(withdrawRewardsMessages: WithdrawDelegatorRewardsMessage[]): this {
    this._messages = withdrawRewardsMessages.map((withdrawRewardsMessage) => {
      this._utils.validateWithdrawRewardsMessage(withdrawRewardsMessage);
      return {
        typeUrl: constants.withdrawDelegatorRewardMsgTypeUrl,
        value: withdrawRewardsMessage,
      };
    });
    return this;
  }
}
