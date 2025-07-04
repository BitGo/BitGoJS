import { SimpleMessage } from './simpleMessage';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilder } from '../baseMessageBuilder';
import { MessageStandardType } from '../../../../bitgo';
import { IMessage } from '../iface';

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
  }

  /**
   * Build a signable message using the EIP-191 standard
   * with previously set input and metadata
   * @returns A signable message
   */
  public async build(): Promise<IMessage> {
    try {
      if (!this.payload) {
        throw new Error('Message payload must be set before building the message');
      }
      return new SimpleMessage({
        coinConfig: this.coinConfig,
        payload: this.payload,
        signatures: this.signatures,
        signers: this.signers,
        metadata: {
          ...this.metadata,
          encoding: 'utf8',
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Failed to build EIP-191 message');
    }
  }
}
