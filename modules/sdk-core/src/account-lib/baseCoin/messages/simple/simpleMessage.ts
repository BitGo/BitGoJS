import { BaseMessage } from '../baseMessage';
import { MessageOptions, MessageStandardType } from '../messageTypes';

/**
 * Implementation of String Message
 */
export class SimpleMessage extends BaseMessage {
  constructor(options: MessageOptions) {
    super({
      ...options,
      type: MessageStandardType.SIMPLE,
    });
  }

  /**
   * Returns the signable payload for the message
   */
  async getSignablePayload(): Promise<string | Buffer> {
    if (!this.payload) {
      throw new Error('Message payload is missing');
    }
    this.signablePayload = Buffer.from(this.payload);
    return this.signablePayload;
  }
}
