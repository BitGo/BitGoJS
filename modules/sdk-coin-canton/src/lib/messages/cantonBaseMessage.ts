import { BaseMessage } from '@bitgo/sdk-core';

/**
 * Shared base for Canton message types.
 *
 * Both CANTON_SIGN_TRANSACTION and CANTON_SIGN_TOPOLOGY sign the same thing —
 * the raw bytes of a base64-encoded txHash. The only difference between the two
 * concrete classes is the MessageStandardType, which wallet-platform uses to
 * choose the correct HSM payload format (Format 1 vs Format 2).
 *
 * Extracting the common getSignablePayload() here prevents the two classes from
 * drifting apart if the encoding ever changes.
 */
export abstract class CantonBaseMessage extends BaseMessage {
  async getSignablePayload(): Promise<string | Buffer> {
    if (!this.payload) {
      throw new Error('Message payload is missing');
    }
    // txHash arrives as a base64 string; decode to raw bytes for signing.
    // Equivalent to the normal transaction flow: Buffer.from(preparedTransactionHash, 'base64').
    this.signablePayload = Buffer.from(this.payload, 'base64');
    return this.signablePayload;
  }
}
