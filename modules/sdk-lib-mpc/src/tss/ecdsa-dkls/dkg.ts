import { KeygenSession, Keyshare, Message } from '@silencelaboratories/dkls-wasm-ll-node';
import { DeserializedBroadcastMessage, DeserializedMessages, DkgState, RetrofitData } from './types';
import { decode } from 'cbor';
import { encode } from 'cbor-x';
import { bigIntToBufferBE } from '../../util';
import { Secp256k1Curve } from '../../curves';

export class Dkg {
  protected dkgSession: KeygenSession | undefined;
  protected dkgSessionBytes: Uint8Array;
  protected dkgKeyShare: Keyshare;
  protected keyShareBuff: Buffer;
  protected n: number;
  protected t: number;
  protected chainCodeCommitment: Uint8Array | undefined;
  protected partyIdx: number;
  protected dkgState: DkgState = DkgState.Uninitialized;
  protected dklsKeyShareRetrofitObject: Keyshare | undefined;

  constructor(n: number, t: number, partyIdx: number, retrofitData?: RetrofitData) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.chainCodeCommitment = undefined;
    if (retrofitData) {
      if (!retrofitData.xShare.y || !retrofitData.xShare.chaincode || !retrofitData.xShare.x) {
        throw Error('xShare must have a public key, private share value, and a chaincode.');
      }
      if (n !== 3 || t !== 2) {
        throw Error('only 2 of 3 retrofit is supported.');
      }
      if (retrofitData.bigSiList.length !== 2) {
        throw Error("bigSiList should contain the other parties' Si's");
      }
      const bigSList: Array<Array<number>> = [];
      let j = 0;
      for (let i = 0; i < n; i++) {
        if (i === partyIdx) {
          const secp256k1 = new Secp256k1Curve();
          bigSList.push(Array.from(bigIntToBufferBE(secp256k1.basePointMult(BigInt('0x' + retrofitData.xShare.x)))));
        } else {
          bigSList.push(Array.from(Buffer.from(retrofitData.bigSiList[j], 'hex')));
          j++;
        }
      }
      const x_i_list = [new Array(32).fill(0), new Array(32).fill(0), new Array(32).fill(0)];
      x_i_list[0][31] = 1;
      x_i_list[1][31] = 2;
      x_i_list[2][31] = 3;
      const dklsKeyShare = {
        total_parties: 3,
        threshold: 2,
        rank_list: [0, 0, 0],
        party_id: partyIdx,
        public_key: Array.from(Buffer.from(retrofitData.xShare.y, 'hex')),
        root_chain_code: Array.from(Buffer.from(retrofitData.xShare.chaincode, 'hex')),
        final_session_id: Array(32).fill(0),
        seed_ot_receivers: [Array(32832).fill(0), Array(32832).fill(0)],
        seed_ot_senders: [Array(32768).fill(0), Array(32768).fill(0)],
        sent_seed_list: [Array(32).fill(0)],
        rec_seed_list: [Array(32).fill(0)],
        s_i: Array.from(Buffer.from(retrofitData.xShare.x, 'hex')),
        big_s_list: bigSList,
        x_i_list: x_i_list,
      };
      this.dklsKeyShareRetrofitObject = Keyshare.fromBytes(encode(dklsKeyShare));
    }
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
    if (typeof window !== 'undefined') {
      const initDkls = require('@silencelaboratories/dkls-wasm-ll-web');
      await initDkls.default();
    }
    if (this.dklsKeyShareRetrofitObject) {
      this.dkgSession = KeygenSession.initKeyRotation(this.dklsKeyShareRetrofitObject);
    } else {
      this.dkgSession = new KeygenSession(this.n, this.t, this.partyIdx);
    }
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
    if (!this.keyShareBuff) {
      throw Error('Can not get key share, DKG is not complete yet.');
    }
    return this.keyShareBuff;
  }

  handleIncomingMessages(messagesForIthRound: DeserializedMessages): DeserializedMessages {
    let nextRoundMessages: Message[] = [];
    let nextRoundDeserializedMessages: DeserializedMessages = { broadcastMessages: [], p2pMessages: [] };
    this._restoreSession();
    if (!this.dkgSession) {
      throw Error('Session not initialized');
    }
    try {
      if (this.dkgState === DkgState.Round3) {
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
      if (this.dkgState === DkgState.Round4) {
        this.dkgKeyShare = this.dkgSession.keyshare();
        if (this.dklsKeyShareRetrofitObject) {
          this.dkgKeyShare.finishKeyRotation(this.dklsKeyShareRetrofitObject);
        }
        this.keyShareBuff = Buffer.from(this.dkgKeyShare.toBytes());
        this.dkgKeyShare.free();
        this.dkgState = DkgState.Complete;
        return { broadcastMessages: [], p2pMessages: [] };
      } else {
        // Update round data.
        this._deserializeState();
      }
      if (this.dkgState === DkgState.Round2) {
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
