import {
  generateEncryptionKeypair,
  type EncryptionKeyPair,
  type KeygenSession,
} from '@silencelaboratories/eddsa-wasm-ll-node';
import { decode, encode } from 'cbor-x';
import { BundlerWasmer, EddsaReducedKeyShare, DeserializedMessages, DeserializedMessage } from './types';

/**
 * Represents the state of a DKG (Distributed Key Generation) session
 */
export enum DkgState {
  /** DKG session has not been initialized */
  Uninitialized = 'Uninitialized',
  /** DKG session has been initialized and is ready for message exchange */
  Initialized = 'Initialized',
  /** DKG session has completed successfully and key shares are available */
  Complete = 'Complete',
}

/**
 * EdDSA Distributed Key Generation (DKG) implementation using DKLS protocol
 *
 * This class handles the complete DKG protocol for EdDSA key generation across multiple parties.
 * It supports both seeded (deterministic) and random key generation.
 *
 * @example
 * ```typescript
 * const dkg = new DKG(3, 2, 0); // 3 parties, threshold 2, party index 0
 * const publicKey = dkg.getPublicKey();
 * await dkg.initDkg(concatenatedPublicKeys);
 * const firstMessage = dkg.getFirstMessage();
 * const nextMessages = dkg.handleIncomingMessages(incomingMessages);
 * const keyShare = dkg.getKeyShare();
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
  protected dklsWasm: EddsaDklsWasm | null;
  /** Optional seed for deterministic key generation */
  protected seed: Buffer | undefined;
  /** Encryption key pair for secure communication */
  protected keyPair: EncryptionKeyPair;
  /** Public key for the DKG session */
  protected sessionPublicKey: Uint8Array;
  /** Internal DKG session instance */
  protected dkgSession: KeygenSession | undefined;
  /** Cached key share after DKG completion */
  private keyShare: Buffer | undefined;
  /** Current state of the DKG session */
  protected dkgState: DkgState = DkgState.Uninitialized;

  /**
   * Creates a new DKG instance
   *
   * @param n - Total number of parties participating in the DKG
   * @param t - Threshold value (minimum parties needed to reconstruct the key)
   * @param partyIdx - Index of this party (0-based)
   * @param seed - Optional seed for deterministic key generation
   * @param dklsWasm - Optional WASM module instance (for testing or custom environments)
   *
   * @throws {Error} If n <= 0, t <= 0, t > n, or partyIdx < 0 or >= n
   */
  constructor(n: number, t: number, partyIdx: number, seed?: Buffer, dklsWasm?: BundlerWasmer) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.seed = seed;
    this.dklsWasm = dklsWasm ?? null;
    this.keyPair = generateEncryptionKeypair();
  }

  /**
   * Gets the public key for this party
   *
   * @returns The public key as a Uint8Array
   */
  getPublicKey() {
    return this.keyPair.publicKey;
  }

  /**
   * Gets the current state of the DKG session
   *
   * @returns The current DKG state
   */
  getState(): DkgState {
    return this.dkgState;
  }

  /**
   * Loads the EdDSA DKLS WASM module if not already loaded
   *
   * @private
   */
  private async loadDklsWasm(): Promise<void> {
    if (!this.dklsWasm) {
      this.dklsWasm = await import('@silencelaboratories/eddsa-wasm-ll-node');
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
  private getDklsWasm(): EddsaDklsWasm {
    if (!this.dklsWasm) {
      throw Error('EDDSA DKLS wasm not loaded');
    }

    return this.dklsWasm;
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
    if (!this.dklsWasm) {
      await this.loadDklsWasm();
    }
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw Error('Invalid parameters for DKG');
    }
    if (
      typeof window !== 'undefined' &&
      /* checks for electron processes */
      !window.process &&
      !window.process?.['type']
    ) {
      /* This is only needed for browsers/web because it uses fetch to resolve the wasm asset for the web */
      const initDkls = await import('@silencelaboratories/eddsa-wasm-ll-web');
      await initDkls.default();
    }

    const { KeygenSession } = this.getDklsWasm();

    this.dkgSession = new KeygenSession(
      this.n,
      this.t,
      this.partyIdx,
      this.keyPair.secretKey,
      publicKey,
      this.seed ? new Uint8Array(this.seed) : undefined
    );
    this.dkgState = DkgState.Initialized;
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
    return returnMessage;
  }

  /**
   * Handles incoming messages and generates the next round of messages
   *
   * This method processes messages from other parties and generates the next round
   * of messages to be sent. The DKG protocol typically consists of 2-3 rounds.
   *
   * @param messagesForIthRound - Array of messages received from other parties
   * @returns Array of messages to be sent to other parties in the next round
   *
   * @throws {Error} If DKG session is already completed
   * @throws {Error} If DKG session is not initialized
   * @throws {Error} If number of messages doesn't match expected count (n)
   */
  handleIncomingMessages(messagesForIthRound: DeserializedMessages): DeserializedMessages {
    if (this.dkgState === DkgState.Complete) {
      throw Error('DKG session already completed');
    }
    this.ensureDkgSessionInitialized();
    if (messagesForIthRound.length !== this.n) {
      throw Error('Invalid number of messages for the round. Number of messages should be equal to N');
    }

    const { Message } = this.getDklsWasm();
    const nextRoundMessage = this.dkgSession!.handleMessages(
      messagesForIthRound.map((m) => new Message(m.payload, m.from))
    );

    const result = nextRoundMessage.map((m) => ({
      payload: m.payload,
      from: m.from_id,
    }));

    // Clean up WASM objects
    nextRoundMessage.forEach((m) => m.free());

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
    // this.dkgSession?.free(); // Revisit this
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
}
