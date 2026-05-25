import { BaseMessage, MessageOptions, MessageStandardType } from '@bitgo/sdk-core';

/**
 * Implementation of Message for EIP191 standard
 */
export class EIP191Message extends BaseMessage {
  constructor(options: MessageOptions) {
    super({
      ...options,
      type: MessageStandardType.EIP191,
    });
  }

  /**
   * Returns the hash of the EIP-191 prefixed message
   */
  async getSignablePayload(): Promise<string | Buffer> {
    const prefix = `\u0019Ethereum Signed Message:\n${this.payload.length}`;
    this.signablePayload = Buffer.from(prefix.concat(this.payload)).toString('hex');
    return this.signablePayload;
  }
}
