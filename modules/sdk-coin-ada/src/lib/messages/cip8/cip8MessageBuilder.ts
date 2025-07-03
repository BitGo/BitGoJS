import { Cip8Message } from './cip8Message';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseMessageBuilder,
  BroadcastableMessage,
  deserializeSignatures,
  IMessage,
  MessageStandardType,
} from '@bitgo/sdk-core';

/**
 * Builder for CIP-8 messages
 */
export class Cip8MessageBuilder extends BaseMessageBuilder {
  /**
   * Base constructor.
   * @param _coinConfig BaseCoin from statics library
   */
  public constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig, MessageStandardType.CIP8);
  }

  /**
   * Build a signable message using the CIP-8 standard
   * with previously set input and metadata
   * @returns A signable message
   */
  public async build(): Promise<IMessage> {
    try {
      if (!this.payload) {
        throw new Error('Message payload must be set before building the message');
      }
      return new Cip8Message({
        coinConfig: this.coinConfig,
        payload: this.payload,
        signatures: this.signatures,
        signers: this.signers,
        metadata: {
          ...this.metadata,
          encoding: 'utf8',
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Failed to build CIP-8 message');
    }
  }

  /**
   * Parse a broadcastable message back into a message
   * @param broadcastMessage The broadcastable message to parse
   * @returns The parsed message
   */
  public async fromBroadcastFormat(broadcastMessage: BroadcastableMessage): Promise<IMessage> {
    const { type, payload, serializedSignatures, signers, metadata } = broadcastMessage;
    if (type !== MessageStandardType.CIP8) {
      throw new Error(`Invalid message type, expected ${MessageStandardType.CIP8}`);
    }
    return new Cip8Message({
      coinConfig: this.coinConfig,
      payload,
      signatures: deserializeSignatures(serializedSignatures),
      signers,
      metadata: {
        ...metadata,
        encoding: 'utf8',
      },
    });
  }
}
