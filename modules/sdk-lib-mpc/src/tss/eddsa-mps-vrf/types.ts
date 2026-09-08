import { Buffer } from 'buffer';
import { isLeft } from 'fp-ts/Either';
import * as t from 'io-ts';

/**
 * States of the VRF DKG state machine. Kept separate from `eddsa-mps`'s signing
 * `DkgState` because the round counts differ. MPS wasm state bytes have no round
 * tag, so the round is tracked here and carried in `VrfDkgSessionData`.
 */
export enum VrfDkgState {
  Uninitialized = 0,
  /** Commitment created and broadcast; waiting for the other parties' VrfKeygenMsg1. */
  Round1,
  /** Openings created; waiting for the VrfKeygenMsg2 entries addressed to this party. */
  Round2,
  Complete,
  InvalidState,
}

export interface VrfDkgSessionData {
  /**
   * Serialized wasm round state. Secret key material — it carries this party's
   * secret VRF share. Never log it or persist it in the clear.
   */
  vrfStateBytes?: Uint8Array;
  vrfState: VrfDkgState;
  keyShareBuff?: Buffer;
}

const Uint8ArrayCodec = new t.Type<Uint8Array, Uint8Array, unknown>(
  'Uint8Array',
  (u): u is Uint8Array => u instanceof Uint8Array,
  (u, c) => (u instanceof Uint8Array ? t.success(u) : t.failure(u, c)),
  t.identity
);

const BufferCodec = new t.Type<Buffer, Buffer, unknown>(
  'Buffer',
  (u): u is Buffer => Buffer.isBuffer(u),
  (u, c) => (Buffer.isBuffer(u) ? t.success(u) : t.failure(u, c)),
  t.identity
);

const VrfDkgRound1MsgMap = t.record(t.string, Uint8ArrayCodec);

const RestorableVrfDkgState = t.union([
  t.literal(VrfDkgState.Round1),
  t.literal(VrfDkgState.Round2),
  t.literal(VrfDkgState.Complete),
]);

const VrfDkgSessionDataCodec = t.intersection([
  t.type({ vrfState: RestorableVrfDkgState }),
  t.partial({
    vrfStateBytes: Uint8ArrayCodec,
    keyShareBuff: BufferCodec,
  }),
]);

/** Decode a wasm round-1 map key as a party index. */
export function decodePartyId(recipient: string): number {
  const to = Number.parseInt(recipient, 10);
  if (!Number.isInteger(to) || to < 0 || String(to) !== recipient) {
    throw new Error(`VRF DKG round-1 recipient is not a party id: ${recipient}`);
  }
  return to;
}

/** Decode the wasm round-1 recipient → bytes map. */
export function decodeVrfRound1MsgMap(msg: unknown): Record<string, Uint8Array> {
  const decoded = VrfDkgRound1MsgMap.decode(msg);
  if (isLeft(decoded)) {
    throw new Error('VRF DKG round-1 message is not a party-id map of byte arrays');
  }
  return decoded.right;
}

/** Decode persisted VRF DKG session data. */
export function decodeVrfDkgSessionData(sessionData: unknown): VrfDkgSessionData {
  const decoded = VrfDkgSessionDataCodec.decode(sessionData);
  if (isLeft(decoded)) {
    throw new Error('Invalid VRF DKG session data');
  }
  return decoded.right;
}
