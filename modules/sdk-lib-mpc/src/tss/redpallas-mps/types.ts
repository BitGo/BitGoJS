import { decode } from 'cbor-x';
import { isLeft } from 'fp-ts/Either';
import * as t from 'io-ts';

export const RedPallasReducedKeyShareType = t.type({
  keyShare: t.array(t.number),
  pub: t.array(t.number),
});

export type RedPallasReducedKeyShare = t.TypeOf<typeof RedPallasReducedKeyShareType>;

/**
 * Represents the state of a RedPallas DKG (Distributed Key Generation) session.
 *
 * Unlike the EdDSA MPS `DkgState`, there is no `Share` state: `redpallas_dkg_round2_process`
 * returns a `MsgDerivationInit` (msg/pk/share/state) directly, completing the DKG session in
 * one step. Key derivation (ask/nk/rivk/ivks) is a separate, subsequent, platform-side-only
 * process (`redpallas_derivation_process`) not modelled here.
 */
export enum RedPallasDkgState {
  /** DKG session has not been initialized */
  Uninitialized = 'Uninitialized',
  /** DKG session has been initialized (Init state in WASM) */
  Init = 'Init',
  /** DKG session is waiting for first message (WaitMsg1 state in WASM) */
  WaitMsg1 = 'WaitMsg1',
  /** DKG session is waiting for second message (WaitMsg2 state in WASM) */
  WaitMsg2 = 'WaitMsg2',
  /** DKG session has completed successfully and key shares are available */
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

export function getDecodedReducedKeyShare(reducedKeyShare: Buffer | Uint8Array): RedPallasReducedKeyShare {
  const decoded = RedPallasReducedKeyShareType.decode(decode(reducedKeyShare));
  if (isLeft(decoded)) {
    throw new Error(`Unable to parse reducedKeyShare: ${decoded.left}`);
  }
  return decoded.right;
}
