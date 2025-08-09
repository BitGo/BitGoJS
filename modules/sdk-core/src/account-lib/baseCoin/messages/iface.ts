import { BroadcastableMessage, MessageMetadata, MessagePayload, MessageStandardType } from './messageTypes';
import { Signature } from '../iface';

/**
 * Represents a built message that can be signed
 */
export interface IMessage {
  /**
   * Get the message type
   */
  getType(): MessageStandardType;

  /**
   * Get the message payload
   */
  getPayload(): MessagePayload;

  /**
   * Get the metadata associated with the message
   */
  getMetadata(): MessageMetadata | undefined;

  /**
   * Gets all signers addresses or public keys
   */
  getSigners(): string[];

  /**
   * Adds a signer address or public key
   * @param signer The address or public key of the signer
   */
  addSigner(signer: string): void;

  /**
   * Sets signers addresses or public keys
   * @param signers Array of addresses or public keys
   */
  setSigners(signers: string[]): void;

  /**
   * Gets all signatures associated with this message
   */
  getSignatures(): Signature[];

  /**
   * Sets signatures for this message
   * @param signatures Array of signatures to set
   */
  setSignatures(signatures: Signature[]): void;

  /**
   * Adds a signature to this message
   * @param signature The signature to add
   */
  addSignature(signature: Signature): void;

  /**
   * Returns the payload that should be signed
   * This might be different from the original payload in some standards
   * For example, in EIP-712, this would be the encoded typed data hash
   */
  getSignablePayload(): Promise<string | Buffer>;

  /**
   * Creates a broadcastable message format that includes the signatures
   * Uses internal signatures and signers that were previously set
   * @returns A serializable format for broadcasting
   */
  toBroadcastFormat(): Promise<BroadcastableMessage>;

  /**
   * Serializes the broadcastable message to a string
   * Uses internal signatures and signers that were previously set
   * @returns A JSON string representation of the broadcastable message
   */
  toBroadcastString(): Promise<string>;

  /**
   * Verifies if the provided encoded message matches the expected format
   * @param messageEncodedHex The encoded message in hex format to verify
   * @param metadata Optional metadata to include in the verification
   * @returns A Promise resolving to true if the message is valid, false otherwise
   */
  verifyEncodedPayload(messageEncodedHex: string, metadata?: Record<string, unknown>): Promise<boolean>;
}

/**
 * Core interface for message building strategies
 */
export interface IMessageBuilder {
  /**
   * Sets the message payload to be used when building the message
   * @param payload The message payload (string, JSON, etc.)
   * @returns The builder instance for chaining
   */
  setPayload(payload: MessagePayload): IMessageBuilder;

  /**
   * Sets metadata for the message
   * @param metadata Additional metadata for the message
   * @returns The builder instance for chaining
   */
  setMetadata(metadata: Record<string, unknown>): IMessageBuilder;

  /**
   * Sets the signatures to the message
   * @param signatures The signatures to add
   * @returns The builder instance for chaining
   */
  setSignatures(signatures: Signature[]): IMessageBuilder;

  /**
   * Adds a signature to the message
   * @param signature The signature to add
   * @returns The builder instance for chaining
   */
  addSignature(signature: Signature): IMessageBuilder;

  /**
   * Sets the signers for the message
   * @param signers Array of addresses or public keys
   * @returns The builder instance for chaining
   */
  setSigners(signers: string[]): IMessageBuilder;

  /**
   * Adds a signer address or public key
   * @param signer The address or public key of the signer
   * @returns The builder instance for chaining
   */
  addSigner(signer: string): IMessageBuilder;

  /**
   * Gets the current message payload
   * @returns The current message payload
   */
  getPayload(): MessagePayload | undefined;

  /**
   * Checks if the message string is whitelisted
   * @param messageRaw The raw message string to check
   * @return True if the message is whitelisted, false otherwise
   */
  isMessageWhitelisted(messageRaw: string): boolean;

  /**
   * Gets the current metadata
   * @returns The current metadata
   */
  getMetadata(): Record<string, unknown> | undefined;

  /**
   * Gets the type of message being built
   * @returns The type of message standard
   */
  getType(): MessageStandardType;

  /**
   * Builds a message using the previously set payload and metadata
   * @returns A Promise resolving to the built SignableMessage
   */
  build(): Promise<IMessage>;

  /**
   * Parse a broadcastable message back into a message and signatures
   * @param message The broadcastable message to parse
   * @returns The parsed message and signature
   */
  fromBroadcastFormat(message: BroadcastableMessage): Promise<IMessage>;
}

/**
 * Factory interface for creating message builders
 */
export interface IMessageBuilderFactory {
  /**
   * Gets a message builder for the specified message type
   * @param type The type of message to build
   * @returns A message builder instance for the specified type
   */
  getMessageBuilder(type: MessageStandardType): IMessageBuilder;

  /**
   * Parse a broadcastable message back into a signable message and signature
   * This factory method will automatically choose the correct builder based on the message type
   * @param broadcastMessage The broadcastable message to parse
   * @returns A message builder instance for the parsed specified type
   */
  fromBroadcastFormat(broadcastMessage: BroadcastableMessage): IMessageBuilder;

  /**
   * Parse a broadcastable message string back into a signable message and signature
   * @param broadcastString The JSON string representation of the broadcast message
   * @returns A message builder instance for the parsed specified type
   */
  fromBroadcastString(broadcastString: string): IMessageBuilder;
}
