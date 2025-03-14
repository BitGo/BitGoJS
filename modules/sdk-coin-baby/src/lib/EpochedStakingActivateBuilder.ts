import * as constants from './constants';
import { StakingActivateBuilder } from '@bitgo/abstract-cosmos';

export class EpochedStakingActivateBuilder extends StakingActivateBuilder {
  /** @inheritdoc */
  messages(delegateMessages: Parameters<StakingActivateBuilder['messages']>[0]): this {
    super.messages(delegateMessages);
    this._messages.forEach((message) => (message.typeUrl = constants.wrappedDelegateMsgTypeUrl));
    return this;
  }
}
