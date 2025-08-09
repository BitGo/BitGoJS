import { Cip8Message } from './cip8Message';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BaseMessageBuilder,
  IMessage,
  MessageOptions,
  MessageStandardType,
  MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE,
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
    this.whitelistedMessageTemplates = [
      MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE,
      // Add more templates as needed
    ];
  }

  /**
   * Builds a CIP-8 message instance with the provided options
   * @param options Options to create the message
   * @returns A Promise that resolves to a Cip8Message instance
   */
  async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new Cip8Message(options);
  }
}
