import { BaseCoin as CoinConfig } from '@bitgo/statics';
import {
  BroadcastableMessage,
  MessageMetadata,
  MessageOptions,
  MessagePayload,
  MessageStandardType,
} from './messageTypes';
import { IMessage } from './iface';
import { serializeSignatures, Signature } from '../iface';

export abstract class BaseMessage implements IMessage {
  protected coinConfig: Readonly<CoinConfig>;
  protected type: MessageStandardType;
  protected payload: MessagePayload;
  protected signatures: Signature[] = [];
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
    this.payload = options.payload;
    this.type = options.type || MessageStandardType.UNKNOWN;
    this.signablePayload = options.signablePayload;
    this.metadata = options.metadata || {};

    if (options.signatures) {
      // Deep copy each Signature object, including the Buffer
      this.signatures = options.signatures.map((sig) => ({
        publicKey: { ...sig.publicKey },
        signature: Buffer.from(sig.signature),
      }));
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
  getSignatures(): Signature[] {
    return [...this.signatures];
  }

  /**
   * Sets signatures for this message
   * @param signatures Array of signatures to set
   */
  setSignatures(signatures: Signature[]): void {
    this.signatures = [...signatures];
  }

  /**
   * Adds a signature to this message
   * @param signature The signature to add
   */
  addSignature(signature: Signature): void {
    this.signatures.push(signature);
  }

  /**
   * Gets the payload that should be signed
   * Each message standard must implement this method
   */
  abstract getSignablePayload(): Promise<string | Buffer>;

  /**
   * Gets the signatures in a format suitable for broadcasting
   */
  getBroadcastableSignatures(): Signature[] {
    return this.signatures;
  }

  /**
   * Converts this message to a broadcastable format
   * Uses internal signatures and signers that were previously set
   * @returns A broadcastable message
   */
  async toBroadcastFormat(): Promise<BroadcastableMessage> {
    if (!this.payload) {
      throw new Error('Message payload must be set before converting to broadcast format');
    }
    const signablePayload = await this.getSignablePayload();
    let serializedSignablePayload: string;
    if (Buffer.isBuffer(signablePayload)) {
      serializedSignablePayload = signablePayload.toString('base64');
    } else {
      serializedSignablePayload = Buffer.from(String(signablePayload)).toString('base64');
    }

    return {
      type: this.type,
      payload: this.payload,
      serializedSignatures: serializeSignatures(this.getBroadcastableSignatures()),
      signers: [...this.signers],
      metadata: {
        ...(this.metadata ? JSON.parse(JSON.stringify(this.metadata)) : {}), // deep copy to avoid mutation
      },
      signablePayload: serializedSignablePayload,
    };
  }

  /**
   * Serializes the broadcastable message to a string
   * Uses internal signatures and signers that were previously set
   * @returns A JSON string representation of the broadcastable message
   */
  async toBroadcastString(): Promise<string> {
    const broadcastable = await this.toBroadcastFormat();
    const broadcastableStr = JSON.stringify(broadcastable);
    return Buffer.from(broadcastableStr).toString('hex');
  }

  /**
   * Verifies if the provided encoded message matches the signable payload
   * @param messageEncodedHex The encoded message in hex format
   * @param metadata Optional metadata for additional verification context
   * @returns True if the encoded message matches the signable payload, false otherwise
   */
  async verifyEncodedPayload(messageEncodedHex: string, metadata?: Record<string, unknown>): Promise<boolean> {
    const signablePayload = await this.getSignablePayload();
    let signablePayloadHex: string;
    if (Buffer.isBuffer(signablePayload)) {
      signablePayloadHex = signablePayload.toString('hex');
    } else {
      signablePayloadHex = signablePayload;
    }
    return signablePayloadHex === messageEncodedHex;
  }
}
