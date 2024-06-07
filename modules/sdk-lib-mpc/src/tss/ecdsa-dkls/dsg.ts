import { SignSession, Keyshare, Message } from '@silencelaboratories/dkls-wasm-ll-node';
import { DeserializedBroadcastMessage, DeserializedDklsSignature, DeserializedMessages, DsgState } from './types';
import { decode } from 'cbor-x';

export class Dsg {
  protected dsgSession: SignSession | undefined;
  protected dsgSessionBytes: Uint8Array;
  private _signature: DeserializedDklsSignature | undefined;
  protected keyShareBytes: Buffer;
  protected messageHash: Buffer;
  protected derivationPath: string;
  protected partyIdx: number;
  protected dsgState: DsgState = DsgState.Uninitialized;

  constructor(keyShare: Buffer, partyIdx: number, derivationPath: string, messageHash: Buffer) {
    this.partyIdx = partyIdx;
    this.keyShareBytes = keyShare;
    this.derivationPath = derivationPath;
    this.messageHash = messageHash;
  }

  private _restoreSession() {
    if (!this.dsgSession) {
      this.dsgSession = SignSession.fromBytes(this.dsgSessionBytes);
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

  async init(): Promise<DeserializedBroadcastMessage> {
    if (this.dsgState !== DsgState.Uninitialized) {
      throw Error('DSG session already initialized');
    }
    if (typeof window !== 'undefined') {
      const initDkls = require('@silencelaboratories/dkls-wasm-ll-web');
      await initDkls.default();
    }
    const keyShare = Keyshare.fromBytes(this.keyShareBytes);
    if (keyShare.partyId !== this.partyIdx) {
      throw Error(`Party index: ${this.partyIdx} does not match key share partyId: ${keyShare.partyId} `);
    }
    this.dsgSession = new SignSession(keyShare, this.derivationPath);
    try {
      const payload = this.dsgSession.createFirstMessage().payload;
      this._deserializeState();
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
    if (this.signature) {
      new Error('Session already ended because combined signature was produced.');
    }
    if (this.dsgSession) {
      this.dsgSession.free();
    }
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
