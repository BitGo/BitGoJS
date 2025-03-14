import * as constants from './constants';
import { StakingActivateBuilder } from '@bitgo/abstract-cosmos';
import { CustomTxMessage } from './iface';

export class EpochedStakingActivateBuilder extends StakingActivateBuilder<CustomTxMessage> {
  /** @inheritdoc */
  messages(delegateMessages: Parameters<StakingActivateBuilder<CustomTxMessage>['messages']>[0]): this {
    super.messages(delegateMessages);
    this._messages.forEach((message) => (message.typeUrl = constants.wrappedDelegateMsgTypeUrl));
    return this;
  }
}
