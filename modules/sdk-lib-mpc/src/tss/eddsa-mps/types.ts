import { decode } from 'cbor-x';
import { isLeft } from 'fp-ts/Either';
import * as t from 'io-ts';

export const ReducedKeyShareType = t.type({
  pub: t.array(t.number),
});

export type EddsaReducedKeyShare = t.TypeOf<typeof ReducedKeyShareType>;

/**
 * Represents the state of a DKG (Distributed Key Generation) session
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
 * Represents the state of a DSG (Distributed Sign Generation) session.
 */
export enum DsgState {
  /** DSG session has not been initialized */
  Uninitialized = 'Uninitialized',
  /** initDsg() has been called; ready for getFirstMessage() */
  Init = 'Init',
  /** R0 broadcast emitted; waiting for counterpart's R0 broadcast (SignMsg1) */
  WaitMsg1 = 'WaitMsg1',
  /** R1 broadcast emitted; waiting for counterpart's R1 broadcast (SignMsg2) */
  WaitMsg2 = 'WaitMsg2',
  /** R2 broadcast emitted; waiting for counterpart's R2 broadcast (SignMsg3, the partial sig) */
  WaitMsg3 = 'WaitMsg3',
  /** Final 64-byte Ed25519 signature is available via getSignature() */
  Complete = 'Complete',
}

export interface Message<T> {
  payload: T;
  from: number;
}

export type SerializedMessage = Message<string>;

export type SerializedMessages = Message<string>[];

export type DeserializedMessage = Message<Uint8Array>;

export type DeserializedMessages = Message<Uint8Array>[];

export function serializeMessage(msg: DeserializedMessage): SerializedMessage {
  return { from: msg.from, payload: Buffer.from(msg.payload).toString('base64') };
}

export function deserializeMessage(msg: SerializedMessage): DeserializedMessage {
  return { from: msg.from, payload: Buffer.from(msg.payload, 'base64') };
}

export function serializeMessages(msgs: DeserializedMessages): SerializedMessages {
  return msgs.map(serializeMessage);
}

export function deserializeMessages(msgs: SerializedMessages): DeserializedMessages {
  return msgs.map(deserializeMessage);
}

/** A PGP detached-signed message by a party.
 * `message` is the raw payload encoded as base64.
 * `signature` is an armored PGP detached signature over those bytes.
 */
export interface MPSSignedMessage {
  message: string;
  signature: string;
}

export function getDecodedReducedKeyShare(reducedKeyShare: Buffer | Uint8Array): EddsaReducedKeyShare {
  const decoded = ReducedKeyShareType.decode(decode(reducedKeyShare));
  if (isLeft(decoded)) {
    throw new Error(`Unable to parse reducedKeyShare: ${decoded.left}`);
  }
  return decoded.right;
}
