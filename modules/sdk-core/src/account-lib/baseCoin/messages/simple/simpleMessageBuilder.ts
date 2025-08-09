import { SimpleMessage } from './simpleMessage';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilder } from '../baseMessageBuilder';
import { MessageOptions, MessageStandardType } from '../messageTypes';
import { IMessage } from '../iface';
import { MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE } from '../midnight';

/**
 * Builder for string messages
 */
export class SimpleMessageBuilder extends BaseMessageBuilder {
  /**
   * Base constructor.
   * @param _coinConfig BaseCoin from statics library
   */
  public constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig, MessageStandardType.SIMPLE);
    this.whitelistedMessageTemplates = [
      MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE,
      // Add more templates as needed
    ];
  }

  /**
   * Builds a SimpleMessage instance with the provided options
   * @param options Options to create the message
   * @returns A Promise that resolves to a SimpleMessage instance
   */
  public async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new SimpleMessage(options);
  }
}
