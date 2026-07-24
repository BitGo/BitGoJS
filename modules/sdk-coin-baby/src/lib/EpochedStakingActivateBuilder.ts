import * as constants from './constants';
import { StakingActivateBuilder } from '@bitgo/abstract-cosmos';
import { BabylonSpecificMessages } from './iface';

export class EpochedStakingActivateBuilder extends StakingActivateBuilder<BabylonSpecificMessages> {
  /** @inheritdoc */
  messages(delegateMessages: Parameters<StakingActivateBuilder<BabylonSpecificMessages>['messages']>[0]): this {
    super.messages(delegateMessages);
    this._messages.forEach((message) => (message.typeUrl = constants.wrappedDelegateMsgTypeUrl));
    return this;
  }
}
