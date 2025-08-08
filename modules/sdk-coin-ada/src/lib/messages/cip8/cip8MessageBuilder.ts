import { Cip8Message } from './cip8Message';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilder, IMessage, MessageOptions, MessageStandardType } from '@bitgo/sdk-core';

/**
 * Builder for CIP-8 messages
 */
export class Cip8MessageBuilder extends BaseMessageBuilder {
  private static readonly MIDNIGHT_TNC_HASH = '31a6bab50a84b8439adcfb786bb2020f6807e6e8fda629b424110fc7bb1c6b8b';

  /*
   * matches a message that starts with "STAR ", followed by a number,
   * then " to addr" or " to addr_test1", followed by a 50+ character alphanumeric address,
   * and ends with the midnight TnC hash
   */
  private static readonly MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE = `STAR \\d+ to addr(?:1|_test1)[a-z0-9]{50,} ${Cip8MessageBuilder.MIDNIGHT_TNC_HASH}`;
  /**
   * Base constructor.
   * @param _coinConfig BaseCoin from statics library
   */
  public constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig, MessageStandardType.CIP8);
  }

  /**
   * Builds a CIP-8 message instance with the provided options
   * @param options Options to create the message
   * @returns A Promise that resolves to a Cip8Message instance
   */
  async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new Cip8Message(options);
  }

  /**
   * Validates the signable payload
   * @param message The message to validate
   * @returns A boolean indicating whether the signable payload is valid
   */
  public validateSignablePayload(message: string | Buffer): boolean {
    const messageStr = Buffer.isBuffer(message) ? message.toString('utf8') : message;
    const regex = new RegExp(`^${Cip8MessageBuilder.MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE}$`, 's');
    return regex.test(messageStr);
  }
}
