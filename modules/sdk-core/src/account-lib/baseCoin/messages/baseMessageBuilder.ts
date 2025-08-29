import { BroadcastableMessage, MessageOptions, MessagePayload, MessageStandardType } from './messageTypes';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { IMessage, IMessageBuilder } from './iface';
import { deserializeSignatures, Signature } from '../iface';
import { isMessageWhitelisted, MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE } from './index';

/**
 * Base Message Builder
 */
export abstract class BaseMessageBuilder implements IMessageBuilder {
  protected coinConfig: Readonly<CoinConfig>;
  protected payload: MessagePayload = '';
  protected type: MessageStandardType;
  protected signatures: Signature[] = [];
  protected signers: string[] = [];
  protected whitelistedMessageTemplates: Record<string, string> = {};
  protected metadata?: Record<string, unknown> = {};
  protected digest?: string;

  /**
   * Base constructor.
   * @param coinConfig BaseCoin from statics library
   * @param messageType The type of message this builder creates, defaults to UNKNOWN
   */
  protected constructor(
    coinConfig: Readonly<CoinConfig>,
    messageType: MessageStandardType = MessageStandardType.UNKNOWN
  ) {
    this.coinConfig = coinConfig;
    this.type = messageType;
    this.whitelistedMessageTemplates = this.getWhitelistedMessageTemplates();
  }

  /**
   * Sets the message payload to be used when building the message
   * @param payload The message payload (string, JSON, etc.)
   * @returns The builder instance for chaining
   */
  public setPayload(payload: MessagePayload): IMessageBuilder {
    this.payload = payload;
    return this;
  }

  /**
   * Sets metadata for the message
   * @param metadata Additional metadata for the message
   * @returns The builder instance for chaining
   */
  public setMetadata(metadata: Record<string, unknown>): IMessageBuilder {
    this.metadata = metadata;
    return this;
  }

  /**
   * Gets the current message payload
   * @returns The current message payload
   */
  public getPayload(): MessagePayload | undefined {
    return this.payload;
  }

  /**
   * Gets the current metadata
   * @returns The current metadata
   */
  public getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }

  public getType(): MessageStandardType {
    return this.type;
  }

  public setType(value: MessageStandardType): IMessageBuilder {
    this.type = value;
    return this;
  }

  public getSignatures(): Signature[] {
    return this.signatures;
  }

  public setSignatures(signatures: Signature[]): IMessageBuilder {
    this.signatures = signatures;
    return this;
  }

  public addSignature(signature: Signature): IMessageBuilder {
    if (
      !this.signatures.some(
        (sig) => sig.publicKey.pub === signature.publicKey.pub && sig.signature.equals(signature.signature)
      )
    ) {
      this.signatures.push(signature);
    }
    return this;
  }

  public getSigners(): string[] {
    return this.signers;
  }

  public setSigners(value: string[]): IMessageBuilder {
    this.signers = value;
    return this;
  }

  public addSigner(signer: string): IMessageBuilder {
    if (!this.signers.includes(signer)) {
      this.signers.push(signer);
    }
    return this;
  }

  public getDigest(): string | undefined {
    return this.digest;
  }

  public setDigest(value: string): IMessageBuilder {
    this.digest = value;
    return this;
  }

  public isMessageWhitelisted(messageRaw: string): boolean {
    return isMessageWhitelisted(this.whitelistedMessageTemplates, messageRaw);
  }

  /**
   * Builds a message using the previously set payload and metadata
   * @returns A Promise resolving to the built IMessage
   */
  public async build(): Promise<IMessage> {
    try {
      if (!this.payload) {
        throw new Error('Message payload must be set before building the message');
      }
      return this.buildMessage({
        coinConfig: this.coinConfig,
        payload: this.payload,
        type: this.type,
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
      throw new Error(`Failed to build message of type ${this.type}`);
    }
  }

  protected abstract buildMessage(options: MessageOptions): Promise<IMessage>;

  /**
   * Parse a broadcastable message back into a message
   * @param broadcastMessage The broadcastable message to parse
   * @returns The parsed message
   */
  public async fromBroadcastFormat(broadcastMessage: BroadcastableMessage): Promise<IMessage> {
    const { type, payload, serializedSignatures, signers, metadata } = broadcastMessage;
    if (type !== this.type) {
      throw new Error(`Invalid message type, expected ${this.type}`);
    }
    this.payload = payload;
    this.signatures = deserializeSignatures(serializedSignatures);
    this.signers = signers || [];
    this.metadata = {
      ...metadata,
      encoding: 'utf8',
    };
    return this.build();
  }

  protected getWhitelistedMessageTemplates(): Record<string, string> {
    return {
      midnightGDClaimMsgTemplate: MIDNIGHT_GLACIER_DROP_CLAIM_MESSAGE_TEMPLATE,
      // Add more whitelisted templates as needed
    };
  }
}
