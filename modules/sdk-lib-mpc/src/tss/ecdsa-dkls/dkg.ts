import { KeygenSession, Keyshare, Message } from '@silencelaboratories/dkls-wasm-ll-node';
import { DeserializedBroadcastMessage, DeserializedMessages, DkgState, ReducedKeyShare, RetrofitData } from './types';
import { decode, encode } from 'cbor-x';
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
  protected retrofitData: RetrofitData | undefined;

  constructor(n: number, t: number, partyIdx: number, retrofitData?: RetrofitData) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.chainCodeCommitment = undefined;
    this.retrofitData = retrofitData;
  }

  private _restoreSession() {
    if (!this.dkgSession) {
      this.dkgSession = KeygenSession.fromBytes(this.dkgSessionBytes);
    }
  }

  private _createDKLsRetrofitKeyShare() {
    if (this.retrofitData) {
      if (!this.retrofitData.xShare.y || !this.retrofitData.xShare.chaincode || !this.retrofitData.xShare.x) {
        throw Error('xShare must have a public key, private share value, and a chaincode.');
      }
      if (this.retrofitData.bigSiList.length !== this.n - 1) {
        throw Error("bigSiList should contain the other parties' Si's");
      }
      const bigSList: Array<Array<number>> = [];
      const xiList: Array<Array<number>> = [];
      let j = 0;
      for (let i = 0; i < this.n; i++) {
        if (i === this.partyIdx) {
          const secp256k1 = new Secp256k1Curve();
          bigSList.push(
            Array.from(bigIntToBufferBE(secp256k1.basePointMult(BigInt('0x' + this.retrofitData.xShare.x))))
          );
        } else {
          bigSList.push(Array.from(Buffer.from(this.retrofitData.bigSiList[j], 'hex')));
          j++;
        }
        xiList.push(Array.from(bigIntToBufferBE(BigInt(i + 1), 32)));
      }
      const dklsKeyShare = {
        total_parties: this.n,
        threshold: this.t,
        rank_list: new Array(this.n).fill(0),
        party_id: this.partyIdx,
        public_key: Array.from(Buffer.from(this.retrofitData.xShare.y, 'hex')),
        root_chain_code: Array.from(Buffer.from(this.retrofitData.xShare.chaincode, 'hex')),
        final_session_id: Array(32).fill(0),
        seed_ot_receivers: new Array(this.n - 1).fill(Array(32832).fill(0)),
        seed_ot_senders: new Array(this.n - 1).fill(Array(32768).fill(0)),
        sent_seed_list: [Array(32).fill(0)],
        rec_seed_list: [Array(32).fill(0)],
        s_i: Array.from(Buffer.from(this.retrofitData.xShare.x, 'hex')),
        big_s_list: bigSList,
        x_i_list: this.retrofitData.xiList ? this.retrofitData.xiList : xiList,
      };
      this.dklsKeyShareRetrofitObject = Keyshare.fromBytes(encode(dklsKeyShare));
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
        throw Error(`Invalid State: ${round}`);
    }
  }

  async initDkg(): Promise<DeserializedBroadcastMessage> {
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw Error('Invalid parameters for DKG');
    }
    if (this.dkgState != DkgState.Uninitialized) {
      throw Error('DKG session already initialized');
    }
    if (typeof window !== 'undefined') {
      const initDkls = require('@silencelaboratories/dkls-wasm-ll-web');
      await initDkls.default();
    }
    this._createDKLsRetrofitKeyShare();
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
      throw Error(`Error while creating the first message from party ${this.partyIdx}: ${e}`);
    }
  }

  getKeyShare(): Buffer {
    if (!this.keyShareBuff) {
      throw Error('Can not get key share, DKG is not complete yet.');
    }
    return this.keyShareBuff;
  }

  getReducedKeyShare(): Buffer {
    if (!this.keyShareBuff) {
      throw Error('Can not get key share, DKG is not complete yet.');
    }
    const decodedKeyshare = decode(this.keyShareBuff);
    const reducedKeyShare: ReducedKeyShare = {
      bigSList: decodedKeyshare.big_s_list,
      xList: decodedKeyshare.x_i_list,
      rootChainCode: decodedKeyshare.root_chain_code,
      prv: decodedKeyshare.s_i,
      pub: decodedKeyshare.public_key,
    };
    const encodedKeyShare = encode(reducedKeyShare);
    return encodedKeyShare;
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
      throw Error(`Error while creating messages from party ${this.partyIdx}, round ${this.dkgState}: ${e}`);
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
