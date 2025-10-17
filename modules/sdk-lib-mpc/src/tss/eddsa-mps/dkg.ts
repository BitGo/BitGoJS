import type { EncryptionKeyPair, KeygenSession } from '@silencelaboratories/eddsa-wasm-ll-node';
import { decode, encode } from 'cbor-x';
import { BundlerWasmer, EddsaMPSWasm, EddsaReducedKeyShare, DkgState, DeserializedMessage } from './types';

/**
 * EdDSA Distributed Key Generation (DKG) implementation using multi-Party Schnorr protocol
 *
 * This class handles the complete DKG protocol for EdDSA key generation across multiple parties.
 * It supports both seeded (deterministic) and random key generation.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const dkg = new DKG(3, 2, 0); // 3 parties, threshold 2, party index 0
 * const publicKey = await dkg.getPublicKey();
 * await dkg.initDkg(concatenatedPublicKeys);
 * const firstMessage = dkg.getFirstMessage();
 * const nextMessages = dkg.handleIncomingMessages(incomingMessages);
 * const keyShare = dkg.getKeyShare();
 *
 * // Session persistence
 * const session = dkg.getSession();
 * const restoredDkg = new DKG(3, 2, 0);
 * await restoredDkg.restoreSession(session);
 * ```
 */
export class DKG {
  /** Total number of parties participating in the DKG */
  protected n: number;
  /** Threshold value - minimum number of parties needed to reconstruct the key */
  protected t: number;
  /** Index of this party (0-based) */
  protected partyIdx: number;
  /** WASM module instance for EdDSA operations */
  protected wasm: EddsaMPSWasm | null;
  /** Optional seed for deterministic key generation */
  protected seed: Buffer | undefined;
  /** Encryption key pair for secure communication */
  protected keyPair: EncryptionKeyPair | null;
  /** Public key for the DKG session */
  protected sessionPublicKey: Uint8Array;
  /** Internal DKG session instance */
  protected dkgSession: KeygenSession | null = null;
  /** Cached key share after DKG completion */
  private keyShare: Buffer | null = null;
  /** Current state of the DKG session */
  protected dkgState: DkgState = DkgState.Uninitialized;

  /**
   * Creates a new DKG instance for EdDSA distributed key generation
   *
   * @param n - Total number of parties participating in the DKG (must be > 0)
   * @param t - Threshold value - minimum number of parties needed to reconstruct the key (must be > 0 and <= n)
   * @param partyIdx - Index of this party in the DKG protocol (0-based, must be < n)
   * @param seed - Optional seed for deterministic key generation (32 bytes recommended)
   * @param wasm - Optional WASM module instance
   */
  constructor(n: number, t: number, partyIdx: number, seed?: Buffer, wasm?: BundlerWasmer) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.seed = seed;
    this.wasm = wasm ?? null;
    this.keyPair = null;
  }

  /**
   * Gets the public key for this party
   *
   * @returns The public key as a Uint8Array
   */
  async getPublicKey() {
    if (!this.keyPair) {
      if (!this.wasm) {
        await this.loadWasm();
      }
      await this.initBrowserWasm();
      const { generateEncryptionKeypair } = this.getWasm();
      this.keyPair = generateEncryptionKeypair();
    }
    return this.keyPair.publicKey;
  }

  /**
   * Gets the current state of the DKG session
   * @returns The current DKG state as a DkgState enum value
   */
  getState(): DkgState {
    return this.dkgState;
  }

  /**
   * Initializes the WASM module for browser environments
   * This is only needed for browsers/web because it uses fetch to resolve the wasm asset
   * @private
   */
  private async initBrowserWasm(): Promise<void> {
    /* checks for electron processes */
    if (typeof window !== 'undefined' && !window.process?.['type']) {
      /* This is only needed for browsers/web because it uses fetch to resolve the wasm asset for the web */
      const initMPS = await import('@silencelaboratories/eddsa-wasm-ll-web');
      await initMPS.default();
    }
  }

  /**
   * Loads the EdDSA MPS WASM module if not already loaded
   *
   * @private
   */
  private async loadWasm(): Promise<void> {
    if (!this.wasm) {
      this.wasm = await import('@silencelaboratories/eddsa-wasm-ll-node');
    }
  }

  /**
   * Gets the loaded WASM module instance
   *
   * @returns The WASM module instance
   * @throws {Error} If WASM module is not loaded
   *
   * @private
   */
  private getWasm(): EddsaMPSWasm {
    if (!this.wasm) {
      throw Error('EDDSA MPS wasm not loaded');
    }

    return this.wasm;
  }

  /**
   * Ensures that the DKG session is initialized
   *
   * @throws {Error} If DKG session is not initialized
   *
   * @private
   */
  private ensureDkgSessionInitialized(): void {
    if (!this.dkgSession) {
      throw Error('DKG session not initialized');
    }
  }

  /**
   * Initializes the DKG session with all parties' public keys
   *
   * This method must be called before any message exchange can begin.
   * It sets up the internal DKG session and prepares for the key generation protocol.
   *
   * @param publicKey - Concatenated public keys of all participating parties
   *
   * @throws {Error} If publicKey is missing or invalid
   * @throws {Error} If DKG parameters are invalid (t > n or partyIdx >= n)
   * @throws {Error} If WASM module fails to load
   */
  async initDkg(publicKey: Uint8Array) {
    if (!publicKey) {
      throw Error('Missing all parties public key');
    }
    if (!this.wasm) {
      await this.loadWasm();
    }
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw Error('Invalid parameters for DKG');
    }
    if (!this.keyPair) {
      throw Error('keyPair not initialized for DKG. Use getPublicKey() first.');
    }

    await this.initBrowserWasm();

    const { KeygenSession } = this.getWasm();

    this.dkgSession = new KeygenSession(
      this.n,
      this.t,
      this.partyIdx,
      this.keyPair.secretKey,
      publicKey,
      this.seed ? new Uint8Array(this.seed) : undefined
    );
    this.dkgState = DkgState.Init;
  }

  /**
   * Creates the first message for the DKG protocol
   *
   * This method generates the initial broadcast message that this party will send
   * to all other parties to start the DKG protocol.
   *
   * @returns The first message containing payload and sender information
   *
   * @throws {Error} If DKG session is not initialized
   */
  getFirstMessage(): DeserializedMessage {
    this.ensureDkgSessionInitialized();
    const message = this.dkgSession!.createFirstMessage();
    const returnMessage = {
      payload: message.payload,
      from: message.from_id,
    };
    message.free();
    // Transition from Init to WaitMsg1 after creating first message
    if (this.dkgState === DkgState.Init) {
      this.dkgState = DkgState.WaitMsg1;
    }
    return returnMessage;
  }

  /**
   * Handles incoming messages and generates the next round of messages
   *
   * This method processes messages from other parties and generates the next round
   * of messages to be sent. The DKG protocol typically consists of 2-3 rounds.
   * The method also manages state transitions automatically based on the current state.
   *
   * Valid states for calling this method:
   * - WaitMsg1: After getFirstMessage() has been called
   * - WaitMsg2: After first round of message handling
   * - Share: After second round of message handling
   *
   * State transitions:
   * - WaitMsg1 -> WaitMsg2 (after first message handling)
   * - WaitMsg2 -> Share (after second message handling)
   * - Share -> Complete (when no more messages to send)
   *
   * @param messagesForIthRound - Array of messages received from other parties
   * @returns Array of messages to be sent to other parties in the next round
   *
   * @throws {Error} If DKG session is already completed
   * @throws {Error} If DKG session is not initialized
   * @throws {Error} If DKG session is in Uninitialized state
   * @throws {Error} If DKG session is in Init state (must call getFirstMessage first)
   * @throws {Error} If number of messages doesn't match expected count (n)
   */
  handleIncomingMessages(messagesForIthRound: DeserializedMessage[]): DeserializedMessage[] {
    if (this.dkgState === DkgState.Complete) {
      throw Error('DKG session already completed');
    }
    this.ensureDkgSessionInitialized();

    // Check that we're in a valid state to handle messages
    if (this.dkgState === DkgState.Uninitialized) {
      throw Error('DKG session must be initialized before handling messages. Call initDkg() first.');
    }
    if (this.dkgState === DkgState.Init) {
      throw Error(
        'DKG session must call getFirstMessage() before handling incoming messages. Call getFirstMessage() first.'
      );
    }

    if (messagesForIthRound.length !== this.n) {
      throw Error('Invalid number of messages for the round. Number of messages should be equal to N');
    }

    const { Message } = this.getWasm();
    const nextRoundMessage = this.dkgSession!.handleMessages(
      messagesForIthRound.map((m) => new Message(m.payload, m.from))
    );

    const result = nextRoundMessage.map((m) => ({
      payload: m.payload,
      from: m.from_id,
    }));

    // Clean up WASM objects
    nextRoundMessage.forEach((m) => m.free());

    // Update state based on the current state and message handling
    if (this.dkgState === DkgState.WaitMsg1) {
      this.dkgState = DkgState.WaitMsg2;
    } else if (this.dkgState === DkgState.WaitMsg2) {
      this.dkgState = DkgState.Share;
    }

    // Check if this is the final round (round 2 in EdDSA DKG)
    if (nextRoundMessage.length === 0) {
      this.dkgState = DkgState.Complete;
    }

    return result;
  }

  /**
   * Gets the key share for this party
   *
   * This method returns the EdDSA key share that was generated during the DKG protocol.
   * The key share can be used for signing operations and must be kept secure.
   *
   * @returns The key share as a Buffer containing the serialized key data
   *
   * @throws {Error} If DKG session is not initialized
   * @throws {Error} If DKG session is not complete
   */
  getKeyShare(): Buffer {
    this.ensureDkgSessionInitialized();
    if (this.dkgState !== DkgState.Complete) {
      throw Error('DKG session is not complete');
    }
    if (this.keyShare) {
      return this.keyShare;
    }
    const keyShare = this.dkgSession!.keyshare();
    this.keyShare = Buffer.from(keyShare.toBytes());
    return this.keyShare;
  }

  /**
   * Gets the reduced key share for this party
   *
   * This method returns a simplified version of the key share containing only
   * the essential information needed for signing operations. The reduced key share
   * is more compact and contains only the private key material, public key, and root chain code.
   *
   * @returns The reduced key share as a Buffer containing the serialized reduced key data
   *
   * @throws {Error} If DKG session is not initialized or complete
   */
  getReducedKeyShare(): Buffer {
    const shareBuffer = this.getKeyShare();
    const decodedKeyshare = decode(shareBuffer);
    const reducedKeyShare: EddsaReducedKeyShare = {
      rootChainCode: decodedKeyshare.root_chain_code,
      prv: decodedKeyshare.d_i,
      pub: decodedKeyshare.public_key,
    };
    return encode(reducedKeyShare);
  }

  /**
   * Syncs the internal DKG state with the WASM library state
   *
   * This method examines the current WASM session state and updates the internal
   * DKG state to match. This ensures that the internal state accurately reflects
   * the actual state of the underlying WASM library, which is important for
   * debugging and maintaining state consistency.
   *
   * The method maps WASM states to internal DkgState enum values:
   * - Init -> DkgState.Init
   * - WaitMsg1 -> DkgState.WaitMsg1
   * - WaitMsg2 -> DkgState.WaitMsg2
   * - Share -> DkgState.Share
   *
   * @throws {Error} If DKG session is not initialized
   */
  private syncStateWithWasm(): void {
    this.ensureDkgSessionInitialized();

    if (!this.dkgSession) {
      this.dkgState = DkgState.Uninitialized;
      throw Error('DKG session not initialized');
    }

    // Get the current WASM session state
    const sessionBytes = this.dkgSession.toBytes();
    const wasmState = decode(sessionBytes);
    // Map WASM states to our DkgState enum
    if (wasmState.round?.Init) {
      this.dkgState = DkgState.Init;
    } else if (wasmState.round?.WaitMsg1) {
      this.dkgState = DkgState.WaitMsg1;
    } else if (wasmState.round?.WaitMsg2) {
      this.dkgState = DkgState.WaitMsg2;
    } else if (wasmState.round?.Share) {
      this.dkgState = DkgState.Share;
    }
  }

  /**
   * Exports the current DKG session state as a base64-encoded string
   *
   * This method allows you to save the current DKG session state and restore it later
   * using the restoreSession method. This is useful for implementing session persistence
   * or resuming interrupted DKG protocols.
   *
   * @returns Base64-encoded string representing the current session state
   *
   * @throws {Error} If DKG session is not initialized
   * @throws {Error} If DKG session is complete (sessions cannot be exported after completion)
   */
  getSession(): string {
    this.ensureDkgSessionInitialized();
    if (this.dkgState === DkgState.Complete) {
      throw Error('DKG session is complete. Exporting the session is not allowed.');
    }
    return Buffer.from(this.dkgSession!.toBytes()).toString('base64');
  }

  /**
   * Restores a DKG session from a previously exported session string
   *
   * This method allows you to restore a DKG session that was previously exported
   * using the getSession method. The restored session will be in the same state
   * as when it was exported, allowing you to continue the DKG protocol from that point.
   *
   * @param session - Base64-encoded session string from getSession()
   *
   * @throws {Error} If session string is invalid or malformed
   * @throws {Error} If session cannot be restored due to WASM errors
   * @throws {Error} If WASM module fails to load
   */
  async restoreSession(session: string): Promise<void> {
    if (!this.wasm) {
      await this.loadWasm();
    }
    const { KeygenSession } = this.getWasm();
    this.dkgSession = KeygenSession.fromBytes(new Uint8Array(Buffer.from(session, 'base64')));

    const error = this.dkgSession.error();
    if (error) {
      throw error;
    }

    this.syncStateWithWasm();
  }

  /**
   * Ends the DKG session by freeing any heap allocations from WASM
   *
   * This method should be called when the DKG session is no longer needed
   * to properly clean up WASM resources. After calling this method, the session
   * returns to Uninitialized state.
   */
  endSession(): void {
    try {
      this.dkgSession?.free();
    } catch (error) {
      // Resources may already be freed, ignore errors
    }
    try {
      this.keyPair?.free();
    } catch (error) {
      // Resources may already be freed, ignore errors
    }
    this.dkgSession = null;
    this.keyPair = null;
    this.dkgState = DkgState.Uninitialized;
  }
}
