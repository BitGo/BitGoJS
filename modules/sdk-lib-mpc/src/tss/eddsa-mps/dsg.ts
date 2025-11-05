import { BundlerWasmer, EddsaMPSWasm, DsgState, DeserializedMessage } from './types';
import { type SignSession } from '@silencelaboratories/eddsa-wasm-ll-node';
import { decode } from 'cbor-x';

export class DSG {
  protected keyShareBytes: Buffer;
  protected messageHash: Buffer;
  protected derivationPath: string;
  protected partyIdx: number;
  protected dklsWasm: EddsaMPSWasm | null;
  protected dsgSession: SignSession | undefined;
  /** Current state of the DSG session */
  protected dsgState: DsgState = DsgState.Uninitialized;
  constructor(
    keyShare: Buffer,
    partyIdx: number,
    derivationPath: string,
    messageHash: Buffer,
    dklsWasm?: BundlerWasmer
  ) {
    this.keyShareBytes = keyShare;
    this.partyIdx = partyIdx;
    this.derivationPath = derivationPath;
    this.messageHash = messageHash;
    this.dklsWasm = dklsWasm ?? null;
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
   * Ensures that the DSG session is initialized
   *
   * @throws {Error} If DSG session is not initialized
   *
   * @private
   */
  private ensureDsgSessionInitialized(): void {
    if (!this.dsgSession) {
      throw Error('DSG session not initialized');
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
  private getDklsWasm(): EddsaMPSWasm {
    if (!this.dklsWasm) {
      throw Error('EDDSA DKLS wasm not loaded');
    }

    return this.dklsWasm;
  }

  async init() {
    if (this.dsgState !== DsgState.Uninitialized) {
      throw Error('DSG session already initialized');
    }

    if (!this.dklsWasm) {
      await this.loadDklsWasm();
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
    const { SignSession, Keyshare } = this.getDklsWasm();
    const keyShare = Keyshare.fromBytes(this.keyShareBytes);
    this.dsgSession = new SignSession(keyShare, this.messageHash, this.derivationPath);
    this.dsgState = DsgState.Init;
  }

  getFirstMessage(): DeserializedMessage {
    this.ensureDsgSessionInitialized();

    if (this.dsgState !== DsgState.Init) {
      throw Error(`DSG session must be in Init state to get first message, current state: ${this.dsgState}`);
    }

    const message = this.dsgSession!.createFirstMessage();

    // Update state to WaitMsg1 after creating first message
    this.dsgState = DsgState.WaitMsg1;

    return {
      payload: message.payload,
      from: message.from_id,
    };
  }

  handleIncomingMessages(messagesForIthRound: DeserializedMessage[]): DeserializedMessage[] {
    this.ensureDsgSessionInitialized();

    if (this.dsgState === DsgState.Finished) {
      throw Error('DSG session already finished');
    }
    if (![DsgState.WaitMsg1, DsgState.WaitMsg2, DsgState.Partial].includes(this.dsgState)) {
      throw Error(
        `DSG session must be in WaitMsg1, WaitMsg2, or Partial state to handle messages, current state: ${this.dsgState}`
      );
    }

    const { Message } = this.getDklsWasm();
    const nextRoundMessage = this.dsgSession!.handleMessages(
      messagesForIthRound.map((m) => new Message(m.payload, m.from))
    );

    const result = nextRoundMessage.map((m) => ({
      payload: m.payload,
      from: m.from_id,
    }));

    nextRoundMessage.forEach((m) => m.free());

    // Update state based on the result
    if (nextRoundMessage.length === 0) {
      // No more messages to send - protocol is finished
      this.dsgState = DsgState.Finished;
    } else if (this.dsgState === DsgState.WaitMsg1) {
      // Transition from WaitMsg1 to WaitMsg2
      this.dsgState = DsgState.WaitMsg2;
    } else if (this.dsgState === DsgState.WaitMsg2) {
      // Transition from WaitMsg2 to Partial
      this.dsgState = DsgState.Partial;
    }

    return result;
  }

  getSignature(): Buffer {
    this.ensureDsgSessionInitialized();

    if (this.dsgState !== DsgState.Finished) {
      throw Error(`DSG session must be finished to get signature, current state: ${this.dsgState}`);
    }

    const signature = this.dsgSession?.signature() as Uint8Array;
    return Buffer.from(signature);
  }

  endSession() {
    if (this.dsgSession) {
      try {
        this.dsgSession.free();
      } catch (_error) {
        // Session may already be freed after getting signature
        // This is expected behavior, so we can safely ignore this error
      }
      this.dsgSession = undefined;
    }
    this.dsgState = DsgState.Ended;
  }

  getSession(): string {
    return Buffer.from(this.dsgSession!.toBytes()).toString('base64');
  }

  /**
   * Gets the current state of the DSG session
   *
   * @returns The current state of the DSG session
   */
  getState(): DsgState {
    return this.dsgState;
  }

  /**
   * Syncs the internal state with the WASM library state
   *
   * @private
   */
  private syncStateWithWasm(): void {
    if (!this.dsgSession) {
      this.dsgState = DsgState.Uninitialized;
      throw Error('DSG session not initialized');
    }

    try {
      // Get the internal state from the WASM library by serializing and decoding
      const sessionBytes = this.dsgSession.toBytes();
      const wasmState = decode(sessionBytes);

      // Map WASM states to our DsgState enum
      if (wasmState.round?.Init) {
        this.dsgState = DsgState.Init;
      } else if (wasmState.round?.WaitMsg1) {
        this.dsgState = DsgState.WaitMsg1;
      } else if (wasmState.round?.WaitMsg2) {
        this.dsgState = DsgState.WaitMsg2;
      } else if (wasmState.round?.Partial) {
        this.dsgState = DsgState.Partial;
      } else if (wasmState.round?.Finished) {
        this.dsgState = DsgState.Finished;
      } else {
        // Fallback to current state if unknown
        console.warn('Unknown WASM state:', wasmState);
      }
    } catch (error) {
      // If we can't get the state, keep the current state
      console.warn('Failed to sync state with WASM:', error);
    }
  }

  restoreSession(state: string): void {
    const { SignSession } = this.getDklsWasm();
    const dsgSession = SignSession.fromBytes(new Uint8Array(Buffer.from(state, 'base64')));
    this.dsgSession = dsgSession;
    this.syncStateWithWasm();
  }
}
