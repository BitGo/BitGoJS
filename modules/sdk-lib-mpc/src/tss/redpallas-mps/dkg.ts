import type { MsgDerivationInit, MsgState } from '@bitgo/wasm-mps';
import { encode } from 'cbor-x';
import crypto from 'crypto';
import { DeserializedMessage, DeserializedMessages, RedPallasDkgState, RedPallasReducedKeyShare } from './types';

type NodeWasmer = typeof import('@bitgo/wasm-mps');
type WebWasmer = typeof import('@bitgo/wasm-mps/web');
type WasmMps = NodeWasmer | WebWasmer;

/**
 * RedPallas (Zcash Ironwood) Distributed Key Generation (DKG) implementation using @bitgo/wasm-mps.
 *
 * Mirrors the structure of the EdDSA MPS `DKG` class (see `../eddsa-mps/dkg.ts`), but wraps the
 * `redpallas_dkg_*` WASM bindings. Round2 additionally requires a `derivationSeed` and returns a
 * `MsgDerivationInit` (msg/pk/share/state) rather than a final `Share`, because RedPallas key
 * derivation (ask/nk/rivk/ivks, via `redpallas_derivation_process`) is a separate, subsequent
 * process that is platform-side only and intentionally not exposed here.
 *
 * State is explicit: each round function returns `{ msg, state }` bytes. The state bytes are
 * stored between rounds and passed to the next round function, mirroring the server-side
 * persistence pattern (state would be serialised to DB, or in OVC's case, a microSD card).
 *
 * @example
 * ```typescript
 * const dkg = new RedPallasDKG(3, 2, 0);
 * // X25519 keys come from GPG encryption subkeys (extracted by the orchestrator)
 * await dkg.initDkg(myX25519PrivKey, [otherParty1X25519PubKey, otherParty2X25519PubKey]);
 * const msg1 = dkg.getFirstMessage();
 * const msg2s = dkg.handleIncomingMessages(allThreeMsg1s);
 * dkg.handleIncomingMessages(allThreeMsg2s, derivationSeed);  // completes DKG
 * const keyShare = dkg.getKeyShare();
 * ```
 */
export class RedPallasDKG {
  protected n: number;
  protected t: number;
  protected partyIdx: number;

  /** Private X25519 key (from GPG encryption subkey) */
  private decryptionKey: Buffer | null = null;
  /** Other parties' X25519 public keys (from their GPG encryption subkeys), sorted by party index */
  private otherPubKeys: Buffer[] | null = null;
  /** Serialised round state bytes returned by the previous round function */
  private dkgStateBytes: Buffer | null = null;
  /** Opaque bincode-serialised keyshare from round2 */
  private keyShare: Buffer | null = null;
  /** RedPallas public key (verification key) from round2 */
  private sharePk: Buffer | null = null;
  /** Lazily loaded WASM module */
  private wasmMps: WasmMps | null = null;

  protected dkgState: RedPallasDkgState = RedPallasDkgState.Uninitialized;

  constructor(n: number, t: number, partyIdx: number) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
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

  getState(): RedPallasDkgState {
    return this.dkgState;
  }

  /**
   * Initialises the DKG session with this party's X25519 private key and the other parties'
   * X25519 public keys. Keys are extracted from GPG encryption subkeys by the orchestrator.
   *
   * @param decryptionKey - This party's 32-byte X25519 private key (GPG enc subkey private part).
   * @param otherEncPublicKeys - Other parties' 32-byte X25519 public keys, sorted by ascending
   *   party index (excluding own). For a 3-party setup, this is [party_A_pub, party_B_pub].
   */
  async initDkg(decryptionKey: Buffer, otherEncPublicKeys: Buffer[]): Promise<void> {
    await this.loadWasmMps();
    if (!decryptionKey || decryptionKey.length !== 32) {
      throw Error('Missing or invalid decryption key: must be 32 bytes');
    }
    if (!otherEncPublicKeys || otherEncPublicKeys.length !== this.n - 1) {
      throw Error(`Expected ${this.n - 1} other parties' public keys`);
    }
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw Error('Invalid parameters for DKG');
    }

    this.decryptionKey = decryptionKey;
    this.otherPubKeys = otherEncPublicKeys;
    this.dkgState = RedPallasDkgState.Init;
  }

  /**
   * Runs round0 of the DKG protocol. Returns this party's broadcast message.
   * Stores the round state bytes internally for the next round.
   *
   * @param dkgSeed - Optional 32-byte seed for deterministic DKG output (testing only).
   */
  getFirstMessage(dkgSeed?: Buffer): DeserializedMessage {
    if (this.dkgState !== RedPallasDkgState.Init) {
      throw Error('DKG session not initialized');
    }

    const seed = dkgSeed ?? crypto.randomBytes(32);
    const wasm = this.getWasmMps();
    let result: MsgState;
    try {
      result = wasm.redpallas_dkg_round0_process(this.partyIdx, this.decryptionKey!, this.otherPubKeys!, seed);
    } catch (err) {
      throw new Error(`Error while creating the first message from party ${this.partyIdx}: ${err}`);
    }

    this.dkgStateBytes = Buffer.from(result.state);
    this.dkgState = RedPallasDkgState.WaitMsg1;
    return { payload: new Uint8Array(result.msg), from: this.partyIdx };
  }

  /**
   * Handles incoming messages from all parties and advances the protocol.
   *
   * - In WaitMsg1: runs round1, returns this party's round1 broadcast message.
   * - In WaitMsg2: runs round2, completes DKG, returns [].
   *
   * The caller passes all n messages (including own); own message is filtered
   * out internally. Other parties' messages are sorted by ascending party index,
   * matching the ordering expected by @bitgo/wasm-mps.
   *
   * @param messagesForIthRound - All n messages for this round (including own).
   * @param derivationSeed - Required only when advancing WaitMsg2 -> Complete (round2): a
   *   32-byte seed consumed by the subsequent, platform-side-only derivation process.
   */
  handleIncomingMessages(messagesForIthRound: DeserializedMessages, derivationSeed?: Buffer): DeserializedMessages {
    if (this.dkgState === RedPallasDkgState.Complete) {
      throw Error('DKG session already completed');
    }
    if (this.dkgState === RedPallasDkgState.Uninitialized) {
      throw Error('DKG session not initialized');
    }
    if (this.dkgState === RedPallasDkgState.Init) {
      throw Error(
        'DKG session must call getFirstMessage() before handling incoming messages. Call getFirstMessage() first.'
      );
    }
    if (messagesForIthRound.length !== this.n) {
      throw Error('Invalid number of messages for the round. Number of messages should be equal to N');
    }

    // Extract other parties' messages, sorted by party index (ascending)
    const otherMsgs = messagesForIthRound
      .filter((m) => m.from !== this.partyIdx)
      .sort((a, b) => a.from - b.from)
      .map((m) => m.payload);

    const wasm = this.getWasmMps();

    if (this.dkgState === RedPallasDkgState.WaitMsg1) {
      let result: MsgState;
      try {
        result = wasm.redpallas_dkg_round1_process(otherMsgs, this.dkgStateBytes!);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dkgState}: ${err}`);
      }
      // Store new state; this is what would be persisted between API rounds / microSD exchanges
      this.dkgStateBytes = Buffer.from(result.state);
      this.dkgState = RedPallasDkgState.WaitMsg2;
      return [{ payload: new Uint8Array(result.msg), from: this.partyIdx }];
    }

    if (this.dkgState === RedPallasDkgState.WaitMsg2) {
      if (!derivationSeed || derivationSeed.length !== 32) {
        throw Error('Missing or invalid derivationSeed: must be 32 bytes (required for round2)');
      }
      let result: MsgDerivationInit;
      try {
        result = wasm.redpallas_dkg_round2_process(otherMsgs, this.dkgStateBytes!, derivationSeed);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dkgState}: ${err}`);
      }
      this.keyShare = Buffer.from(result.share);
      this.sharePk = Buffer.from(result.pk);
      this.dkgStateBytes = null;
      this.dkgState = RedPallasDkgState.Complete;
      return [];
    }

    throw Error('Unexpected DKG state');
  }

  /**
   * Returns the opaque bincode-serialised keyshare produced by round2.
   * This is used as input to the (platform-side) signing and derivation protocols.
   */
  getKeyShare(): Buffer {
    if (!this.keyShare) {
      throw Error('DKG session not initialized');
    }
    return this.keyShare;
  }

  /**
   * Returns the RedPallas public key (verification key) agreed by all parties during DKG.
   */
  getSharePublicKey(): Buffer {
    if (!this.sharePk) {
      throw Error('DKG session not initialized');
    }
    return this.sharePk;
  }

  /**
   * Returns a CBOR-encoded ReducedKeyShare buffer containing the party's opaque
   * signing key share in the `keyShare` field. This buffer is private key material.
   * The caller encrypts it and stores it as `reducedEncryptedPrv` on the key card QR code.
   */
  getReducedKeyShare(): Buffer {
    if (!this.keyShare || !this.sharePk) {
      throw Error('DKG session not initialized');
    }
    const reducedKeyShare: RedPallasReducedKeyShare = {
      keyShare: Array.from(this.keyShare),
      pub: Array.from(this.sharePk),
    };
    return Buffer.from(encode(reducedKeyShare));
  }

  /**
   * Exports the current session state as a JSON string for persistence.
   * Includes: round state bytes, current DKG round, decryption key, other parties' pub keys.
   * This mirrors what a server would store in a database between API rounds.
   */
  getSession(): string {
    if (this.dkgState === RedPallasDkgState.Complete) {
      throw Error('DKG session is complete. Exporting the session is not allowed.');
    }
    if (this.dkgState === RedPallasDkgState.Uninitialized) {
      throw Error('DKG session not initialized');
    }
    return JSON.stringify({
      dkgStateBytes: this.dkgStateBytes?.toString('base64') ?? null,
      dkgRound: this.dkgState,
      decryptionKey: this.decryptionKey?.toString('base64') ?? null,
      otherPubKeys: this.otherPubKeys?.map((k) => k.toString('base64')) ?? null,
    });
  }

  /**
   * Restores a previously exported session. Allows the protocol to continue
   * from where it left off, as if the round state was loaded from a database.
   */
  restoreSession(session: string): void {
    const data = JSON.parse(session);
    this.dkgStateBytes = data.dkgStateBytes ? Buffer.from(data.dkgStateBytes, 'base64') : null;
    this.dkgState = data.dkgRound;
    this.decryptionKey = data.decryptionKey ? Buffer.from(data.decryptionKey, 'base64') : null;
    this.otherPubKeys = data.otherPubKeys ? (data.otherPubKeys as string[]).map((k) => Buffer.from(k, 'base64')) : null;
  }
}
