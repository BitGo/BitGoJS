import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IMessageBuilder, IMessageBuilderFactory } from './iface';
import { BroadcastableMessage, MessageStandardType } from './messageTypes';
import { deserializeSignatures } from '../iface';

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
    const builder = this.getMessageBuilder(broadcastMessage.type);
    builder.setPayload(broadcastMessage.payload);
    builder.setMetadata(broadcastMessage.metadata || {});
    if (broadcastMessage.signers) {
      builder.setSigners(broadcastMessage.signers);
    }
    if (broadcastMessage.serializedSignatures) {
      builder.setSignatures(deserializeSignatures(broadcastMessage.serializedSignatures));
    }
    return builder;
  }

  /**
   * Parses a broadcastable message and gets the message builder based on the message type.
   * @param broadcastHex The broadcastable message to parse
   * @returns A message builder instance for the parsed broadcastable message type
   */
  fromBroadcastString(broadcastHex: string): IMessageBuilder {
    const broadcastStr = Buffer.from(broadcastHex, 'hex').toString();
    const broadcastMessage = JSON.parse(broadcastStr) as BroadcastableMessage;
    return this.fromBroadcastFormat(broadcastMessage);
  }
}
