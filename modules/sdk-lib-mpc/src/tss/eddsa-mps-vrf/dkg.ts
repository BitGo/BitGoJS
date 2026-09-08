import type { MsgState, MsgStateMap, VrfShare } from '@bitgo/wasm-mps';
import { Buffer } from 'buffer';
import crypto from 'crypto';
import { DeserializedMessages } from '../ecdsa-dkls/types';
import { decodePartyId, decodeVrfDkgSessionData, decodeVrfRound1MsgMap, VrfDkgSessionData, VrfDkgState } from './types';

type NodeWasmer = typeof import('@bitgo/wasm-mps');
type WebWasmer = typeof import('@bitgo/wasm-mps/web');
type WasmMps = NodeWasmer | WebWasmer;

/**
 * Round driver for the EdDSA MPS VRF DKG, which produces a Ristretto VRF keyshare.
 *
 * Two message exchanges: round 0 broadcasts VrfKeygenMsg1, round 1 emits per-recipient
 * VrfKeygenMsg2 as p2p messages, round 2 returns the VrfShare. There is no chain-code
 * commitment step, unlike the signing DKG.
 *
 * Callers pass every message they hold; this class routes them internally. Round 1
 * must exclude the party's own commitment (the wasm rejects a sender set containing
 * it) and round 2 consumes the openings addressed to this party.
 *
 * Party indices follow the MPCv2 convention: 0 = user, 1 = backup, 2 = bitgo.
 * `VrfShare` exposes only share bytes — no public key, key id, or root chain code.
 */
export class VrfDkg {
  protected n: number;
  protected t: number;
  protected partyIdx: number;
  protected seed: Buffer | undefined;
  /** Opaque wasm round-state bytes. Secret key material. */
  protected vrfStateBytes: Buffer | undefined;
  protected keyShareBuff: Buffer | undefined;
  protected vrfState: VrfDkgState = VrfDkgState.Uninitialized;
  private wasmMps: WasmMps | null = null;

  constructor(n: number, t: number, partyIdx: number, seed?: Buffer) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.seed = seed;
  }

  private async loadWasmMps(): Promise<void> {
    if (!this.wasmMps) {
      // Electron renderer sets process.type and must use the node wasm build.
      if (typeof window !== 'undefined' && window.process?.['type'] !== 'renderer') {
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

  private getVrfStateBytes(): Buffer {
    if (!this.vrfStateBytes) {
      throw Error(`VRF DKG state bytes missing in state ${this.vrfState}`);
    }
    return this.vrfStateBytes;
  }

  getState(): VrfDkgState {
    return this.vrfState;
  }

  /**
   * Create this party's VRF DKG commitment (VrfKeygenMsg1, broadcast).
   */
  async initDkg(): Promise<DeserializedMessages> {
    await this.loadWasmMps();
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw Error('Invalid parameters for VRF DKG');
    }
    if (this.seed && this.seed.length !== 32) {
      throw Error(`Seed should be 32 bytes, got ${this.seed.length}.`);
    }
    if (this.vrfState !== VrfDkgState.Uninitialized) {
      throw Error('VRF DKG session already initialized');
    }

    const wasm = this.getWasmMps();
    let result: MsgState;
    try {
      result = wasm.ed25519_vrf_dkg_round0_process(this.partyIdx, this.seed ?? crypto.randomBytes(32));
    } catch (err) {
      throw new Error(`Error while creating the first VRF message from party ${this.partyIdx}: ${err}`);
    }
    const payload = new Uint8Array(result.msg);
    this.vrfStateBytes = Buffer.from(result.state);
    result.free();
    this.vrfState = VrfDkgState.Round1;
    return { broadcastMessages: [{ payload, from: this.partyIdx }], p2pMessages: [] };
  }

  /**
   * Process the messages this party holds for the current round and return this
   * party's messages for the next round. Callers pass everything they hold; the
   * round routing happens here:
   *
   * - Round 1: consumes the other parties' commitments (own excluded) and emits
   *   per-recipient openings (VrfKeygenMsg2) as p2p messages.
   * - Round 2: consumes the openings addressed to this party and finalizes the DKG.
   */
  async handleIncomingMessages(messagesForIthRound: DeserializedMessages): Promise<DeserializedMessages> {
    await this.loadWasmMps();
    if (this.vrfState === VrfDkgState.Complete) {
      throw Error('VRF DKG session already completed');
    }
    if (this.vrfState === VrfDkgState.Uninitialized) {
      throw Error('VRF DKG session not initialized');
    }
    const wasm = this.getWasmMps();

    switch (this.vrfState) {
      case VrfDkgState.Round1: {
        const othersCommitments = messagesForIthRound.broadcastMessages
          .filter((m) => m.from !== this.partyIdx)
          .sort((a, b) => a.from - b.from)
          .map((m) => m.payload);
        let result: MsgStateMap;
        try {
          result = wasm.ed25519_vrf_dkg_round1_process(othersCommitments, this.getVrfStateBytes());
        } catch (err) {
          throw new Error(
            `Error while creating VRF messages from party ${this.partyIdx}, state ${this.vrfState}: ${err}`
          );
        }
        const openings = Object.entries(decodeVrfRound1MsgMap(result.msg)).map(([recipient, payload]) => ({
          payload: new Uint8Array(payload),
          from: this.partyIdx,
          to: decodePartyId(recipient),
        }));
        this.vrfStateBytes = Buffer.from(result.state);
        result.free();
        this.vrfState = VrfDkgState.Round2;
        return { broadcastMessages: [], p2pMessages: openings };
      }

      case VrfDkgState.Round2: {
        const openingsForMe = messagesForIthRound.p2pMessages
          .filter((m) => m.to === this.partyIdx)
          .sort((a, b) => a.from - b.from)
          .map((m) => m.payload);
        let share: VrfShare;
        try {
          share = wasm.ed25519_vrf_dkg_round2_process(openingsForMe, this.getVrfStateBytes());
        } catch (err) {
          throw new Error(
            `Error while creating VRF messages from party ${this.partyIdx}, state ${this.vrfState}: ${err}`
          );
        }
        this.keyShareBuff = Buffer.from(share.share);
        share.free();
        this.vrfStateBytes = undefined;
        this.vrfState = VrfDkgState.Complete;
        return { broadcastMessages: [], p2pMessages: [] };
      }

      default:
        throw Error(`Invalid VRF DKG state: ${this.vrfState}`);
    }
  }

  /**
   * Get the VRF keyshare bytes once the DKG is complete.
   * This buffer is private key material.
   */
  getKeyShare(): Buffer {
    if (!this.keyShareBuff) {
      throw Error('Can not get key share, VRF DKG is not complete yet.');
    }
    return this.keyShareBuff;
  }

  /**
   * Get the current session data that can be used to restore the session later.
   *
   * The returned state bytes are secret key material — they carry this party's
   * secret VRF share. They must never be logged or persisted in the clear.
   */
  getSessionData(): VrfDkgSessionData {
    if (this.vrfState === VrfDkgState.Uninitialized) {
      throw Error('VRF DKG session not initialized');
    }
    const sessionData: VrfDkgSessionData = { vrfState: this.vrfState };
    if (this.vrfStateBytes) {
      sessionData.vrfStateBytes = this.vrfStateBytes;
    }
    if (this.keyShareBuff) {
      sessionData.keyShareBuff = this.keyShareBuff;
    }
    return sessionData;
  }

  /**
   * Restore a VRF DKG session from previous session data.
   * MPS wasm state bytes have no round tag, so the persisted `vrfState` is used.
   */
  static async restoreSession(n: number, t: number, partyIdx: number, sessionData: unknown): Promise<VrfDkg> {
    const data = decodeVrfDkgSessionData(sessionData);
    const vrfDkg = new VrfDkg(n, t, partyIdx);
    switch (data.vrfState) {
      case VrfDkgState.Round1:
      case VrfDkgState.Round2:
        if (!data.vrfStateBytes) {
          throw Error(`Cannot restore VRF DKG session in state ${data.vrfState} without state bytes`);
        }
        vrfDkg.vrfStateBytes = Buffer.from(data.vrfStateBytes);
        break;
      case VrfDkgState.Complete:
        if (!data.keyShareBuff) {
          throw Error('Cannot restore a completed VRF DKG session without a key share');
        }
        vrfDkg.keyShareBuff = data.keyShareBuff;
        break;
      default:
        throw Error(`Invalid VRF DKG state: ${data.vrfState}`);
    }
    vrfDkg.vrfState = data.vrfState;
    return vrfDkg;
  }
}
