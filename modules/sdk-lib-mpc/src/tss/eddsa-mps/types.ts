import assert from 'assert';
import { decode } from 'cbor-x';
import * as t from 'io-ts';
import * as DklsTypes from '../ecdsa-dkls/types';

export const ReducedKeyShareType = t.type({
  rootChainCode: t.array(t.number),
  prv: t.array(t.number),
  pub: t.array(t.number),
});

export type EddsaReducedKeyShare = t.TypeOf<typeof ReducedKeyShareType>;

export interface KeyShareReadable {
  threshold: number;
  total_parties: number;
  party_id: number;
  d_i: string;
  public_key: string;
  key_id: string;
  root_chain_code: string;
  final_session_id: string;
}

type NodeWasmer = typeof import('@silencelaboratories/eddsa-wasm-ll-node');
type WebWasmer = typeof import('@silencelaboratories/eddsa-wasm-ll-web');
export type BundlerWasmer = typeof import('@silencelaboratories/eddsa-wasm-ll-bundler');

export type EddsaMPSWasm = NodeWasmer | WebWasmer | BundlerWasmer;

/**
 * Represents the state of a DKG (Distributed Key Generation) session
 * These states correspond to the internal WASM library states
 */
export enum DkgState {
  /** DKG session has not been initialized */
  Uninitialized = 'Uninitialized',
  /** DKG session has been initialized (Init state in WASM) */
  Init = 'Init',
  /** DKG session is waiting for first message (WaitMsg1 state in WASM) */
  WaitMsg1 = 'WaitMsg1',
  /** DKG session is waiting for second message (WaitMsg2 state in WASM) */
  WaitMsg2 = 'WaitMsg2',
  /** DKG session has generated key shares (Share state in WASM) */
  Share = 'Share',
  /** DKG session has completed successfully and key shares are available */
  Complete = 'Complete',
}

/**
 * Represents the state of a DSG (Distributed Signature Generation) session
 * These states correspond to the internal WASM library states
 */
export enum DsgState {
  /** DSG session has not been initialized */
  Uninitialized = 'Uninitialized',
  /** DSG session has been initialized (Init state in WASM) */
  Init = 'Init',
  /** DSG session is waiting for first message (WaitMsg1 state in WASM) */
  WaitMsg1 = 'WaitMsg1',
  /** DSG session is waiting for second message (WaitMsg2 state in WASM) */
  WaitMsg2 = 'WaitMsg2',
  /** DSG session has partial signature and is waiting for messages (Partial state in WASM) */
  Partial = 'Partial',
  /** DSG session has finished (Finished state in WASM) */
  Finished = 'Finished',
  /** DSG session has been ended/cleaned up */
  Ended = 'Ended',
}

export interface Message<T> {
  payload: T;
  from: number;
}

export type AuthEncMessages = Message<DklsTypes.AuthMessage>[];

export type SerializedMessage = Message<string>;

export type SerializedMessages = Message<string>[];

export type DeserializedMessage = Message<Uint8Array>;

export type DeserializedMessages = Message<Uint8Array>[];

/**
 * Serializes messages payloads to base64 strings.
 * @param messages
 */
export function serializeMessages(messages: DeserializedMessages): SerializedMessages {
  return messages.map((message) => ({
    from: message.from,
    payload: Buffer.from(message.payload).toString('base64'),
  }));
}

/**
 * Deserialize messages payloads to Uint8Array.
 * @param messages
 */
export function deserializeMessages(messages: SerializedMessages): DeserializedMessages {
  return messages.map((message) => ({
    from: message.from,
    payload: new Uint8Array(Buffer.from(message.payload, 'base64')),
  }));
}

/**
 * Deserializes a Broadcast message.
 * @param message
 */
export function deserializeMessage(message: SerializedMessage): DeserializedMessage {
  return {
    from: message.from,
    payload: new Uint8Array(Buffer.from(message.payload, 'base64')),
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
