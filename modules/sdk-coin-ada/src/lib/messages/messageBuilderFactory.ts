import { Cip8MessageBuilder } from './cip8';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { BaseMessageBuilderFactory, IMessageBuilder, MessageStandardType } from '@bitgo-beta/sdk-core';

export class MessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  public getMessageBuilder(type: MessageStandardType): IMessageBuilder {
    switch (type) {
      case MessageStandardType.CIP8:
        return new Cip8MessageBuilder(this.coinConfig);
      default:
        throw new Error(`Invalid message standard ${type}`);
    }
  }
}
