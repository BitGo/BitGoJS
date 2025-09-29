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
