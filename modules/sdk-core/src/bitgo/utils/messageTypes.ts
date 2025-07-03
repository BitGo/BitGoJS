import { BaseCoin as CoinConfig } from '@bitgo/statics';

/**
 * Supported message signing standard types
 */
export enum MessageStandardType {
  UNKNOWN = 'UNKNOWN',
  EIP191 = 'EIP191',
}

export type MessagePayload = string;
export type MessageMetadata = Record<string, unknown>;

/**
 * Format for broadcasting a signed message
 */
export interface BroadcastableMessage {
  type: MessageStandardType;
  payload: MessagePayload;
  signatures: string[];
  signers: string[]; // list of addresses or public keys of the signers
  metadata?: MessageMetadata;
  signablePayload?: string | Buffer;
}

/**
 * Options to create a message
 */
export interface MessageOptions {
  coinConfig: Readonly<CoinConfig>;
  payload: MessagePayload;
  type?: MessageStandardType;
  signablePayload?: string | Buffer;
  metadata?: MessageMetadata;
  signatures?: string[];
  signers?: string[];
}
