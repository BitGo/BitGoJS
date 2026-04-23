import { ed25519_dkg_round0_process, ed25519_dkg_round1_process, ed25519_dkg_round2_process } from '@bitgo/wasm-mps';
import { encode } from 'cbor-x';
import crypto from 'crypto';
import { DeserializedMessage, DeserializedMessages, DkgState, EddsaReducedKeyShare } from './types';

/**
 * EdDSA Distributed Key Generation (DKG) implementation using @bitgo/wasm-mps.
 *
 * State is explicit: each round function returns `{ msg, state }` bytes.
 * The state bytes are stored between rounds and passed to the next round function,
 * mirroring the server-side persistence pattern (state would be serialised to DB).
 *
 * @example
 * ```typescript
 * const dkg = new DKG(3, 2, 0);
 * // X25519 keys come from GPG encryption subkeys (extracted by the orchestrator)
 * dkg.initDkg(myX25519PrivKey, [otherParty1X25519PubKey, otherParty2X25519PubKey]);
 * const msg1 = dkg.getFirstMessage();
 * const msg2s = dkg.handleIncomingMessages(allThreeMsg1s);
 * dkg.handleIncomingMessages(allThreeMsg2s);  // completes DKG
 * const keyShare = dkg.getKeyShare();
 * ```
 */
export class DKG {
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
  /** 32-byte Ed25519 public key from round2 */
  private sharePk: Buffer | null = null;
  /** 32-byte chain code from round2 */
  private shareChaincode: Buffer | null = null;

  protected dkgState: DkgState = DkgState.Uninitialized;

  constructor(n: number, t: number, partyIdx: number) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
  }

  getState(): DkgState {
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
  initDkg(decryptionKey: Buffer, otherEncPublicKeys: Buffer[]): void {
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
    this.dkgState = DkgState.Init;
  }

  /**
   * Runs round0 of the DKG protocol. Returns this party's broadcast message.
   * Stores the round state bytes internally for the next round.
   *
   * @param dkgSeed - Optional 32-byte seed for deterministic DKG output (testing only).
   */
  getFirstMessage(dkgSeed?: Buffer): DeserializedMessage {
    if (this.dkgState !== DkgState.Init) {
      throw Error('DKG session not initialized');
    }

    const seed = dkgSeed ?? crypto.randomBytes(32);
    let result;
    try {
      result = ed25519_dkg_round0_process(this.partyIdx, this.decryptionKey!, this.otherPubKeys!, seed);
    } catch (err) {
      throw new Error(`Error while creating the first message from party ${this.partyIdx}: ${err}`);
    }

    this.dkgStateBytes = Buffer.from(result.state);
    this.dkgState = DkgState.WaitMsg1;
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
   */
  handleIncomingMessages(messagesForIthRound: DeserializedMessages): DeserializedMessages {
    if (this.dkgState === DkgState.Complete) {
      throw Error('DKG session already completed');
    }
    if (this.dkgState === DkgState.Uninitialized) {
      throw Error('DKG session not initialized');
    }
    if (this.dkgState === DkgState.Init) {
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

    if (this.dkgState === DkgState.WaitMsg1) {
      let result;
      try {
        result = ed25519_dkg_round1_process(otherMsgs, this.dkgStateBytes!);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dkgState}: ${err}`);
      }
      // Store new state; this is what would be persisted to DB between API rounds
      this.dkgStateBytes = Buffer.from(result.state);
      this.dkgState = DkgState.WaitMsg2;
      return [{ payload: new Uint8Array(result.msg), from: this.partyIdx }];
    }

    if (this.dkgState === DkgState.WaitMsg2) {
      let share;
      try {
        share = ed25519_dkg_round2_process(otherMsgs, this.dkgStateBytes!);
      } catch (err) {
        throw new Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dkgState}: ${err}`);
      }
      this.keyShare = Buffer.from(share.share);
      this.sharePk = Buffer.from(share.pk);
      this.shareChaincode = Buffer.from(share.chaincode);
      this.dkgStateBytes = null;
      this.dkgState = DkgState.Complete;
      return [];
    }

    throw Error('Unexpected DKG state');
  }

  /**
   * Returns the opaque bincode-serialised keyshare produced by round2.
   * This is used as input to the signing protocol.
   */
  getKeyShare(): Buffer {
    if (!this.keyShare) {
      throw Error('DKG session not initialized');
    }
    return this.keyShare;
  }

  /**
   * Returns the 32-byte Ed25519 public key agreed by all parties during DKG.
   */
  getSharePublicKey(): Buffer {
    if (!this.sharePk) {
      throw Error('DKG session not initialized');
    }
    return this.sharePk;
  }

  /**
   * Returns the 128-char hex common keychain: 64-char public key + 64-char chain code.
   * This matches the format expected by address derivation (Eddsa.deriveUnhardened).
   */
  getCommonKeychain(): string {
    if (!this.sharePk || !this.shareChaincode) {
      throw Error('DKG session not initialized');
    }
    return this.sharePk.toString('hex') + this.shareChaincode.toString('hex');
  }

  /**
   * Returns a CBOR-encoded reduced representation containing the public key.
   */
  getReducedKeyShare(): Buffer {
    if (!this.sharePk) {
      throw Error('DKG session not initialized');
    }
    const reducedKeyShare: EddsaReducedKeyShare = {
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
    if (this.dkgState === DkgState.Complete) {
      throw Error('DKG session is complete. Exporting the session is not allowed.');
    }
    if (this.dkgState === DkgState.Uninitialized) {
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
