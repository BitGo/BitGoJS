import { HDTree, Ed25519Bip32HdTree, Secp256k1Bip32HdTree } from '@bitgo/sdk-lib-mpc';
import { EDDSA } from './tss';
import ShamirSecret from './shamir';

type KeyShare = EDDSA.KeyShare;

export * from './curves';
export * from './util';
export { Ecdsa, ECDSA, Eddsa, EDDSA, rangeProof } from './tss';
export { Ed25519Bip32HdTree as Ed25519BIP32, HDTree, KeyShare, ShamirSecret, Secp256k1Bip32HdTree as BIP32 };
