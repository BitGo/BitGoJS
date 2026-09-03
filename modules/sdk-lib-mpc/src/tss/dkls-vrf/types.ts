/**
 * States of the VRF DKG state machine: a two-round, commit-then-open distributed
 * key generation. Kept separate from `ecdsa-dkls`'s `DkgState` because the round
 * counts differ (2 vs 4).
 *
 * The wasm session bytes embed a round tag (`Init` / `WaitMsg1` / `WaitMsg2` /
 * `{Share: …}`); `VrfDkg` re-derives this state from the bytes rather than
 * trusting a caller-supplied value.
 */
export enum VrfDkgState {
  Uninitialized = 0,
  /** Commitment created and broadcast; waiting for the other parties' VrfKeygenMsg1. */
  Round1,
  /** Openings created and broadcast; waiting for the other parties' VrfKeygenMsg2. */
  Round2,
  Complete,
  InvalidState,
}

export interface VrfDkgSessionData {
  /**
   * Serialized wasm session. Secret key material — it carries the party's
   * secret polynomial share. Never log it or persist it in the clear.
   */
  vrfSessionBytes: Uint8Array;
  vrfState: VrfDkgState;
  keyShareBuff?: Buffer;
}
