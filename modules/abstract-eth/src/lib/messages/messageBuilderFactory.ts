import { Eip191MessageBuilder } from './eip191';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilderFactory, IMessageBuilder, MessageStandardType } from '@bitgo/sdk-core';

export class MessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  public getMessageBuilder(type: MessageStandardType): IMessageBuilder {
    switch (type) {
      case MessageStandardType.EIP191:
        return new Eip191MessageBuilder(this.coinConfig);
      default:
        throw new Error(`Invalid message standard ${type}`);
    }
  }
}
