import { BaseCoin } from '@bitgo/statics';
import * as sdkCore from '@bitgo/sdk-core';
import type { IMessage, IMessageBuilder, MessageOptions } from '@bitgo/sdk-core';
const { BaseMessage, BaseMessageBuilder, BaseMessageBuilderFactory, MessageStandardType } = sdkCore;

type MessageStandardTypeValue = (typeof MessageStandardType)[keyof typeof MessageStandardType];

export class MockMessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<BaseCoin>) {
    super(coinConfig);
  }

  getMessageBuilder(type: MessageStandardTypeValue): IMessageBuilder {
    return new MockMessageBuilder(this.coinConfig, type);
  }
}

export class MockMessageBuilder extends BaseMessageBuilder {
  constructor(coinConfig: Readonly<BaseCoin>, type: MessageStandardTypeValue = MessageStandardType.UNKNOWN) {
    super(coinConfig, type);
  }

  async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new MockMessage(options);
  }

  async fromBroadcastFormat(broadcastMessage: any): Promise<IMessage> {
    this.setType(broadcastMessage.type);
    this.setPayload(broadcastMessage.payload);
    this.setSignatures(broadcastMessage.signatures || []);
    this.setSigners(broadcastMessage.signers || []);
    if (broadcastMessage.metadata) {
      this.setMetadata(broadcastMessage.metadata);
    }
    return this.build();
  }
}

export class MockMessage extends BaseMessage {
  constructor(options: MessageOptions) {
    super(options);
  }

  async getSignablePayload(): Promise<string | Buffer> {
    this.signablePayload = Buffer.from(this.payload);
    return this.signablePayload;
  }
}
