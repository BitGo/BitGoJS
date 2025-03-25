import { Message, SignSessionOTVariant } from '@silencelaboratories/dkls-wasm-ll-node';
import { DeserializedBroadcastMessage, DeserializedDklsSignature, DeserializedMessages, DsgState } from './types';
import { decode } from 'cbor-x';

type NodeWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-node');
type WebWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-web');
type BundlerWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-bundler');

type DklsWasm = NodeWasmer | WebWasmer | BundlerWasmer;

export class Dsg {
  protected dsgSession: SignSessionOTVariant | undefined;
  protected dsgSessionBytes: Uint8Array;
  private _signature: DeserializedDklsSignature | undefined;
  protected keyShareBytes: Buffer;
  protected messageHash: Buffer;
  protected derivationPath: string;
  protected partyIdx: number;
  protected dsgState: DsgState = DsgState.Uninitialized;
  protected dklsWasm: DklsWasm | null;

  constructor(
    keyShare: Buffer,
    partyIdx: number,
    derivationPath: string,
    messageHash: Buffer,
    dklsWasm?: BundlerWasmer
  ) {
    this.partyIdx = partyIdx;
    this.keyShareBytes = keyShare;
    this.derivationPath = derivationPath;
    this.messageHash = messageHash;
    this.dklsWasm = dklsWasm ?? null;
  }

  private _restoreSession() {
    if (!this.dsgSession) {
      this.dsgSession = this.getDklsWasm().SignSessionOTVariant.fromBytes(this.dsgSessionBytes);
    }
  }

  private _deserializeState() {
    if (!this.dsgSession) {
      throw Error('Session not intialized');
    }
    const round = decode(this.dsgSession.toBytes()).round;
    switch (round) {
      case 'WaitMsg1':
        this.dsgState = DsgState.Round1;
        break;
      case 'WaitMsg2':
        this.dsgState = DsgState.Round2;
        break;
      case 'WaitMsg3':
        this.dsgState = DsgState.Round3;
        break;
      case 'Ended':
        this.dsgState = DsgState.Complete;
        break;
      default:
        this.dsgState = DsgState.InvalidState;
        throw Error(`Invalid State: ${round}`);
    }
  }

  private async loadDklsWasm(): Promise<void> {
    if (!this.dklsWasm) {
      this.dklsWasm = await import('@silencelaboratories/dkls-wasm-ll-node');
    }
  }

  private getDklsWasm() {
    if (!this.dklsWasm) {
      throw Error('DKLS wasm not loaded');
    }

    return this.dklsWasm;
  }

  /**
   * Returns the current DSG session as a base64 string.
   * @returns {string} - base64 string of the current DSG session
   */
  getSession(): string {
    return Buffer.from(this.dsgSessionBytes).toString('base64');
  }

  /**
   * Sets the DSG session from a base64 string.
   * @param {string} session - base64 string of the DSG session
   */
  async setSession(session: string): Promise<void> {
    this.dsgSession = undefined;
    if (!this.dklsWasm) {
      await this.loadDklsWasm();
    }
    const sessionBytes = new Uint8Array(Buffer.from(session, 'base64'));
    const round = decode(sessionBytes).round;
    switch (true) {
      case round === 'WaitMsg1':
        this.dsgState = DsgState.Round1;
        break;
      case round === 'WaitMsg2':
        this.dsgState = DsgState.Round2;
        break;
      case round === 'WaitMsg3':
        this.dsgState = DsgState.Round3;
        break;
      case 'WaitMsg4' in round:
        this.dsgState = DsgState.Round4;
        break;
      default:
        throw Error(`Invalid State: ${round}`);
    }
    this.dsgSessionBytes = sessionBytes;
  }

  async init(): Promise<DeserializedBroadcastMessage> {
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
      const initDkls = await import('@silencelaboratories/dkls-wasm-ll-web');
      await initDkls.default();
    }
    const { Keyshare, SignSessionOTVariant } = this.getDklsWasm();
    const keyShare = Keyshare.fromBytes(this.keyShareBytes);
    if (keyShare.partyId !== this.partyIdx) {
      throw Error(`Party index: ${this.partyIdx} does not match key share partyId: ${keyShare.partyId} `);
    }
    this.dsgSession = new SignSessionOTVariant(keyShare, this.derivationPath);
    try {
      const payload = this.dsgSession.createFirstMessage().payload;
      this._deserializeState();
      this.dsgSessionBytes = this.dsgSession.toBytes();
      this.dsgSession = undefined;
      return {
        payload: payload,
        from: this.partyIdx,
      };
    } catch (e) {
      throw Error(`Error while creating the first message from party ${this.partyIdx}: ${e}`);
    }
  }

  get signature(): DeserializedDklsSignature {
    if (!this._signature) {
      throw Error('Can not request signature. Signature not produced yet.');
    }
    return this._signature;
  }

  /**
   * Ends the DSG session by freeing any heap allocations from wasm. Note that the session is freed if a signature is produced.
   */
  endSession(): void {
    if (this._signature) {
      new Error('Session already ended because combined signature was produced.');
    }
    if (this.dsgSession) {
      this.dsgSession.free();
    }
    this.dsgState = DsgState.Uninitialized;
  }

  /**
   * Proccesses incoming messages to this party in the DKLs DSG protocol and
   * produces messages from this party to other parties for the next round.
   * @param messagesForIthRound - messages to process the current round
   * @returns {DeserializedMessages} - messages to send to other parties for the next round
   */
  handleIncomingMessages(messagesForIthRound: DeserializedMessages): DeserializedMessages {
    let nextRoundMessages: Message[] = [];
    let nextRoundDeserializedMessages: DeserializedMessages = { broadcastMessages: [], p2pMessages: [] };
    this._restoreSession();
    if (!this.dsgSession) {
      throw Error('Session not initialized');
    }
    const { Message } = this.getDklsWasm();
    try {
      if (this.dsgState === DsgState.Round4) {
        this.dsgState = DsgState.Complete;
        const combineResult = this.dsgSession.combine(
          messagesForIthRound.broadcastMessages.map((m) => new Message(m.payload, m.from, undefined))
        );
        this._signature = {
          R: combineResult[0],
          S: combineResult[1],
        };
        return { broadcastMessages: [], p2pMessages: [] };
      } else {
        nextRoundMessages = this.dsgSession.handleMessages(
          messagesForIthRound.broadcastMessages
            .map((m) => new Message(m.payload, m.from, undefined))
            .concat(messagesForIthRound.p2pMessages.map((m) => new Message(m.payload, m.from, m.to)))
        );
      }
      if (this.dsgState === DsgState.Round3) {
        nextRoundMessages = [this.dsgSession.lastMessage(this.messageHash)];
        this.dsgState = DsgState.Round4;
        return {
          broadcastMessages: [
            {
              payload: nextRoundMessages[0].payload,
              from: nextRoundMessages[0].from_id,
              signatureR: decode(this.dsgSession.toBytes()).round.WaitMsg4.r,
            },
          ],
          p2pMessages: [],
        };
      } else {
        // Update round data.
        this._deserializeState();
      }
      nextRoundDeserializedMessages = {
        p2pMessages: nextRoundMessages
          .filter((m) => m.to_id !== undefined)
          .map((m) => {
            if (m.to_id === undefined) {
              throw Error('Invalid P2P message, missing to_id.');
            }
            const p2pReturn = {
              payload: m.payload,
              from: m.from_id,
              to: m.to_id,
            };
            return p2pReturn;
          }),
        broadcastMessages: nextRoundMessages
          .filter((m) => m.to_id === undefined)
          .map((m) => {
            const broadcastReturn = {
              payload: m.payload,
              from: m.from_id,
            };
            return broadcastReturn;
          }),
      };
    } catch (e) {
      if (e.message.startsWith('Abort the protocol and ban')) {
        throw Error(
          'Signing aborted. Please stop all transaction signing from this wallet and contact support@bitgo.com.'
        );
      }
      throw Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dsgState}: ${e}`);
    } finally {
      nextRoundMessages.forEach((m) => m.free());
      // Session is freed when combine is called.
      if (this.dsgState !== DsgState.Complete) {
        this.dsgSessionBytes = this.dsgSession.toBytes();
        this.dsgSession = undefined;
      }
    }
    return nextRoundDeserializedMessages;
  }
}
