import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BroadcastableMessage,
  MessageMetadata,
  MessageOptions,
  MessagePayload,
  MessageStandardType,
} from '../../../bitgo';
import { IMessage } from './iface';

export abstract class BaseMessage implements IMessage {
  protected coinConfig: Readonly<CoinConfig>;
  protected type: MessageStandardType;
  protected payload: MessagePayload;
  protected signatures: string[] = [];
  protected signers: string[] = [];
  protected signablePayload?: string | Buffer;
  protected metadata?: MessageMetadata;

  /**
   * Base constructor.
   *
   * @param options Message options containing type, payload, metadata, etc.
   */
  protected constructor(options: MessageOptions) {
    this.coinConfig = options.coinConfig;
    this.type = options.type || MessageStandardType.UNKNOWN;
    this.payload = options.payload || '';
    this.signablePayload = options.signablePayload;
    this.metadata = options.metadata || {};

    if (options.signatures) {
      this.signatures = [...options.signatures];
    }
    if (options.signers) {
      this.signers = [...options.signers];
    }
  }

  /**
   * Get the message type
   */
  getType(): MessageStandardType {
    return this.type;
  }

  /**
   * Get the message payload
   */
  getPayload(): MessagePayload {
    return this.payload;
  }

  /**
   * Get the metadata associated with the message
   */
  getMetadata(): MessageMetadata | undefined {
    return this.metadata;
  }

  /**
   * Gets all signers addresses or public keys
   */
  getSigners(): string[] {
    return [...this.signers];
  }

  /**
   * Adds a signer address or public key
   * @param signer The address or public key of the signer
   */
  addSigner(signer: string): void {
    if (!this.signers.includes(signer)) {
      this.signers.push(signer);
    }
  }

  /**
   * Sets signers addresses or public keys
   * @param signers Array of addresses or public keys
   */
  setSigners(signers: string[]): void {
    this.signers = [...signers];
  }

  /**
   * Gets all signatures associated with this message
   */
  getSignatures(): string[] {
    return [...this.signatures];
  }

  /**
   * Sets signatures for this message
   * @param signatures Array of signatures to set
   */
  setSignatures(signatures: string[]): void {
    this.signatures = [...signatures];
  }

  /**
   * Adds a signature to this message
   * @param signature The signature to add
   */
  addSignature(signature: string): void {
    this.signatures.push(signature);
  }

  /**
   * Gets the payload that should be signed
   * Each message standard must implement this method
   */
  abstract getSignablePayload(): Promise<string | Buffer>;

  /**
   * Converts this message to a broadcastable format
   * Uses internal signatures and signers that were previously set
   * @returns A broadcastable message
   */
  async toBroadcastFormat(): Promise<BroadcastableMessage> {
    if (this.signatures.length === 0) {
      throw new Error('No signatures available for broadcast. Call setSignatures or addSignature first.');
    }

    if (this.signers.length === 0) {
      throw new Error('No signers available for broadcast. Call setSigners or addSigner first.');
    }

    return {
      type: this.type,
      payload: this.payload,
      signatures: this.signatures,
      signers: this.signers,
      metadata: {
        ...(this.metadata ? JSON.parse(JSON.stringify(this.metadata)) : {}), // deep copy to avoid mutation
      },
      signablePayload: this.signablePayload,
    };
  }

  /**
   * Serializes the broadcastable message to a string
   * Uses internal signatures and signers that were previously set
   * @returns A JSON string representation of the broadcastable message
   */
  async toBroadcastString(): Promise<string> {
    const broadcastable = await this.toBroadcastFormat();
    return JSON.stringify(broadcastable);
  }
}
