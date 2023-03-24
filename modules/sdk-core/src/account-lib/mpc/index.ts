import HDTree, { Ed25519BIP32, BIP32 } from './hdTree';
import { EDDSA } from './tss';
import ShamirSecret from './shamir';

export { Ecdsa, ECDSA, Eddsa, EDDSA, rangeProof } from './tss';

export * from './curves';
export * from './util';

type KeyShare = EDDSA.KeyShare;

export { Ed25519BIP32, HDTree, KeyShare, ShamirSecret, BIP32 };
