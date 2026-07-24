import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { SerializedSignature, Signature } from '../../account-lib';

/**
 * Supported message signing standard types
 */
export enum MessageStandardType {
  UNKNOWN = 'UNKNOWN',
  SIMPLE = 'SIMPLE',
  EIP191 = 'EIP191',
  EIP712 = 'EIP712',
  CIP8 = 'CIP8',
  CANTON_SIGN_TRANSACTION = 'CANTON_SIGN_TRANSACTION',
  CANTON_SIGN_TOPOLOGY = 'CANTON_SIGN_TOPOLOGY',
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
