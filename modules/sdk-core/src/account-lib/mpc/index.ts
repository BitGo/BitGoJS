import HDTree, { Ed25519BIP32, Bip32HdTree } from './hdTree';
import { EDDSA } from './tss';
import ShamirSecret from './shamir';

export { Ecdsa, ECDSA, Eddsa, EDDSA, rangeProof } from './tss';

export * from './curves';
export * from './util';

type KeyShare = EDDSA.KeyShare;

export { Ed25519BIP32, HDTree, KeyShare, ShamirSecret, Bip32HdTree };
