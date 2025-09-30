import * as t from 'io-ts';

export const ReducedKeyShareType = t.type({
  rootChainCode: t.array(t.number),
  prv: t.array(t.number),
  pub: t.array(t.number),
});

export type EddsaReducedKeyShare = t.TypeOf<typeof ReducedKeyShareType>;

export interface KeyShareReadable {
  threshold: number;
  total_parties: number;
  party_id: number;
  d_i: string;
  public_key: string;
  key_id: string;
  root_chain_code: string;
  final_session_id: string;
}

type NodeWasmer = typeof import('@silencelaboratories/eddsa-wasm-ll-node');
type WebWasmer = typeof import('@silencelaboratories/eddsa-wasm-ll-web');
export type BundlerWasmer = typeof import('@silencelaboratories/eddsa-wasm-ll-bundler');

export type EddsaDklsWasm = NodeWasmer | WebWasmer | BundlerWasmer;

/**
 * Represents the state of a DKG (Distributed Key Generation) session
 * These states correspond to the internal WASM library states
 */
export enum DkgState {
  /** DKG session has not been initialized */
  Uninitialized = 'Uninitialized',
  /** DKG session has been initialized (Init state in WASM) */
  Init = 'Init',
  /** DKG session is waiting for first message (WaitMsg1 state in WASM) */
  WaitMsg1 = 'WaitMsg1',
  /** DKG session is waiting for second message (WaitMsg2 state in WASM) */
  WaitMsg2 = 'WaitMsg2',
  /** DKG session has generated key shares (Share state in WASM) */
  Share = 'Share',
  /** DKG session has completed successfully and key shares are available */
  Complete = 'Complete',
}
