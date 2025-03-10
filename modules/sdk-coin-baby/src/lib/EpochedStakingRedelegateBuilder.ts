import * as constants from './constants';
import { StakingRedelegateBuilder } from '@bitgo/abstract-cosmos';

export class EpochedStakingRedelegateBuilder extends StakingRedelegateBuilder {
  /** @inheritdoc */
  messages(redelegateMessages: Parameters<StakingRedelegateBuilder['messages']>[0]): this {
    super.messages(redelegateMessages);
    this._messages.forEach((message) => (message.typeUrl = constants.wrappedBeginRedelegateTypeUrl));
    return this;
  }
}
