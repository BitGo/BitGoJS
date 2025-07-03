import type { KeygenSession, Keyshare, Message } from '@silencelaboratories/dkls-wasm-ll-node';
import { decode, encode } from 'cbor-x';
import { Secp256k1Curve } from '../../curves';
import { bigIntToBufferBE } from '../../util';
import { DeserializedBroadcastMessage, DeserializedMessages, DkgState, ReducedKeyShare, RetrofitData } from './types';

type NodeWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-node');
type WebWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-web');
type BundlerWasmer = typeof import('@silencelaboratories/dkls-wasm-ll-bundler');

type DklsWasm = NodeWasmer | WebWasmer | BundlerWasmer;

export interface DkgSessionData {
  dkgSessionBytes: Uint8Array;
  dkgState: DkgState;
  chainCodeCommitment?: Uint8Array;
  keyShareBuff?: Buffer;
}

export class Dkg {
  protected dkgSession: KeygenSession | undefined;
  protected dkgSessionBytes: Uint8Array;
  protected dkgKeyShare: Keyshare;
  protected keyShareBuff: Buffer;
  protected n: number;
  protected t: number;
  protected seed: Buffer | undefined;
  protected chainCodeCommitment: Uint8Array | undefined;
  protected partyIdx: number;
  protected dkgState: DkgState = DkgState.Uninitialized;
  protected dklsKeyShareRetrofitObject: Keyshare | undefined;
  protected retrofitData: RetrofitData | undefined;
  protected dklsWasm: DklsWasm | null;

  constructor(
    n: number,
    t: number,
    partyIdx: number,
    seed?: Buffer,
    retrofitData?: RetrofitData,
    dklsWasm?: BundlerWasmer
  ) {
    this.n = n;
    this.t = t;
    this.partyIdx = partyIdx;
    this.chainCodeCommitment = undefined;
    this.retrofitData = retrofitData;
    this.seed = seed;
    this.dklsWasm = dklsWasm ?? null;
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

  private _restoreSession() {
    if (!this.dkgSession) {
      this.dkgSession = this.getDklsWasm().KeygenSession.fromBytes(this.dkgSessionBytes);
    }
  }

  private _createDKLsRetrofitKeyShare() {
    if (this.retrofitData) {
      if (!this.retrofitData.xShare.y || !this.retrofitData.xShare.chaincode || !this.retrofitData.xShare.x) {
        throw Error('xShare must have a public key, private share value, and a chaincode.');
      }
      const xiList: Array<Array<number>> = [];
      for (let i = 0; i < this.n; i++) {
        xiList.push(Array.from(bigIntToBufferBE(BigInt(i + 1), 32)));
      }
      const secp256k1 = new Secp256k1Curve();
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
        // big_s_list is now created internally during the protocol so isn't needed here, however a valid KeyShare object needs to have it.
        // a dummy public key is used to fill big_s_list.
        big_s_list: new Array(this.n).fill(
          Array.from(bigIntToBufferBE(secp256k1.basePointMult(BigInt('0x' + this.retrofitData.xShare.x))))
        ),
        x_i_list: this.retrofitData.xiList ? this.retrofitData.xiList : xiList,
      };
      this.dklsKeyShareRetrofitObject = this.getDklsWasm().Keyshare.fromBytes(encode(dklsKeyShare));
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
    if (!this.dklsWasm) {
      await this.loadDklsWasm();
    }
    if (this.t > this.n || this.partyIdx >= this.n) {
      throw Error('Invalid parameters for DKG');
    }
    if (this.dkgState != DkgState.Uninitialized) {
      throw Error('DKG session already initialized');
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
    this._createDKLsRetrofitKeyShare();
    if (this.seed && this.seed.length !== 32) {
      throw Error(`Seed should be 32 bytes, got ${this.seed.length}.`);
    }
    const { KeygenSession } = this.getDklsWasm();
    if (this.dklsKeyShareRetrofitObject) {
      this.dkgSession = this.seed
        ? KeygenSession.initKeyRotation(this.dklsKeyShareRetrofitObject, new Uint8Array(this.seed))
        : KeygenSession.initKeyRotation(this.dklsKeyShareRetrofitObject);
    } else {
      this.dkgSession = this.seed
        ? new KeygenSession(this.n, this.t, this.partyIdx, new Uint8Array(this.seed))
        : new KeygenSession(this.n, this.t, this.partyIdx);
    }
    try {
      const payload = this.dkgSession.createFirstMessage().payload;
      this.dkgSessionBytes = this.dkgSession.toBytes();
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
    const { Message } = this.getDklsWasm();
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
        if (this.dklsKeyShareRetrofitObject) {
          this.dklsKeyShareRetrofitObject.free();
        }
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

  /**
   * Get the current session data that can be used to restore the session later
   * @returns The current session data
   */
  getSessionData(): DkgSessionData {
    const sessionData: DkgSessionData = {
      dkgSessionBytes: this.dkgSessionBytes,
      dkgState: this.dkgState,
    };

    if (this.chainCodeCommitment) {
      sessionData.chainCodeCommitment = this.chainCodeCommitment;
    }

    if (this.keyShareBuff) {
      sessionData.keyShareBuff = this.keyShareBuff;
    }

    return sessionData;
  }

  /**
   * Restore a DKG session from previous session data
   * Note: This should not be used for Round 1 as that's the initialization phase
   * @param n Number of parties
   * @param t Threshold
   * @param partyIdx Party index
   * @param sessionData Previous session data
   * @param seed Optional seed
   * @param retrofitData Optional retrofit data
   * @param dklsWasm Optional DKLS wasm instance
   * @returns A new DKG instance with the restored session
   */
  static async restoreSession(
    n: number,
    t: number,
    partyIdx: number,
    sessionData: DkgSessionData,
    seed?: Buffer,
    retrofitData?: RetrofitData,
    dklsWasm?: BundlerWasmer
  ): Promise<Dkg> {
    const dkg = new Dkg(n, t, partyIdx, seed, retrofitData, dklsWasm);

    if (!dkg.dklsWasm) {
      await dkg.loadDklsWasm();
    }

    dkg.dkgSessionBytes = sessionData.dkgSessionBytes;
    dkg.dkgState = sessionData.dkgState;

    if (sessionData.chainCodeCommitment) {
      dkg.chainCodeCommitment = sessionData.chainCodeCommitment;
    }

    if (sessionData.keyShareBuff) {
      dkg.keyShareBuff = sessionData.keyShareBuff;
    }

    dkg._restoreSession();
    return dkg;
  }
}
