import HDTree, { Ed25519BIP32 } from './hdTree';
import { EDDSA } from './tss';

export { Ecdsa, ECDSA, Eddsa, EDDSA } from './tss';

export * from './curves';
export * from './util';

type KeyShare = EDDSA.KeyShare;

export { Ed25519BIP32, HDTree, KeyShare };
