import { EIP191Message } from './eip191Message';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { BaseMessageBuilder, IMessage, MessageOptions, MessageStandardType } from '@bitgo-beta/sdk-core';

/**
 * Builder for EIP-191 messages
 */
export class Eip191MessageBuilder extends BaseMessageBuilder {
  /**
   * Base constructor.
   * @param _coinConfig BaseCoin from statics library
   */
  public constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig, MessageStandardType.EIP191);
  }

  /**
   * Builds an EIP-191 message instance with the provided options
   * @param options Options to create the message
   * @returns A Promise that resolves to an EIP191Message instance
   */
  async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new EIP191Message(options);
  }
}
