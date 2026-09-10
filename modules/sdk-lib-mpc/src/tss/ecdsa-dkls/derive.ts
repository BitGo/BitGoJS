import type {
  HardDeriveSession as DklsHardDeriveSession,
  Message as VrfWasmMessage,
  VrfKeygenSession as DklsVrfKeygenSession,
} from '@silencelaboratories/dkls-wasm-ll-vrf-node';
import type {
  HardDeriveSession as DklsVrfWebHardDeriveSession,
  VrfKeygenSession as DklsVrfWebKeygenSession,
} from '@silencelaboratories/dkls-wasm-ll-vrf-web';
import { decode, encode } from 'cbor-x';
import { Buffer } from 'buffer';
import { DeserializedBroadcastMessage, DeserializedMessages, ReducedKeyShare } from './types';

// Platform-specific modules that do not exist everywhere: the node/web/bundler wasm
// variants are mutually exclusive and selected at runtime (node process vs browser vs
// bundler). Static imports would load the wrong platform's wasm binding, so both the
// type aliases below and the lazy `await import()` calls are deliberate.
type NodeVrfWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-vrf-node');
type WebVrfWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-vrf-web');
type BundlerVrfWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-vrf-bundler');

type VrfWasm = NodeVrfWasmer | WebVrfWasmer | BundlerVrfWasmer;

export type { DklsHardDeriveSession, DklsVrfWebHardDeriveSession, DklsVrfKeygenSession, DklsVrfWebKeygenSession };

export enum DeriveState {
  Uninitialized,
  Round1,
  Round2,
  Complete,
  InvalidState,
}

export interface DeriveSessionData {
  deriveSessionBytes: Uint8Array;
  deriveState: DeriveState;
  keyShareBuff?: Buffer;
  // This party's own protocol messages, re-fed into the session on the next round
  // because the wasm session validates the sender set against {self, partner}.
  ownMsg1?: Uint8Array;
  ownMsg2?: Uint8Array;
}

/**
 * Round driver for the DKLS23 hard-derivation protocol (Ristretto VRF backed),
 * which derives a child signing keyshare from a root keyshare and its VRF keyshare.
 *
 * Each session is a 2-party threshold protocol between this party and one partner:
 * every round accepts exactly two broadcast messages — this party's own (created by
 * `initDerive()` and re-fed automatically) and the partner's. A ceremony runs one
 * `Derive` per SDK party, each paired with the BitGo party:
 *
 * - Round 1 (`WaitMsg1`): consume `{own msg1, partner msg1}`, emit own broadcast msg2.
 * - Round 2 (`WaitMsg2`): consume `{own msg2, partner msg2}`, finalize the session
 *   and extract the derived DKLS `Keyshare`.
 *
 * The session is seeded from the decrypted root blob: the DKLS signing keyshare and
 * the Ristretto VRF keyshare produced by root keygen, plus the child's hardened
 * derivation path.
 *
 * Party indices follow the MPCv2 convention: 0 = user, 1 = backup, 2 = bitgo.
 */
export class Derive {
  protected deriveSession: DklsHardDeriveSession | DklsVrfWebHardDeriveSession | undefined;
  protected deriveSessionBytes: Uint8Array;
  protected keyShareBuff: Buffer | undefined;
  protected n: number;
  protected t: number;
  protected partyIdx: number;
  protected rootKeyShare: Buffer;
  protected vrfKeyShare: Buffer;
  protected path: Uint8Array;
  protected seed: Buffer | undefined;
  protected deriveState: DeriveState = DeriveState.Uninitialized;
  protected vrfWasm: VrfWasm | null;
  // This party's own protocol messages, re-fed into the session on the next round:
  // the wasm hard-derive session validates the sender set against {self, partner}.
  protected ownMsg1: Uint8Array | undefined;
  protected ownMsg2: Uint8Array | undefined;

  constructor(
    n: number,
    t: number,
    partyIdx: number,
    rootKeyShare: Buffer,
    vrfKeyShare: Buffer,
    path: Uint8Array,
    seed?: Buffer,
    vrfWasm?: BundlerVrfWasmer
  ) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.rootKeyShare = rootKeyShare;
    this.vrfKeyShare = vrfKeyShare;
    this.path = path;
    this.seed = seed;
    this.vrfWasm = vrfWasm ?? null;
    this.deriveSessionBytes = new Uint8Array(0);
  }

  private async loadVrfWasm(): Promise<void> {
    if (!this.vrfWasm) {
      this.vrfWasm = await import('@silencelaboratories/dkls-wasm-ll-vrf-node');
    }
  }

  private getVrfWasm() {
    if (!this.vrfWasm) {
      throw Error('VRF wasm not loaded');
    }
    return this.vrfWasm;
  }

  private _restoreSession() {
    if (!this.deriveSession) {
      this.deriveSession = this.getVrfWasm().HardDeriveSession.fromBytes(this.deriveSessionBytes);
    }
  }

  /**
   * Re-derive the round state from the wasm session bytes instead of trusting a
   * caller-supplied enum. The wasm embeds the round tag (`WaitMsg1`/`WaitMsg2`,
   * then a `Share` payload once finalized) for exactly this reason.
   */
  private _deserializeState() {
    if (!this.deriveSession) {
      throw Error('Session not initialized');
    }
    const decoded = decode(this.deriveSession.toBytes());
    const round = decoded?.inner?.round;
    if (round === 'WaitMsg1') {
      this.deriveState = DeriveState.Round1;
    } else if (round === 'WaitMsg2') {
      this.deriveState = DeriveState.Round2;
    } else if (decoded?.inner?.state?.Share !== undefined || this.deriveSession.isFinished()) {
      this.deriveState = DeriveState.Complete;
    } else {
      this.deriveState = DeriveState.InvalidState;
      throw Error(`Invalid State: ${JSON.stringify(round)}`);
    }
  }

  /**
   * Create this party's first hard-derive message (broadcast). Seeds the wasm
   * session from the root keyshare, VRF keyshare and derivation path.
   */
  async initDerive(): Promise<DeserializedBroadcastMessage> {
    if (!this.vrfWasm) {
      await this.loadVrfWasm();
    }
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw Error('Invalid parameters for hard derive');
    }
    if (this.deriveState !== DeriveState.Uninitialized) {
      throw Error('Hard derive session already initialized');
    }
    if (this.seed && this.seed.length !== 32) {
      throw Error(`Seed should be 32 bytes, got ${this.seed.length}.`);
    }
    if (
      typeof window !== 'undefined' &&
      /* checks for electron processes */
      !window.process &&
      !window.process?.['type']
    ) {
      /* This is only needed for browsers/web because it uses fetch to resolve the wasm asset for the web */
      const initVrf = await import('@silencelaboratories/dkls-wasm-ll-vrf-web');
      await initVrf.default();
    }
    const { HardDeriveSession, Keyshare, VrfKeyshare } = this.getVrfWasm();
    const rootKeyShare = Keyshare.fromBytes(this.rootKeyShare);
    if (rootKeyShare.partyId !== this.partyIdx) {
      throw Error(`Party index: ${this.partyIdx} does not match root key share partyId: ${rootKeyShare.partyId}`);
    }
    const vrfKeyShare = VrfKeyshare.fromBytes(this.vrfKeyShare);
    if (vrfKeyShare.partyId !== this.partyIdx) {
      throw Error(`Party index: ${this.partyIdx} does not match VRF key share partyId: ${vrfKeyShare.partyId}`);
    }
    this.deriveSession = this.seed
      ? new HardDeriveSession(rootKeyShare, vrfKeyShare, this.path, new Uint8Array(this.seed))
      : new HardDeriveSession(rootKeyShare, vrfKeyShare, this.path);
    try {
      const message = this.deriveSession.createFirstMessage();
      // Copy the payload out before freeing the wasm message object.
      const payload = new Uint8Array(message.payload);
      const from = message.from_id;
      message.free();
      this.ownMsg1 = payload;
      this.deriveSessionBytes = this.deriveSession.toBytes();
      this._deserializeState();
      return { payload, from };
    } catch (e) {
      throw Error(`Error while creating the first hard-derive message from party ${this.partyIdx}: ${e}`);
    }
  }

  /**
   * Process the messages this party holds for the current round and return this
   * party's messages for the next round. Callers pass the partner's broadcast
   * message only; this party's own message is re-fed automatically because the
   * wasm session validates the sender set as `{self, partner}`.
   *
   * - Round 1 (WaitMsg1): consumes `{own msg1, partner msg1}` and emits this
   *   party's broadcast msg2.
   * - Round 2 (WaitMsg2): consumes `{own msg2, partner msg2}` and finalizes the
   *   session, returning no messages.
   */
  handleIncomingMessages(messagesForIthRound: DeserializedMessages): DeserializedMessages {
    this._restoreSession();
    if (!this.deriveSession) {
      throw Error('Session not initialized');
    }
    const { Message } = this.getVrfWasm();
    let nextRoundMessages: VrfWasmMessage[] = [];
    const nextRoundDeserializedMessages: DeserializedMessages = { broadcastMessages: [], p2pMessages: [] };
    try {
      switch (this.deriveState) {
        case DeriveState.Round1: {
          const partnerMessages = messagesForIthRound.broadcastMessages.filter((m) => m.from !== this.partyIdx);
          if (partnerMessages.length !== 1 || !this.ownMsg1) {
            throw Error('Expected exactly one broadcast message from the derive partner in round 1');
          }
          nextRoundMessages = this.deriveSession.handleMessages([
            new Message(this.ownMsg1, this.partyIdx),
            new Message(partnerMessages[0].payload, partnerMessages[0].from),
          ]);
          this._deserializeState();
          break;
        }
        case DeriveState.Round2: {
          const partnerMessages = messagesForIthRound.broadcastMessages.filter((m) => m.from !== this.partyIdx);
          if (partnerMessages.length !== 1 || !this.ownMsg2) {
            throw Error('Expected exactly one broadcast message from the derive partner in round 2');
          }
          nextRoundMessages = this.deriveSession.handleMessages([
            new Message(this.ownMsg2, this.partyIdx),
            new Message(partnerMessages[0].payload, partnerMessages[0].from),
          ]);
          // handleMessages() consumes the session; keyshare() extracts the derived share.
          const keyShare = this.deriveSession.keyshare();
          this.keyShareBuff = Buffer.from(keyShare.toBytes());
          keyShare.free();
          this.deriveState = DeriveState.Complete;
          return nextRoundDeserializedMessages;
        }
        default:
          throw Error(`Invalid hard-derive state: ${this.deriveState}`);
      }

      nextRoundDeserializedMessages.broadcastMessages = nextRoundMessages
        .filter((m) => m.to_id === undefined)
        .map((m) => ({ payload: new Uint8Array(m.payload), from: m.from_id }));
      nextRoundDeserializedMessages.p2pMessages = nextRoundMessages
        .filter((m): m is VrfWasmMessage & { to_id: number } => m.to_id !== undefined)
        .map((m) => ({ payload: new Uint8Array(m.payload), from: m.from_id, to: m.to_id }));
      // The round-1 output is this party's msg2, re-fed into the session on round 2.
      const ownMsg2 = nextRoundDeserializedMessages.broadcastMessages.find((m) => m.from === this.partyIdx);
      if (ownMsg2) {
        this.ownMsg2 = ownMsg2.payload;
      }
      return nextRoundDeserializedMessages;
    } catch (e) {
      throw Error(
        `Error while creating hard-derive messages from party ${this.partyIdx}, state ${this.deriveState}: ${e}`
      );
    } finally {
      nextRoundMessages.forEach((m) => m.free());
      // keyshare() consumed (and deallocated) the session on round 2; only persist
      // mid-protocol session bytes while the session object still exists.
      if (this.deriveState !== DeriveState.Complete && this.deriveSession) {
        this.deriveSessionBytes = this.deriveSession.toBytes();
      }
      this.deriveSession = undefined;
    }
  }

  /**
   * Get the derived DKLS keyshare bytes (CBOR `Keyshare`) once the derive is
   * complete. This buffer is private key material.
   */
  getKeyShare(): Buffer {
    if (!this.keyShareBuff) {
      throw Error('Can not get key share, hard derive is not complete yet.');
    }
    return this.keyShareBuff;
  }

  /**
   * Returns a CBOR-encoded ReducedKeyShare buffer containing the derived party's
   * private scalar (s_i) in the `prv` field. This buffer is private key material;
   * the caller encrypts it as `reducedEncryptedPrv`, matching `Dkg.getReducedKeyShare`.
   */
  getReducedKeyShare(): Buffer {
    if (!this.keyShareBuff) {
      throw Error('Can not get key share, hard derive is not complete yet.');
    }
    const decodedKeyshare = decode(this.keyShareBuff);
    const reducedKeyShare: ReducedKeyShare = {
      bigSList: decodedKeyshare.big_s_list,
      xList: decodedKeyshare.x_i_list,
      rootChainCode: decodedKeyshare.root_chain_code,
      prv: decodedKeyshare.s_i,
      pub: decodedKeyshare.public_key,
    };
    return Buffer.from(encode(reducedKeyShare));
  }

  /**
   * Get the current session data that can be used to restore the session later.
   *
   * The returned session bytes are secret key material — they carry this party's
   * root keyshares. They must never be logged or persisted in the clear; the
   * caller encrypts them exactly like the key share itself.
   */
  getSessionData(): DeriveSessionData {
    const sessionData: DeriveSessionData = {
      deriveSessionBytes: this.deriveSessionBytes,
      deriveState: this.deriveState,
    };
    if (this.keyShareBuff) {
      sessionData.keyShareBuff = this.keyShareBuff;
    }
    if (this.ownMsg1) {
      sessionData.ownMsg1 = this.ownMsg1;
    }
    if (this.ownMsg2) {
      sessionData.ownMsg2 = this.ownMsg2;
    }
    return sessionData;
  }

  /**
   * Restore a hard-derive session from previous session data.
   * Note: This should not be used for Round 1 as that's the initialization phase.
   * The round state is re-derived from the wasm session bytes, not trusted from the
   * caller-supplied enum, so a tampered `deriveState` cannot steer the protocol.
   */
  static async restoreSession(
    n: number,
    t: number,
    partyIdx: number,
    rootKeyShare: Buffer,
    vrfKeyShare: Buffer,
    path: Uint8Array,
    sessionData: DeriveSessionData,
    seed?: Buffer,
    vrfWasm?: BundlerVrfWasmer
  ): Promise<Derive> {
    const derive = new Derive(n, t, partyIdx, rootKeyShare, vrfKeyShare, path, seed, vrfWasm);
    if (!derive.vrfWasm) {
      await derive.loadVrfWasm();
    }
    derive.deriveSessionBytes = sessionData.deriveSessionBytes;
    if (sessionData.keyShareBuff) {
      derive.keyShareBuff = sessionData.keyShareBuff;
    }
    if (sessionData.ownMsg1) {
      derive.ownMsg1 = sessionData.ownMsg1;
    }
    if (sessionData.ownMsg2) {
      derive.ownMsg2 = sessionData.ownMsg2;
    }
    derive._restoreSession();
    derive._deserializeState();
    return derive;
  }
}
