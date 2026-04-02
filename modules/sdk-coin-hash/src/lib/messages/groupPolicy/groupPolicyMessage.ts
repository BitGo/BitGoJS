import { BaseMessage, MessageOptions, MessageStandardType } from '@bitgo/sdk-core';

/**
 * Implementation of Message for Provenance Group Policy signing standard.
 *
 * Go Accounts use this message type to sign Provenance Group Policy votes
 * on the Provenance blockchain. The signable payload is the raw message
 * bytes encoded as a Buffer, ready to be signed with a Provenance (HASH)
 * backing wallet key.
 */
export class GroupPolicyMessage extends BaseMessage {
  constructor(options: MessageOptions) {
    super({
      ...options,
      type: MessageStandardType.GROUP_POLICY,
    });
  }

  /**
   * Returns the raw message bytes as the signable payload.
   * The payload is the Provenance Group Policy message as provided by the caller.
   */
  async getSignablePayload(): Promise<string | Buffer> {
    if (!this.payload) {
      throw new Error('Message payload is required to build a Group Policy message');
    }
    this.signablePayload = Buffer.from(this.payload);
    return this.signablePayload;
  }
}
