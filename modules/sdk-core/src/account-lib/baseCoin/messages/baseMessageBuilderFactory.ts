import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IMessageBuilder, IMessageBuilderFactory } from './iface';
import { BroadcastableMessage, MessageStandardType } from '../../../bitgo';

/**
 * Base Message Builder
 */
export abstract class BaseMessageBuilderFactory implements IMessageBuilderFactory {
  protected coinConfig: Readonly<CoinConfig>;

  /**
   * Base constructor.
   * @param coinConfig BaseCoin from statics library
   */
  protected constructor(coinConfig: Readonly<CoinConfig>) {
    this.coinConfig = coinConfig;
  }

  /**
   * Gets a message builder for the specified message type
   * @param type The type of message to build
   * @returns A message builder instance for the specified type
   */
  public abstract getMessageBuilder(type: MessageStandardType): IMessageBuilder;

  /**
   * Gets a message builder from a broadcastable message
   * @param broadcastMessage The broadcastable message
   * @returns A message builder instance for the broadcastable message type
   */
  fromBroadcastFormat(broadcastMessage: BroadcastableMessage): IMessageBuilder {
    return this.getMessageBuilder(broadcastMessage.type);
  }

  /**
   * Parses a broadcastable message and gets the message builder based on the message type.
   * @param broadcastString The broadcastable message to parse
   * @returns A message builder instance for the parsed broadcastable message type
   */
  fromBroadcastString(broadcastString: string): IMessageBuilder {
    const broadcastMessage = JSON.parse(broadcastString) as BroadcastableMessage;
    return this.fromBroadcastFormat(broadcastMessage);
  }
}
