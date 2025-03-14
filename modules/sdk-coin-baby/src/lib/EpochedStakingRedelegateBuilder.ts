import * as constants from './constants';
import { StakingRedelegateBuilder } from '@bitgo/abstract-cosmos';
import { CustomTxMessage } from './iface';

export class EpochedStakingRedelegateBuilder extends StakingRedelegateBuilder<CustomTxMessage> {
  /** @inheritdoc */
  messages(redelegateMessages: Parameters<StakingRedelegateBuilder<CustomTxMessage>['messages']>[0]): this {
    super.messages(redelegateMessages);
    this._messages.forEach((message) => (message.typeUrl = constants.wrappedBeginRedelegateTypeUrl));
    return this;
  }
}
