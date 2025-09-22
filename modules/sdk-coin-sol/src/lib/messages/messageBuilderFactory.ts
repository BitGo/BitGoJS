import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import {
  BaseMessageBuilderFactory,
  IMessageBuilder,
  MessageStandardType,
  SimpleMessageBuilder,
} from '@bitgo-beta/sdk-core';

export class MessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  public getMessageBuilder(type: MessageStandardType): IMessageBuilder {
    switch (type) {
      case MessageStandardType.SIMPLE:
        return new SimpleMessageBuilder(this.coinConfig);
      default:
        throw new Error(`Invalid message standard ${type}`);
    }
  }
}
