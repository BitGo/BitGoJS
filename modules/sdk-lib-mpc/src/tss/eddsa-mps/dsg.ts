import assert from 'assert';
import type { MsgState } from '@bitgo/wasm-mps';
import { DeserializedMessage, DeserializedMessages, DsgState } from './types';

type NodeWasmer = typeof import('@bitgo/wasm-mps');
type WebWasmer = typeof import('@bitgo/wasm-mps/web');
type WasmMps = NodeWasmer | WebWasmer;

/**
 * EdDSA Distributed Sign Generation (DSG) implementation using @bitgo/wasm-mps.
 *
 * State is explicit: each WASM round function returns
 * `{ msg, state }` bytes; the state bytes are stored between rounds and passed to the
 * next round function (this is what a server would persist to a database between API
 * rounds).
 *
 * The protocol is hard-coded 2-of-3: each signing party communicates with exactly one
 * counterpart. `handleIncomingMessages` accepts both messages (own + counterpart), and
 * filters own out internally.
 *
 * @example
 * ```typescript
 * const dsg = new DSG(0);  // partyIdx 0
 * await dsg.initDsg(keyShare, message, 'm', 2);  // counterpart is party 2
 * const msg1 = dsg.getFirstMessage();
 * const msg2 = dsg.handleIncomingMessages([msg1, peerMsg1]);  // emits SignMsg2
 * const msg3 = dsg.handleIncomingMessages([msg2[0], peerMsg2]);  // emits SignMsg3
 * dsg.handleIncomingMessages([msg3[0], peerMsg3]);  // completes DSG
 * const signature = dsg.getSignature();  // 64-byte Ed25519 signature
 * ```
 */
export class DSG {
  protected partyIdx: number;
  protected otherPartyIdx: number | null = null;

  /** Opaque bincode-serialised Keyshare from a prior DKG */
  private keyShare: Buffer | null = null;
  /** Raw message bytes to sign (Ed25519 hashes internally; no prehashing required) */
  private message: Buffer | null = null;
  /** BIP-32-style derivation path, e.g. "m" or "m/0/1". Folded in via Keyshare::derive_with_offset */
  private derivationPath: string | null = null;

  /** Serialised round state bytes returned by the previous round function */
  private dsgStateBytes: Buffer | null = null;
  /** Final 64-byte Ed25519 signature, available after WaitMsg3 -> Complete */
  private signature: Buffer | null = null;
  /** Lazily loaded WASM module */
  private wasmMps: WasmMps | null = null;

  protected dsgState: DsgState = DsgState.Uninitialized;

  constructor(partyIdx: number) {
    this.partyIdx = partyIdx;
  }

  getState(): DsgState {
    return this.dsgState;
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
   * Initialises the DSG session. The keyshare must come from a prior DKG run, and
   * `otherPartyIdx` must be the single counterpart who will co-sign with this party.
   *
   * @param keyShare - Opaque bincode-serialised Keyshare bytes from `DKG.getKeyShare()`.
   * @param message - Raw message bytes to sign (no prehashing).
   * @param derivationPath - BIP-32-style derivation path. Use `"m"` for the root key.
   * @param otherPartyIdx - Party index of the single counterpart in this signing session.
   *   Must differ from this party's own `partyIdx` and be in `[0, 2]`.
   */
  async initDsg(keyShare: Buffer, message: Buffer, derivationPath: string, otherPartyIdx: number): Promise<void> {
    await this.loadWasmMps();
    if (!keyShare || keyShare.length === 0) {
      throw Error('Missing or invalid keyShare');
    }
    if (!message || message.length === 0) {
      throw Error('Missing or invalid message');
    }
    if (this.partyIdx < 0 || this.partyIdx > 2) {
      throw Error(`Invalid partyIdx ${this.partyIdx}: must be in [0, 2]`);
    }
    if (otherPartyIdx < 0 || otherPartyIdx > 2 || otherPartyIdx === this.partyIdx) {
      throw Error(`Invalid otherPartyIdx ${otherPartyIdx}: must be in [0, 2] and != partyIdx`);
    }

    this.keyShare = keyShare;
    this.message = message;
    this.derivationPath = derivationPath;
    this.otherPartyIdx = otherPartyIdx;
    this.dsgState = DsgState.Init;
  }

  /**
   * Runs round 0 of the DSG protocol. Returns this party's broadcast message
   * (a `SignMsg1` containing the commitment to `R_i`). Stores the round state
   * bytes internally for the next round.
   */
  getFirstMessage(): DeserializedMessage {
    if (this.dsgState !== DsgState.Init) {
      throw Error('DSG session not initialized');
    }
    assert(this.keyShare, 'keyShare must be set after initDsg');
    assert(this.derivationPath !== null, 'derivationPath must be set after initDsg');
    assert(this.message, 'message must be set after initDsg');

    const wasm = this.getWasmMps();
    let result: MsgState;
    try {
      result = wasm.ed25519_dsg_round0_process(this.keyShare, this.derivationPath, this.message);
    } catch (err) {
      throw new Error(`Error while creating the first message from party ${this.partyIdx}: ${err}`);
    }

    this.dsgStateBytes = Buffer.from(result.state);
    this.dsgState = DsgState.WaitMsg1;
    return { payload: new Uint8Array(result.msg), from: this.partyIdx };
  }

  /**
   * Handles incoming messages for the current round and advances the protocol.
   *
   * - In `WaitMsg1`: runs round 1, returns this party's `SignMsg2` broadcast.
   * - In `WaitMsg2`: runs round 2 (which internally fuses two Silence Labs transitions),
   *   returns this party's `SignMsg3` broadcast (partial signature).
   * - In `WaitMsg3`: runs round 3, completes DSG, returns `[]`.
   *
   * The caller passes both messages (own + counterpart) for symmetry with
   * `DKG.handleIncomingMessages`. Own message is filtered out internally; only the
   * counterpart's payload is forwarded to the WASM round function.
   *
   * @param messagesForIthRound - Both messages for this round (own + counterpart).
   */
  handleIncomingMessages(messagesForIthRound: DeserializedMessages): DeserializedMessages {
    if (this.dsgState === DsgState.Complete) {
      throw Error('DSG session already completed');
    }
    if (this.dsgState === DsgState.Uninitialized) {
      throw Error('DSG session not initialized');
    }
    if (this.dsgState === DsgState.Init) {
      throw Error(
        'DSG session must call getFirstMessage() before handling incoming messages. Call getFirstMessage() first.'
      );
    }
    if (messagesForIthRound.length !== 2) {
      throw Error('Invalid number of messages for the round. Expected 2 messages (own + counterpart) for 2-of-3 DSG');
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

    if (this.dsgState === DsgState.WaitMsg1) {
      assert(this.dsgStateBytes, 'dsgStateBytes must be set in WaitMsg1');
      let result: MsgState;
      try {
        result = wasm.ed25519_dsg_round1_process(peerPayload, this.dsgStateBytes);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dsgState}: ${err}`);
      }
      this.dsgStateBytes = Buffer.from(result.state);
      this.dsgState = DsgState.WaitMsg2;
      return [{ payload: new Uint8Array(result.msg), from: this.partyIdx }];
    }

    if (this.dsgState === DsgState.WaitMsg2) {
      assert(this.dsgStateBytes, 'dsgStateBytes must be set in WaitMsg2');
      let result: MsgState;
      try {
        result = wasm.ed25519_dsg_round2_process(peerPayload, this.dsgStateBytes);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dsgState}: ${err}`);
      }
      this.dsgStateBytes = Buffer.from(result.state);
      this.dsgState = DsgState.WaitMsg3;
      return [{ payload: new Uint8Array(result.msg), from: this.partyIdx }];
    }

    if (this.dsgState === DsgState.WaitMsg3) {
      assert(this.dsgStateBytes, 'dsgStateBytes must be set in WaitMsg3');
      let sigBytes;
      try {
        sigBytes = wasm.ed25519_dsg_round3_process(peerPayload, this.dsgStateBytes);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dsgState}: ${err}`);
      }
      this.signature = Buffer.from(sigBytes);
      this.dsgStateBytes = null;
      this.dsgState = DsgState.Complete;
      return [];
    }

    throw Error('Unexpected DSG state');
  }

  /**
   * Returns the final 64-byte Ed25519 signature produced by round 3.
   * Only available once the protocol reaches `Complete`.
   */
  getSignature(): Buffer {
    if (!this.signature) {
      throw Error('DSG session has not produced a signature yet');
    }
    return this.signature;
  }

  /**
   * Exports the current session state as a JSON string for persistence.
   * Includes the opaque round state bytes plus everything needed to re-enter the
   * protocol after a restart (keyshare, message, derivation path, counterpart).
   */
  getSession(): string {
    if (this.dsgState === DsgState.Complete) {
      throw Error('DSG session is complete. Exporting the session is not allowed.');
    }
    if (this.dsgState === DsgState.Uninitialized) {
      throw Error('DSG session not initialized');
    }
    if (this.dsgState === DsgState.Init) {
      throw Error('DSG session must produce its first message before exporting.');
    }
    return JSON.stringify({
      dsgStateBytes: this.dsgStateBytes?.toString('base64') ?? null,
      dsgRound: this.dsgState,
      keyShare: this.keyShare?.toString('base64') ?? null,
      message: this.message?.toString('base64') ?? null,
      derivationPath: this.derivationPath,
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
    if (!Object.values(DsgState).includes(data.dsgRound)) {
      throw Error(`Invalid dsgRound in session: ${data.dsgRound}`);
    }
    if (data.dsgRound === DsgState.Uninitialized || data.dsgRound === DsgState.Init) {
      throw Error(`Cannot restore DSG session in state ${data.dsgRound}`);
    }
    if (data.dsgRound === DsgState.Complete) {
      throw Error('DSG session is complete. Restoring the session is not allowed.');
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
    if (typeof data.dsgStateBytes !== 'string' || data.dsgStateBytes.length === 0) {
      throw Error(`Round ${data.dsgRound} requires dsgStateBytes`);
    }
    if (typeof data.keyShare !== 'string' || data.keyShare.length === 0) {
      throw Error('Restored session missing keyShare');
    }
    if (typeof data.message !== 'string' || data.message.length === 0) {
      throw Error('Restored session missing message');
    }
    if (typeof data.derivationPath !== 'string') {
      throw Error('Restored session missing derivationPath');
    }

    const dsgStateBytes = Buffer.from(data.dsgStateBytes, 'base64');
    const keyShare = Buffer.from(data.keyShare, 'base64');
    const message = Buffer.from(data.message, 'base64');
    if (dsgStateBytes.length === 0) {
      throw Error(`Round ${data.dsgRound} requires dsgStateBytes`);
    }
    if (keyShare.length === 0) {
      throw Error('Restored session missing keyShare');
    }
    if (message.length === 0) {
      throw Error('Restored session missing message');
    }

    this.dsgStateBytes = dsgStateBytes;
    this.dsgState = data.dsgRound;
    this.keyShare = keyShare;
    this.message = message;
    this.derivationPath = data.derivationPath;
    this.partyIdx = data.partyIdx;
    this.otherPartyIdx = data.otherPartyIdx;
  }
}
