import * as constants from './constants';
import { StakingDeactivateBuilder } from '@bitgo/abstract-cosmos';

export class EpochedStakingDeactivateBuilder extends StakingDeactivateBuilder {
  /** @inheritdoc */
  messages(undelegateMessages: Parameters<StakingDeactivateBuilder['messages']>[0]): this {
    super.messages(undelegateMessages);
    this._messages.forEach((message) => (message.typeUrl = constants.wrappedUndelegateMsgTypeUrl));
    return this;
  }
}
