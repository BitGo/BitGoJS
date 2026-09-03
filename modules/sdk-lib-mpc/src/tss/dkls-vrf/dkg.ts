import type {
  Message as VrfWasmMessage,
  VrfKeygenSession,
  VrfKeyshare as DklsVrfKeyshare,
} from '@silencelaboratories/dkls-wasm-ll-vrf-node';
import type { VrfKeygenSession as VrfWebKeygenSession } from '@silencelaboratories/dkls-wasm-ll-vrf-web';
import { decode } from 'cbor-x';
import { Buffer } from 'buffer';
import { DeserializedMessages } from '../ecdsa-dkls/types';
import { VrfDkgSessionData, VrfDkgState } from './types';

// Platform-specific modules that do not exist everywhere: the node/web/bundler wasm
// variants are mutually exclusive and selected at runtime (node process vs browser vs
// bundler). Static imports would load the wrong platform's wasm binding, so both the
// type aliases below and the lazy `await import()` calls are deliberate.
type NodeVrfWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-vrf-node');
type WebVrfWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-vrf-web');
type BundlerVrfWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-vrf-bundler');

type VrfWasm = NodeVrfWasmer | WebVrfWasmer | BundlerVrfWasmer;

/**
 * Round driver for the DKLS VRF DKG, which produces a Ristretto VRF keyshare.
 *
 * Two rounds, all broadcast: round 1 exchanges commitments (VrfKeygenMsg1), round 2
 * exchanges openings (VrfKeygenMsg2, emitted per recipient) and the DKG finalizes
 * locally. There is no chain-code commitment step, unlike the signing DKG.
 *
 * Callers pass every message they hold; this class routes them internally. Round 1
 * must exclude the party's own commitment (the wasm rejects a sender set containing
 * it) and round 2 consumes the openings addressed to this party, own included.
 *
 * Party indices follow the MPCv2 convention: 0 = user, 1 = backup, 2 = bitgo.
 */
export class VrfDkg {
  protected vrfSession: VrfKeygenSession | VrfWebKeygenSession | undefined;
  protected vrfSessionBytes: Uint8Array;
  protected vrfKeyShare: DklsVrfKeyshare | undefined;
  protected keyShareBuff: Buffer | undefined;
  protected publicKey: Buffer | undefined;
  protected keyId: Buffer | undefined;
  protected rootChainCode: Buffer | undefined;
  protected n: number;
  protected t: number;
  protected partyIdx: number;
  protected seed: Buffer | undefined;
  protected vrfState: VrfDkgState = VrfDkgState.Uninitialized;
  protected vrfWasm: VrfWasm | null;

  constructor(n: number, t: number, partyIdx: number, seed?: Buffer, vrfWasm?: BundlerVrfWasmer) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.seed = seed;
    this.vrfWasm = vrfWasm ?? null;
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
    if (!this.vrfSession) {
      this.vrfSession = this.getVrfWasm().VrfKeygenSession.fromBytes(this.vrfSessionBytes);
    }
  }

  /**
   * Re-derive the round state from the wasm session bytes instead of trusting a
   * caller-supplied enum. The wasm embeds a round tag for exactly this reason; this
   * is what lets a stateless server resume mid-protocol.
   */
  private _deserializeState() {
    if (!this.vrfSession) {
      throw Error('Session not initialized');
    }
    const round = decode(this.vrfSession.toBytes()).round;
    if (round === 'Init') {
      this.vrfState = VrfDkgState.Uninitialized;
    } else if (round === 'WaitMsg1') {
      this.vrfState = VrfDkgState.Round1;
    } else if (round === 'WaitMsg2') {
      this.vrfState = VrfDkgState.Round2;
    } else if (typeof round === 'object' && round !== null && 'Share' in round) {
      this.vrfState = VrfDkgState.Complete;
    } else {
      this.vrfState = VrfDkgState.InvalidState;
      throw Error(`Invalid State: ${JSON.stringify(round)}`);
    }
  }

  /**
   * Create this party's VRF DKG commitment (VrfKeygenMsg1, broadcast).
   */
  async initDkg(): Promise<DeserializedMessages> {
    if (!this.vrfWasm) {
      await this.loadVrfWasm();
    }
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw Error('Invalid parameters for VRF DKG');
    }
    if (this.vrfState != VrfDkgState.Uninitialized) {
      throw Error('VRF DKG session already initialized');
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
    if (this.seed && this.seed.length !== 32) {
      throw Error(`Seed should be 32 bytes, got ${this.seed.length}.`);
    }
    const { VrfKeygenSession } = this.getVrfWasm();
    this.vrfSession = this.seed
      ? new VrfKeygenSession(this.n, this.t, this.partyIdx, new Uint8Array(this.seed))
      : new VrfKeygenSession(this.n, this.t, this.partyIdx);
    try {
      const message = this.vrfSession.createFirstMessage();
      // Copy the payload out before freeing the wasm message object.
      const payload = new Uint8Array(message.payload);
      message.free();
      this.vrfSessionBytes = this.vrfSession.toBytes();
      this._deserializeState();
      return { broadcastMessages: [{ payload, from: this.partyIdx }], p2pMessages: [] };
    } catch (e) {
      throw Error(`Error while creating the first VRF message from party ${this.partyIdx}: ${e}`);
    }
  }

  /**
   * Process the messages this party holds for the current round and return this
   * party's messages for the next round. Callers pass everything they hold; the
   * round routing happens here:
   *
   * - Round 1 (WaitMsg1): consumes the other parties' commitments (own excluded —
   *   the wasm rejects a sender set containing the party's own Msg1) and emits this
   *   party's openings (VrfKeygenMsg2), one broadcast message per recipient.
   * - Round 2 (WaitMsg2): consumes the openings addressed to this party (own
   *   self-addressed opening included) and finalizes the DKG, returning no messages.
   */
  async handleIncomingMessages(messagesForIthRound: DeserializedMessages): Promise<DeserializedMessages> {
    this._restoreSession();
    if (!this.vrfSession) {
      throw Error('Session not initialized');
    }
    const { Message: VrfMessage } = this.getVrfWasm();
    let nextRoundMessages: VrfWasmMessage[] = [];
    const nextRoundDeserializedMessages: DeserializedMessages = { broadcastMessages: [], p2pMessages: [] };
    try {
      switch (this.vrfState) {
        case VrfDkgState.Round1: {
          const othersCommitments = messagesForIthRound.broadcastMessages.filter((m) => m.from !== this.partyIdx);
          nextRoundMessages = this.vrfSession.handleMessages(
            othersCommitments.map((m) => new VrfMessage(m.payload, m.from))
          );
          this._deserializeState();
          break;
        }
        case VrfDkgState.Round2: {
          const openingsForMe = messagesForIthRound.p2pMessages.filter((m) => m.to === this.partyIdx);
          nextRoundMessages = this.vrfSession.handleMessages(
            openingsForMe.map((m) => new VrfMessage(m.payload, m.from, m.to))
          );
          // vrfKeyshare() consumes (and deallocates) the session in all cases.
          const vrfKeyShare = this.vrfSession.vrfKeyshare();
          this.vrfKeyShare = vrfKeyShare;
          this.keyShareBuff = Buffer.from(vrfKeyShare.toBytes());
          this.publicKey = Buffer.from(vrfKeyShare.publicKey);
          this.keyId = Buffer.from(vrfKeyShare.keyId);
          this.rootChainCode = Buffer.from(vrfKeyShare.rootChainCode);
          vrfKeyShare.free();
          this.vrfState = VrfDkgState.Complete;
          return nextRoundDeserializedMessages;
        }
        default:
          throw Error(`Invalid VRF DKG state: ${this.vrfState}`);
      }

      nextRoundDeserializedMessages.broadcastMessages = nextRoundMessages
        .filter((m) => m.to_id === undefined)
        .map((m) => ({ payload: new Uint8Array(m.payload), from: m.from_id }));
      nextRoundDeserializedMessages.p2pMessages = nextRoundMessages
        .filter((m) => m.to_id !== undefined)
        .map((m) => ({ payload: new Uint8Array(m.payload), from: m.from_id, to: m.to_id! }));
      return nextRoundDeserializedMessages;
    } catch (e) {
      throw Error(`Error while creating VRF messages from party ${this.partyIdx}, state ${this.vrfState}: ${e}`);
    } finally {
      nextRoundMessages.forEach((m) => m.free());
      if (this.vrfState !== VrfDkgState.Complete) {
        this.vrfSessionBytes = this.vrfSession.toBytes();
        this.vrfSession = undefined;
      }
    }
  }

  /**
   * Get the VRF keyshare bytes (CBOR VrfKeyshare) once the DKG is complete.
   * This buffer is private key material.
   */
  getKeyShare(): Buffer {
    if (!this.keyShareBuff) {
      throw Error('Can not get key share, VRF DKG is not complete yet.');
    }
    return this.keyShareBuff;
  }

  /** 32-byte compressed Ristretto VRF public key, available once the DKG is complete. */
  getPublicKey(): Buffer {
    if (!this.publicKey) {
      throw Error('Can not get public key, VRF DKG is not complete yet.');
    }
    return this.publicKey;
  }

  /** 32-byte VRF key identifier, available once the DKG is complete. */
  getKeyId(): Buffer {
    if (!this.keyId) {
      throw Error('Can not get key id, VRF DKG is not complete yet.');
    }
    return this.keyId;
  }

  /** 32-byte VRF root chain code, available once the DKG is complete. */
  getRootChainCode(): Buffer {
    if (!this.rootChainCode) {
      throw Error('Can not get root chain code, VRF DKG is not complete yet.');
    }
    return this.rootChainCode;
  }

  /**
   * Get the current session data that can be used to restore the session later.
   *
   * The returned session bytes are secret key material — they carry this party's
   * secret polynomial share. They must never be logged or persisted in the clear;
   * the caller encrypts them exactly like the key share itself.
   */
  getSessionData(): VrfDkgSessionData {
    const sessionData: VrfDkgSessionData = {
      vrfSessionBytes: this.vrfSessionBytes,
      vrfState: this.vrfState,
    };
    if (this.keyShareBuff) {
      sessionData.keyShareBuff = this.keyShareBuff;
    }
    return sessionData;
  }

  /**
   * Restore a VRF DKG session from previous session data.
   * Note: This should not be used for Round 1 as that's the initialization phase.
   * The round state is re-derived from the wasm session bytes, not trusted from the
   * caller-supplied enum, so a tampered `vrfState` cannot steer the protocol.
   */
  static async restoreSession(
    n: number,
    t: number,
    partyIdx: number,
    sessionData: VrfDkgSessionData,
    seed?: Buffer,
    vrfWasm?: BundlerVrfWasmer
  ): Promise<VrfDkg> {
    const vrfDkg = new VrfDkg(n, t, partyIdx, seed, vrfWasm);
    if (!vrfDkg.vrfWasm) {
      await vrfDkg.loadVrfWasm();
    }
    vrfDkg.vrfSessionBytes = sessionData.vrfSessionBytes;
    vrfDkg._restoreSession();
    vrfDkg._deserializeState();
    if (sessionData.keyShareBuff) {
      vrfDkg.keyShareBuff = sessionData.keyShareBuff;
    }
    return vrfDkg;
  }
}
