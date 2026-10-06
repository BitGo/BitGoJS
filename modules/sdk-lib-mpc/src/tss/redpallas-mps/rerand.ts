import assert from 'assert';
import type { MsgState, RedPallasRerandShare } from '@bitgo/wasm-mps';
import { DeserializedMessage, DeserializedMessages, RedPallasRerandResult, RedPallasRerandState } from './types';

type NodeWasmer = typeof import('@bitgo/wasm-mps');
type WebWasmer = typeof import('@bitgo/wasm-mps/web');
type WasmMps = NodeWasmer | WebWasmer;

/**
 * RedPallas (Zcash Ironwood) key re-randomization implementation using @bitgo/wasm-mps.
 *
 * As of `@bitgo/wasm-mps` 1.17.0, key re-randomization has moved out of DSG and into
 * this separate `rerand` protocol: DSG no longer randomizes the key it signs with.
 * A rerand session MUST run before every RedPallas DSG, between the same 2 parties
 * that will then sign:
 *
 * - Round 0 (local): each party commits to a fresh random randomizer.
 * - Round 1 (commit): each party broadcasts its commitment.
 * - Round 2 (open): each party broadcasts its randomizer and blind, bound to the
 *   session id. Both parties then locally verify the openings and apply the same
 *   tweak `alpha = hash(Σ randomizers)`: `d_i += alpha`, `pk += G·alpha`.
 *
 * The output `RedPallasRerandShare` is a rerandomized keyshare (`share`), the
 * rerandomized public key (`pk`) and the tweak scalar (`alpha`). `share` is what
 * goes into `RedPallasDSG.initDsg`; the resulting DSG signature verifies under
 * `rk == pk`, and `alpha` is only available here — not from the DSG result.
 *
 * Signing a stored DKG keyshare directly (without rerand) still yields a valid
 * signature, but under the bare DKG public key with the same `rk` every time; the
 * rerand → DSG sequence is the supported path.
 *
 * Mirrors the structure of `RedPallasDSG` (see `./dsg.ts`): lazy web/node WASM
 * loading, explicit round state bytes persisted between rounds, hard-coded 2-of-3
 * with a single counterpart, and the same 2-message `handleIncomingMessages`
 * contract (own + counterpart; own is filtered out internally).
 *
 * @example
 * ```typescript
 * const rerand = new RedPallasRerand(0);  // partyIdx 0
 * await rerand.initRerand(keyShare, 2);  // counterpart is party 2
 * const msg1 = rerand.getFirstMessage();
 * const msg2 = rerand.handleIncomingMessages([msg1, peerMsg1]);  // emits rerand msg2
 * rerand.handleIncomingMessages([msg2[0], peerMsg2]);  // completes rerand
 * const { keyShare, pk, alpha } = rerand.getRerandomizedKeyShare();
 * const dsg = new RedPallasDSG(0);
 * await dsg.initDsg(keyShare, message, 2);  // DSG verifies under rk == pk
 * ```
 */
export class RedPallasRerand {
  protected partyIdx: number;
  protected otherPartyIdx: number | null = null;

  /** Opaque bincode-serialised Keyshare from a prior DKG (already derived, if applicable) */
  private keyShare: Buffer | null = null;

  /** Serialised round state bytes returned by the previous round function */
  private rerandStateBytes: Buffer | null = null;
  /** Final rerandomized share bundle, available after WaitMsg2 -> Complete */
  private rerandResult: RedPallasRerandResult | null = null;
  /** Lazily loaded WASM module */
  private wasmMps: WasmMps | null = null;

  protected rerandState: RedPallasRerandState = RedPallasRerandState.Uninitialized;

  constructor(partyIdx: number) {
    this.partyIdx = partyIdx;
  }

  getState(): RedPallasRerandState {
    return this.rerandState;
  }

  getPartyIdx(): number {
    return this.partyIdx;
  }

  getOtherPartyIdx(): number | null {
    return this.otherPartyIdx;
  }

  private async loadWasmMps(): Promise<void> {
    if (!this.wasmMps) {
      if (
        typeof window !== 'undefined' &&
        /* checks for electron processes */
        !window.process &&
        !window.process?.['type']
      ) {
        // Browser: web build has explicit init() — guaranteed ready after await
        // eslint-disable-next-line import/no-internal-modules -- @bitgo/wasm-mps exposes environment-specific subpath exports.
        const webWasm = await import('@bitgo/wasm-mps/web');
        await webWasm.default();
        this.wasmMps = webWasm;
      } else {
        // Node.js: dynamic import() rewritten to require() by tsc → CJS build → readFileSync
        this.wasmMps = await import('@bitgo/wasm-mps');
      }
    }
  }

  private getWasmMps(): WasmMps {
    if (!this.wasmMps) {
      throw Error('WASM module not loaded');
    }
    return this.wasmMps;
  }

  /**
   * Initialises the rerand session. The keyshare must come from a prior DKG run (and,
   * if a derived key is being used, from the subsequent platform-side derivation
   * process), and `otherPartyIdx` must be the single counterpart who will then co-sign
   * (via DSG) with this party. Rerand and DSG must use the same 2 parties.
   *
   * @param keyShare - Opaque bincode-serialised Keyshare bytes from `RedPallasDKG.getKeyShare()`.
   * @param otherPartyIdx - Party index of the single counterpart in this rerand session.
   *   Must differ from this party's own `partyIdx` and be in `[0, 2]`.
   */
  async initRerand(keyShare: Buffer, otherPartyIdx: number): Promise<void> {
    await this.loadWasmMps();
    if (!keyShare || keyShare.length === 0) {
      throw Error('Missing or invalid keyShare');
    }
    if (this.partyIdx < 0 || this.partyIdx > 2) {
      throw Error(`Invalid partyIdx ${this.partyIdx}: must be in [0, 2]`);
    }
    if (otherPartyIdx < 0 || otherPartyIdx > 2 || otherPartyIdx === this.partyIdx) {
      throw Error(`Invalid otherPartyIdx ${otherPartyIdx}: must be in [0, 2] and != partyIdx`);
    }

    this.keyShare = keyShare;
    this.otherPartyIdx = otherPartyIdx;
    this.rerandState = RedPallasRerandState.Init;
  }

  /**
   * Runs round 0 of the rerand protocol (local). Returns this party's broadcast
   * message (a commitment to a fresh random randomizer). Stores the round state
   * bytes internally for the next round.
   */
  getFirstMessage(): DeserializedMessage {
    if (this.rerandState !== RedPallasRerandState.Init) {
      throw Error('Rerand session not initialized');
    }
    assert(this.keyShare, 'keyShare must be set after initRerand');

    const wasm = this.getWasmMps();
    let result: MsgState;
    try {
      result = wasm.redpallas_rerand_round0_process(this.keyShare);
    } catch (err) {
      throw new Error(`Error while creating the first message from party ${this.partyIdx}: ${err}`);
    }

    this.rerandStateBytes = Buffer.from(result.state);
    this.rerandState = RedPallasRerandState.WaitMsg1;
    return { payload: new Uint8Array(result.msg), from: this.partyIdx };
  }

  /**
   * Handles incoming messages for the current round and advances the protocol.
   *
   * - In `WaitMsg1`: runs round 1 (commit), returns this party's round 2 broadcast
   *   (its randomizer and blind).
   * - In `WaitMsg2`: runs round 2 (open + local tweak), completes rerand, returns `[]`.
   *
   * The caller passes both messages (own + counterpart) for symmetry with
   * `RedPallasDSG.handleIncomingMessages`. Own message is filtered out internally;
   * only the counterpart's payload is forwarded to the WASM round function.
   *
   * @param messagesForIthRound - Both messages for this round (own + counterpart).
   */
  handleIncomingMessages(messagesForIthRound: DeserializedMessages): DeserializedMessages {
    if (this.rerandState === RedPallasRerandState.Complete) {
      throw Error('Rerand session already completed');
    }
    if (this.rerandState === RedPallasRerandState.Uninitialized) {
      throw Error('Rerand session not initialized');
    }
    if (this.rerandState === RedPallasRerandState.Init) {
      throw Error(
        'Rerand session must call getFirstMessage() before handling incoming messages. Call getFirstMessage() first.'
      );
    }
    if (messagesForIthRound.length !== 2) {
      throw Error(
        'Invalid number of messages for the round. Expected 2 messages (own + counterpart) for 2-of-3 rerand'
      );
    }

    const peerMessages = messagesForIthRound.filter((m) => m.from !== this.partyIdx);
    if (peerMessages.length !== 1) {
      throw Error(`Expected exactly 1 counterpart message; got ${peerMessages.length}`);
    }
    const peerMsg = peerMessages[0];
    if (peerMsg.from !== this.otherPartyIdx) {
      throw Error(`Unexpected counterpart party index: got ${peerMsg.from}, expected ${this.otherPartyIdx}`);
    }
    const peerPayload = Buffer.from(peerMsg.payload);
    const wasm = this.getWasmMps();

    if (this.rerandState === RedPallasRerandState.WaitMsg1) {
      assert(this.rerandStateBytes, 'rerandStateBytes must be set in WaitMsg1');
      let result: MsgState;
      try {
        result = wasm.redpallas_rerand_round1_process(peerPayload, this.rerandStateBytes);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.rerandState}: ${err}`);
      }
      this.rerandStateBytes = Buffer.from(result.state);
      this.rerandState = RedPallasRerandState.WaitMsg2;
      return [{ payload: new Uint8Array(result.msg), from: this.partyIdx }];
    }

    if (this.rerandState === RedPallasRerandState.WaitMsg2) {
      assert(this.rerandStateBytes, 'rerandStateBytes must be set in WaitMsg2');
      let result: RedPallasRerandShare;
      try {
        result = wasm.redpallas_rerand_round2_process(peerPayload, this.rerandStateBytes);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.rerandState}: ${err}`);
      }
      this.rerandResult = {
        keyShare: Buffer.from(result.share),
        pk: Buffer.from(result.pk),
        alpha: Buffer.from(result.alpha),
      };
      this.rerandStateBytes = null;
      this.rerandState = RedPallasRerandState.Complete;
      return [];
    }

    throw Error('Unexpected rerand state');
  }

  /**
   * Returns the rerandomized share bundle produced by round 2: the rerandomized
   * keyshare `keyShare` (to be passed to `RedPallasDSG.initDsg`), the rerandomized
   * public key `pk` (the DSG result's `rk` equals it), and the 32-byte tweak scalar
   * `alpha` (fresh per rerand session, identical on both parties).
   */
  getRerandomizedKeyShare(): RedPallasRerandResult {
    if (!this.rerandResult) {
      throw Error('Rerand session has not produced a rerandomized key share yet');
    }
    return this.rerandResult;
  }

  /**
   * Exports the current session state as a JSON string for persistence.
   * Includes the opaque round state bytes plus everything needed to re-enter the
   * protocol after a restart (keyshare, counterpart).
   */
  getSession(): string {
    if (this.rerandState === RedPallasRerandState.Complete) {
      throw Error('Rerand session is complete. Exporting the session is not allowed.');
    }
    if (this.rerandState === RedPallasRerandState.Uninitialized) {
      throw Error('Rerand session not initialized');
    }
    if (this.rerandState === RedPallasRerandState.Init) {
      throw Error('Rerand session must produce its first message before exporting.');
    }
    return JSON.stringify({
      rerandStateBytes: this.rerandStateBytes?.toString('base64') ?? null,
      rerandRound: this.rerandState,
      keyShare: this.keyShare?.toString('base64') ?? null,
      partyIdx: this.partyIdx,
      otherPartyIdx: this.otherPartyIdx,
    });
  }

  /**
   * Restores a previously exported session. Allows the protocol to continue from
   * where it left off, as if the round state was loaded from a database.
   */
  async restoreSession(session: string): Promise<void> {
    await this.loadWasmMps();
    const data = JSON.parse(session);
    if (!Object.values(RedPallasRerandState).includes(data.rerandRound)) {
      throw Error(`Invalid rerandRound in session: ${data.rerandRound}`);
    }
    if (data.rerandRound === RedPallasRerandState.Uninitialized || data.rerandRound === RedPallasRerandState.Init) {
      throw Error(`Cannot restore rerand session in state ${data.rerandRound}`);
    }
    if (data.rerandRound === RedPallasRerandState.Complete) {
      throw Error('Rerand session is complete. Restoring the session is not allowed.');
    }
    if (typeof data.partyIdx !== 'number' || data.partyIdx < 0 || data.partyIdx > 2) {
      throw Error(`Invalid partyIdx in session: ${data.partyIdx}`);
    }
    if (
      typeof data.otherPartyIdx !== 'number' ||
      data.otherPartyIdx < 0 ||
      data.otherPartyIdx > 2 ||
      data.otherPartyIdx === data.partyIdx
    ) {
      throw Error(`Invalid otherPartyIdx in session: ${data.otherPartyIdx}`);
    }
    if (this.partyIdx !== data.partyIdx) {
      throw Error(`Session partyIdx ${data.partyIdx} does not match instance ${this.partyIdx}`);
    }
    if (typeof data.rerandStateBytes !== 'string' || data.rerandStateBytes.length === 0) {
      throw Error(`Round ${data.rerandRound} requires rerandStateBytes`);
    }
    if (typeof data.keyShare !== 'string' || data.keyShare.length === 0) {
      throw Error('Restored session missing keyShare');
    }

    const rerandStateBytes = Buffer.from(data.rerandStateBytes, 'base64');
    const keyShare = Buffer.from(data.keyShare, 'base64');
    if (rerandStateBytes.length === 0) {
      throw Error(`Round ${data.rerandRound} requires rerandStateBytes`);
    }
    if (keyShare.length === 0) {
      throw Error('Restored session missing keyShare');
    }

    this.rerandStateBytes = rerandStateBytes;
    this.rerandState = data.rerandRound;
    this.keyShare = keyShare;
    this.partyIdx = data.partyIdx;
    this.otherPartyIdx = data.otherPartyIdx;
  }
}
