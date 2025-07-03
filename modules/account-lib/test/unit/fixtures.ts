import { BaseCoin } from '@bitgo/statics';
import {
  BaseMessage,
  BaseMessageBuilder,
  BaseMessageBuilderFactory,
  IMessage,
  IMessageBuilder,
  MessageOptions,
  MessageStandardType,
} from '@bitgo/sdk-core';

export class MockMessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<BaseCoin>) {
    super(coinConfig);
  }

  getMessageBuilder(type: MessageStandardType): IMessageBuilder {
    return new MockMessageBuilder(this.coinConfig, type);
  }
}

export class MockMessageBuilder extends BaseMessageBuilder {
  constructor(coinConfig: Readonly<BaseCoin>, type: MessageStandardType = MessageStandardType.UNKNOWN) {
    super(coinConfig, type);
  }

  async build(): Promise<IMessage> {
    return new MockMessage({
      coinConfig: this.coinConfig,
      payload: this.payload,
      type: this.type,
      signatures: this.signatures,
      signers: this.signers,
      metadata: {
        ...this.metadata,
      },
    });
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
    if (this.signablePayload) {
      return this.signablePayload;
    }
    return Buffer.from(this.payload);
  }
}
