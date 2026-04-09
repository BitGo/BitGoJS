import * as t from 'io-ts';
import { PartialSig } from 'bip174/src/lib/interfaces';

/** As returned by https://babylon.nodes.guru/api#/Query/BTCDelegation */
export const Signature = t.type({ pk: t.string, sig: t.string }, 'Signature');

/** As returned by https://babylon.nodes.guru/api#/Query/BTCDelegation */
export const UndelegationResponse = t.type(
  {
    /** Network-formatted transaction hex */
    unbonding_tx_hex: t.string,
    /** List of signatures for the unbonding covenant */
    covenant_unbonding_sig_list: t.array(Signature),
  },
  'UndelegationResponse'
);

export type UndelegationResponse = t.TypeOf<typeof UndelegationResponse>;

/** Converts a gRPC signature to a PartialSig as used by bitcoinjs-lib and utxo-lib */
export function toPartialSig(grpcSig: { pk: string; sig: string }): PartialSig {
  return {
    pubkey: Buffer.from(grpcSig.pk, 'hex'),
    signature: Buffer.from(grpcSig.sig, 'base64'),
  };
}
