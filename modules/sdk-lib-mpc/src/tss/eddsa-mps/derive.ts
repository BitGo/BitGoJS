import type { MsgState, Share } from '@bitgo/wasm-mps';
import { encode } from 'cbor-x';
import type { DeserializedMessage, DeserializedMessages, EddsaReducedKeyShare } from './types';

type NodeWasmer = typeof import('@bitgo/wasm-mps');
type WebWasmer = typeof import('@bitgo/wasm-mps/web');
type WasmMps = NodeWasmer | WebWasmer;

export enum DeriveState {
  Uninitialized = 'Uninitialized',
  WaitMsg1 = 'WaitMsg1',
  WaitMsg2 = 'WaitMsg2',
  Complete = 'Complete',
}

/** Two-party hardened Ed25519 derivation using the root signing and VRF shares. */
export class Derive {
  private state = DeriveState.Uninitialized;
  private peerIdx: number | null = null;
  private stateBytes: Buffer | null = null;
  private keyShare: Buffer | null = null;
  private pk: Buffer | null = null;
  private chaincode: Buffer | null = null;
  private wasmMps: WasmMps | null = null;

  constructor(
    private readonly n: number,
    private readonly t: number,
    private readonly partyIdx: number,
    private readonly rootKeyShare: Buffer,
    private readonly vrfKeyShare: Buffer,
    private readonly path: string
  ) {}

  private async loadWasmMps(): Promise<WasmMps> {
    if (!this.wasmMps) {
      if (typeof window !== 'undefined' && !window.process && !window.process?.['type']) {
        // eslint-disable-next-line import/no-internal-modules -- @bitgo/wasm-mps exposes environment-specific subpath exports.
        const webWasm = await import('@bitgo/wasm-mps/web');
        await webWasm.default();
        this.wasmMps = webWasm;
      } else {
        this.wasmMps = await import('@bitgo/wasm-mps');
      }
    }
    return this.wasmMps;
  }

  /** Emits this party's round-zero message. Both parties must use the same hardened path. */
  async initDerive(): Promise<DeserializedMessage> {
    if (this.state !== DeriveState.Uninitialized) {
      throw Error('Derive session already initialized');
    }
    if (
      this.n !== 3 ||
      this.t !== 2 ||
      !Number.isInteger(this.partyIdx) ||
      this.partyIdx < 0 ||
      this.partyIdx >= this.n
    ) {
      throw Error('Invalid parameters for 2-of-3 derivation');
    }
    if (
      !Buffer.isBuffer(this.rootKeyShare) ||
      !this.rootKeyShare.length ||
      !Buffer.isBuffer(this.vrfKeyShare) ||
      !this.vrfKeyShare.length
    ) {
      throw Error('Missing or invalid signing or VRF key share');
    }
    const segments = /^m((?:\/(?:0|[1-9]\d*)')+)$/.exec(this.path);
    if (
      !segments ||
      segments[1]
        .split('/')
        .slice(1)
        .some((segment) => Number(segment.slice(0, -1)) > 0x7fffffff)
    ) {
      throw Error('Expected a hardened derivation path');
    }

    const wasm = await this.loadWasmMps();
    if (this.state !== DeriveState.Uninitialized) {
      throw Error('Derive session already initialized');
    }
    const result: MsgState = wasm.ed25519_hard_derive_round0_process(this.vrfKeyShare, this.rootKeyShare, this.path);
    try {
      const payload = new Uint8Array(result.msg);
      this.stateBytes = Buffer.from(result.state);
      this.state = DeriveState.WaitMsg1;
      return { from: this.partyIdx, payload };
    } finally {
      result.free();
    }
  }

  /** Each round consumes exactly one message from the same other party. */
  handleIncomingMessages(messages: DeserializedMessages): DeserializedMessages {
    if (
      this.state === DeriveState.Uninitialized ||
      this.state === DeriveState.Complete ||
      !this.stateBytes ||
      !this.wasmMps
    ) {
      throw Error('Derive session is not awaiting a peer message');
    }
    if (!Array.isArray(messages) || messages.length !== 1) {
      throw Error('Expected exactly one peer message for derivation');
    }
    const [message] = messages;
    if (
      !message ||
      !Number.isInteger(message.from) ||
      message.from < 0 ||
      message.from >= this.n ||
      message.from === this.partyIdx ||
      (this.peerIdx !== null && message.from !== this.peerIdx) ||
      !(message.payload instanceof Uint8Array) ||
      message.payload.length === 0
    ) {
      throw Error('Invalid derivation peer message');
    }

    if (this.state === DeriveState.WaitMsg1) {
      const result: MsgState = this.wasmMps.ed25519_hard_derive_round1_process(message.payload, this.stateBytes);
      try {
        const payload = new Uint8Array(result.msg);
        const nextState = Buffer.from(result.state);
        this.stateBytes = nextState;
        this.peerIdx = message.from;
        this.state = DeriveState.WaitMsg2;
        return [{ from: this.partyIdx, payload }];
      } finally {
        result.free();
      }
    }

    const result: Share = this.wasmMps.ed25519_hard_derive_round2_process(message.payload, this.stateBytes);
    try {
      const keyShare = Buffer.from(result.share);
      const pk = Buffer.from(result.pk);
      const chaincode = Buffer.from(result.chaincode);
      if (!keyShare.length || pk.length !== 32 || chaincode.length !== 32) {
        throw Error('Invalid derived signing share');
      }
      this.keyShare = keyShare;
      this.pk = pk;
      this.chaincode = chaincode;
      this.stateBytes = null;
      this.state = DeriveState.Complete;
      return [];
    } finally {
      result.free();
    }
  }

  getKeyShare(): Buffer {
    if (!this.keyShare) {
      throw Error('Derive session is not complete');
    }
    return this.keyShare;
  }

  getCommonKeychain(): string {
    if (!this.pk || !this.chaincode) {
      throw Error('Derive session is not complete');
    }
    return this.pk.toString('hex') + this.chaincode.toString('hex');
  }

  /** CBOR signing share only: VRF material must never be carried into the child key card. */
  getReducedKeyShare(): Buffer {
    if (!this.keyShare || !this.pk || !this.chaincode) {
      throw Error('Derive session is not complete');
    }
    const reducedKeyShare: EddsaReducedKeyShare = {
      keyShare: Array.from(this.keyShare),
      pub: Array.from(this.pk),
      rootChainCode: Array.from(this.chaincode),
    };
    return Buffer.from(encode(reducedKeyShare));
  }
}
