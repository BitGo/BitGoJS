import assert from 'assert';
import { decode } from 'cbor-x';
import * as t from 'io-ts';
import { XShare } from '../ecdsa/types';
import { isLeft } from 'fp-ts/Either';

// Broadcast message meant to be sent to multiple parties
interface BroadcastMessage<T> {
  payload: T;
  from: number;
  signatureR?: T;
}

// P2P message meant to be sent to a specific party
interface P2PMessage<T, G> {
  payload: T;
  from: number;
  commitment?: G;
  to: number;
}

export enum DkgState {
  Uninitialized = 0,
  Round1,
  Round2,
  Round3,
  Round4,
  Complete,
  InvalidState,
}

export enum DsgState {
  Uninitialized = 0,
  Round1,
  Round2,
  Round3,
  Round4,
  Complete,
  InvalidState,
}

export type AuthEncMessage = {
  encryptedMessage: string;
  signature: string;
};
export type AuthMessage = {
  message: string;
  signature: string;
};
export type PartyGpgKey = {
  partyId: number;
  gpgKey: string;
};
export type DklsSignature<T> = {
  R: T;
  S: T;
};
export type RetrofitData = {
  bigSiList: string[];
  xShare: Partial<XShare>;
  xiList?: number[][];
};

export const ReducedKeyShareType = t.type({
  bigSList: t.array(t.array(t.number)),
  xList: t.array(t.array(t.number)),
  rootChainCode: t.array(t.number),
  prv: t.array(t.number),
  pub: t.array(t.number),
});

export type ReducedKeyShare = t.TypeOf<typeof ReducedKeyShareType>;

export type SerializedBroadcastMessage = BroadcastMessage<string>;
export type DeserializedBroadcastMessage = BroadcastMessage<Uint8Array>;
export type SerializedP2PMessage = P2PMessage<string, string>;
export type DeserializedP2PMessage = P2PMessage<Uint8Array, Uint8Array>;
export type SerializedDklsSignature = DklsSignature<string>;
export type DeserializedDklsSignature = DklsSignature<Uint8Array>;
export type AuthEncP2PMessage = P2PMessage<AuthEncMessage, string>;
export type AuthBroadcastMessage = BroadcastMessage<AuthMessage>;
export type SerializedMessages = {
  p2pMessages: SerializedP2PMessage[];
  broadcastMessages: SerializedBroadcastMessage[];
};
export type AuthEncMessages = {
  p2pMessages: AuthEncP2PMessage[];
  broadcastMessages: AuthBroadcastMessage[];
};
export type DeserializedMessages = {
  p2pMessages: DeserializedP2PMessage[];
  broadcastMessages: DeserializedBroadcastMessage[];
};

/**
 * Serializes messages payloads to base64 strings.
 * @param messages
 */
export function serializeMessages(messages: DeserializedMessages): SerializedMessages {
  return {
    p2pMessages: messages.p2pMessages.map(serializeP2PMessage),
    broadcastMessages: messages.broadcastMessages.map(serializeBroadcastMessage),
  };
}

/**
 * Deserialize messages payloads to Uint8Array.
 * @param messages
 */
export function deserializeMessages(messages: SerializedMessages): DeserializedMessages {
  return {
    p2pMessages: messages.p2pMessages.map(deserializeP2PMessage),
    broadcastMessages: messages.broadcastMessages.map(deserializeBroadcastMessage),
  };
}

/**
 * Deserializes a P2P message.
 * @param message
 */
export function deserializeP2PMessage(message: SerializedP2PMessage): DeserializedP2PMessage {
  return {
    to: message.to,
    from: message.from,
    payload: new Uint8Array(Buffer.from(message.payload, 'base64')),
    commitment: message.commitment ? new Uint8Array(Buffer.from(message.commitment, 'hex')) : undefined,
  };
}

/**
 * Deserializes a Broadcast message.
 * @param message
 */
export function deserializeBroadcastMessage(message: SerializedBroadcastMessage): DeserializedBroadcastMessage {
  return {
    from: message.from,
    payload: new Uint8Array(Buffer.from(message.payload, 'base64')),
    signatureR: message.signatureR ? new Uint8Array(Buffer.from(message.signatureR, 'base64')) : undefined,
  };
}

/**
 * Serializes a P2P message.
 * @param message
 */
export function serializeP2PMessage(message: DeserializedP2PMessage): SerializedP2PMessage {
  return {
    to: message.to,
    from: message.from,
    payload: Buffer.from(message.payload).toString('base64'),
    commitment: message.commitment ? Buffer.from(message.commitment).toString('hex') : undefined,
  };
}

/**
 * Serializes a Broadcast message.
 * @param message
 */
export function serializeBroadcastMessage(message: DeserializedBroadcastMessage): SerializedBroadcastMessage {
  return {
    from: message.from,
    payload: Buffer.from(message.payload).toString('base64'),
    signatureR: message.signatureR ? Buffer.from(message.signatureR).toString('base64') : undefined,
  };
}

/**
 * Gets commonkeyChain from DKLS keyShare
 * @param {Buffer} keyShare - DKLS keyShare
 * @returns {string} commonKeychain in hex format
 */
export function getCommonKeychain(keyShare: Buffer): string {
  const parsedKeyShare = decode(keyShare);
  assert(parsedKeyShare.public_key, 'public_key not found in keyShare');
  assert(parsedKeyShare.root_chain_code, 'root_chain_code not found in public_key');
  const publicKey = Buffer.from(parsedKeyShare.public_key).toString('hex');
  const rootChainCode = Buffer.from(parsedKeyShare.root_chain_code).toString('hex');
  return publicKey + rootChainCode;
}

export function getDecodedReducedKeyShare(reducedKeyShare: Buffer | Uint8Array): ReducedKeyShare {
  const decoded = ReducedKeyShareType.decode(decode(reducedKeyShare));
  if (isLeft(decoded)) {
    throw new Error(`Unable to parse reducedKeyShare: ${decoded.left}`);
  }
  return decoded.right;
}
