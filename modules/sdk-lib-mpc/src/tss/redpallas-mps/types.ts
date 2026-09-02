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

/**
 * Represents the state of a RedPallas DSG (Distributed Sign Generation) session.
 *
 * Mirrors the EdDSA MPS `DsgState`, except `redpallas_dsg_round0_process` does not take a
 * derivation path: RedPallas key derivation (ask/nk/rivk/ivks) happens separately, upstream,
 * as part of DKG (see `RedPallasDkgState`); the DSG round functions only ever operate on an
 * already-derived (or root) `Keyshare`.
 */
export enum RedPallasDsgState {
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
  /** Final RedPallas signature (signature/rk/alpha) is available via getSignature() */
  Complete = 'Complete',
}

/**
 * The final output of a RedPallas DSG session.
 *
 * - `signature` is the 64-byte raw Schnorr (RedPallas) signature.
 * - `rk` is the randomized verification key that the signature must be verified against
 *   (i.e. `redpallas_verify(rk, signature, message)`), not the original DKG public key.
 * - `alpha` is the 32-byte randomizer scalar used to re-randomize the DKG public key into
 *   `rk` (`rk = pk + [alpha]G`). Callers that need to independently re-derive/verify `rk`
 *   from the DKG public key can use `alpha` to do so.
 */
export interface RedPallasSignatureResult {
  signature: Buffer;
  rk: Buffer;
  alpha: Buffer;
}

/** A PGP detached-signed message by a party.
 * `message` is the raw payload encoded as base64.
 * `signature` is an armored PGP detached signature over those bytes.
 */
export interface MPSSignedMessage {
  message: string;
  signature: string;
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
