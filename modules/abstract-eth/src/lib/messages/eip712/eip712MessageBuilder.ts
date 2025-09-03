import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilder, IMessage, MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { EIP712Message } from './eip712Message';

export class Eip712MessageBuilder extends BaseMessageBuilder {
  public constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig, MessageStandardType.EIP712);
  }

  async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new EIP712Message(options);
  }
}
