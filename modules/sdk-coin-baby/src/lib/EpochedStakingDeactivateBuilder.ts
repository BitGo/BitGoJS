import * as constants from './constants';
import { StakingDeactivateBuilder } from '@bitgo/abstract-cosmos';
import { BabylonSpecificMessages } from './iface';

export class EpochedStakingDeactivateBuilder extends StakingDeactivateBuilder<BabylonSpecificMessages> {
  /** @inheritdoc */
  messages(undelegateMessages: Parameters<StakingDeactivateBuilder<BabylonSpecificMessages>['messages']>[0]): this {
    super.messages(undelegateMessages);
    this._messages.forEach((message) => (message.typeUrl = constants.wrappedUndelegateMsgTypeUrl));
    return this;
  }
}
