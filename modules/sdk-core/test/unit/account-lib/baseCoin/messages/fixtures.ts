import {
  BaseMessage,
  BaseMessageBuilder,
  BaseMessageBuilderFactory,
  IMessage,
  IMessageBuilder,
  MessageOptions,
  MessageStandardType,
} from '../../../../../src';
import { BaseCoin } from '@bitgo/statics';

export class TestMessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<BaseCoin>) {
    super(coinConfig);
  }

  getMessageBuilder(type: MessageStandardType): IMessageBuilder {
    return new TestMessageBuilder(this.coinConfig, type);
  }
}

export class TestMessageBuilder extends BaseMessageBuilder {
  constructor(coinConfig: Readonly<BaseCoin>, type: MessageStandardType = MessageStandardType.UNKNOWN) {
    super(coinConfig, type);
  }

  async build(): Promise<IMessage> {
    return new TestMessage({
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

export class TestMessage extends BaseMessage {
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

export const messageSamples = {
  eip191: {
    payload: 'Hello BitGo!',
    type: MessageStandardType.EIP191,
    metadata: { chainId: 1 },
    signers: ['0x1234567890abcdef1234567890abcdef12345678'],
    signatures: [
      {
        publicKey: { pub: '0x1234567890abcdef1234567890abcdef12345678' },
        signature: Buffer.from('abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'hex'),
      },
    ],
  },
  unknown: {
    payload: 'Unknown message type',
    type: MessageStandardType.UNKNOWN,
    metadata: { version: '1.0' },
    signers: ['12345'],
    signatures: [
      {
        publicKey: { pub: '12345' },
        signature: Buffer.from('67890'),
      },
    ],
  },
};
