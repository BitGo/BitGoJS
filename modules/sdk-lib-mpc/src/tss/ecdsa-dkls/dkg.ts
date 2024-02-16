import { KeygenSession, Keyshare, Message } from '@silencelaboratories/dkls-wasm-ll-node';
import { DeserializedBroadcastMessage, DeserializedMessages, DkgState } from './types';
import { decode } from 'cbor';

export class Dkg {
  protected dkgSession: KeygenSession | undefined;
  protected dkgSessionBytes: Uint8Array;
  protected dkgKeyShare: Keyshare;
  protected n: number;
  protected t: number;
  protected chainCodeCommitment: Uint8Array | undefined;
  protected partyIdx: number;
  protected dkgState: DkgState = DkgState.Uninitialized;

  constructor(n: number, t: number, partyIdx: number) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.chainCodeCommitment = undefined;
  }

  private _restoreSession() {
    if (!this.dkgSession) {
      this.dkgSession = KeygenSession.fromBytes(this.dkgSessionBytes);
    }
  }

  private _deserializeState() {
    if (!this.dkgSession) {
      throw Error('Session not intialized');
    }
    const round = decode(this.dkgSession.toBytes()).round;
    switch (round) {
      case 'WaitMsg1':
        this.dkgState = DkgState.Round1;
        break;
      case 'WaitMsg2':
        this.dkgState = DkgState.Round2;
        break;
      case 'WaitMsg3':
        this.dkgState = DkgState.Round3;
        break;
      case 'WaitMsg4':
        this.dkgState = DkgState.Round4;
        break;
      case 'Ended':
        this.dkgState = DkgState.Complete;
        break;
      default:
        this.dkgState = DkgState.InvalidState;
        throw `Invalid State: ${round}`;
    }
  }

  async initDkg(): Promise<DeserializedBroadcastMessage> {
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw 'Invalid parameters for DKG';
    }
    if (this.dkgState != DkgState.Uninitialized) {
      throw 'DKG session already initialized';
    }
    this.dkgSession = new KeygenSession(this.n, this.t, this.partyIdx);
    try {
      const payload = this.dkgSession.createFirstMessage().payload;
      this._deserializeState();
      return {
        payload: payload,
        from: this.partyIdx,
      };
    } catch (e) {
      throw `Error while creating the first message from party ${this.partyIdx}: ${e}`;
    }
  }

  getKeyShare(): Buffer {
    const keyShareBuff = Buffer.from(this.dkgKeyShare.toBytes());
    this.dkgKeyShare.free();
    return keyShareBuff;
  }

  handleIncomingMessages(messagesForIthRound: DeserializedMessages): DeserializedMessages {
    let nextRoundMessages: Message[] = [];
    let nextRoundDeserializedMessages: DeserializedMessages = { broadcastMessages: [], p2pMessages: [] };
    this._restoreSession();
    if (!this.dkgSession) {
      throw Error('Session not initialized');
    }
    try {
      if (this.dkgState == DkgState.Round3) {
        const commitmentsUnsorted = messagesForIthRound.p2pMessages
          .map((m) => {
            return { from: m.from, commitment: m.commitment };
          })
          .concat([{ from: this.partyIdx, commitment: this.chainCodeCommitment }]);
        const commitmentsSorted = commitmentsUnsorted
          .sort((a, b) => {
            return a.from - b.from;
          })
          .map((c) => c.commitment);
        nextRoundMessages = this.dkgSession.handleMessages(
          messagesForIthRound.broadcastMessages
            .map((m) => new Message(m.payload, m.from, undefined))
            .concat(messagesForIthRound.p2pMessages.map((m) => new Message(m.payload, m.from, m.to))),
          commitmentsSorted
        );
      } else {
        nextRoundMessages = this.dkgSession.handleMessages(
          messagesForIthRound.broadcastMessages
            .map((m) => new Message(m.payload, m.from, undefined))
            .concat(messagesForIthRound.p2pMessages.map((m) => new Message(m.payload, m.from, m.to))),
          undefined
        );
      }
      if (this.dkgState == DkgState.Round4) {
        this.dkgKeyShare = this.dkgSession.keyshare();
        this.dkgState = DkgState.Complete;
        return { broadcastMessages: [], p2pMessages: [] };
      } else {
        // Update ronud data.
        this._deserializeState();
      }
      if (this.dkgState == DkgState.Round3) {
        this.chainCodeCommitment = this.dkgSession.calculateChainCodeCommitment();
      }
      nextRoundDeserializedMessages = {
        p2pMessages: nextRoundMessages
          .filter((m) => m.to_id !== undefined)
          .map((m) => {
            const p2pReturn = {
              payload: m.payload,
              from: m.from_id,
              to: m.to_id!,
              commitment: this.chainCodeCommitment,
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
      throw `Error while creating messages from party ${this.partyIdx}, round ${this.dkgState}: ${e}`;
    } finally {
      nextRoundMessages.forEach((m) => m.free());
      // Session is freed when keyshare is called.
      if (this.dkgState !== DkgState.Complete) {
        this.dkgSessionBytes = this.dkgSession.toBytes();
        this.dkgSession = undefined;
      }
    }
    return nextRoundDeserializedMessages;
  }
}
