import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { SerializedSignature, Signature } from '../iface';

/**
 * Supported message signing standard types
 */
export enum MessageStandardType {
  UNKNOWN = 'UNKNOWN',
  SIMPLE = 'SIMPLE',
  EIP191 = 'EIP191',
  CIP8 = 'CIP8',
}

export type MessagePayload = string;
export type MessageMetadata = Record<string, unknown>;

/**
 * Format for broadcasting a signed message
 */
export interface BroadcastableMessage {
  type: MessageStandardType;
  payload: MessagePayload;
  signablePayload?: string;
  serializedSignatures?: SerializedSignature[];
  signers?: string[]; // list of addresses or public keys of the signers
  metadata?: MessageMetadata;
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
  signatures?: Signature[];
  signers?: string[];
}
