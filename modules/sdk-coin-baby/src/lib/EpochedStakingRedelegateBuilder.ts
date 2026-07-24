import * as constants from './constants';
import { StakingRedelegateBuilder } from '@bitgo/abstract-cosmos';
import { BabylonSpecificMessages } from './iface';

export class EpochedStakingRedelegateBuilder extends StakingRedelegateBuilder<BabylonSpecificMessages> {
  /** @inheritdoc */
  messages(redelegateMessages: Parameters<StakingRedelegateBuilder<BabylonSpecificMessages>['messages']>[0]): this {
    super.messages(redelegateMessages);
    this._messages.forEach((message) => (message.typeUrl = constants.wrappedBeginRedelegateTypeUrl));
    return this;
  }
}
