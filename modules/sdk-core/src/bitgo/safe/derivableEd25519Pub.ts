/**
 * Ed25519 safe-root public derivation material and Stellar user-key codecs.
 *
 * Safe backup and BitGo roots store raw public key (32 bytes) || raw chain code (32 bytes),
 * encoded together as canonical unpadded RFC 4648 base32. Coin-specific public-key encodings are
 * applied only to derived wallet children.
 *
 * The pure codecs + composite-pub encoding moved to @bitgo/sdk-lib-safes. Only the WASM
 * soft-derivation remains here (it needs Ed25519BIP32/Eddsa, which live in sdk-core).
 */

import { createHash } from 'crypto';
import {
  Ed25519BIP32,
  Eddsa,
  bigIntFromBufferBE,
  bigIntFromBufferLE,
  bigIntToBufferBE,
  bigIntToBufferLE,
  clamp,
} from '../../account-lib';
import {
  assertBip32Path,
  decodeDerivableEd25519Pub,
  decodeEd25519ChainCode,
  decodeEd25519StrKeySecretSeed,
} from '@bitgo/sdk-lib-safes';

/** Ed25519 extended-key halves + public point, parameterised by encoding (Buffer raw, string hex). */
export type Ed25519ExtendedKeyParts<T> = {
  readonly kL: T; // clamped signing scalar
  readonly kR: T; // nonce prefix
  readonly pub: T; // 32-byte public key
};

let eddsaPromise: Promise<Eddsa> | undefined;
function getEddsa(): Promise<Eddsa> {
  if (!eddsaPromise) {
    eddsaPromise = (async () => Eddsa.initialize(await Ed25519BIP32.initialize()))();
    eddsaPromise.catch(() => {
      eddsaPromise = undefined;
    });
  }
  return eddsaPromise;
}

/** Soft-derive an unhardened path and return the derived raw 32-byte public key. */
export async function softDeriveChildPubEd25519AtPath(compositePub: string, path: string): Promise<Buffer> {
  assertBip32Path(path, { hardened: false });
  const { pub, chainCode } = decodeDerivableEd25519Pub(compositePub);
  const eddsa = await getEddsa();
  return Buffer.from(eddsa.deriveUnhardened(Buffer.concat([pub, chainCode]).toString('hex'), path).slice(0, 64), 'hex');
}

/** Soft-derive `m/<index>` and return the derived raw 32-byte public key. */
export async function softDeriveChildPubEd25519(compositePub: string, index: number): Promise<Buffer> {
  if (!Number.isInteger(index) || index < 0 || index > 0x7fffffff) {
    throw new Error(`ed25519 safe co-signer derivation index must be non-hardened, got ${index}`);
  }
  return softDeriveChildPubEd25519AtPath(compositePub, `m/${index}`);
}

/**
 * Soft-derive an ed25519 co-signer child at an unhardened path, returning the private
 * extended-key material — the clamped scalar `kL`, the nonce prefix `kR`, and the matching
 * public point — from a root secret seed plus the root chain code carried on the keycard.
 */
export async function softDeriveChildPrvEd25519AtPath(params: {
  seedStrKey: string;
  chainCode: string;
  path: string;
}): Promise<Ed25519ExtendedKeyParts<Buffer>> {
  const { seedStrKey, chainCode, path } = params;
  assertBip32Path(path, { hardened: false });
  const seed = decodeEd25519StrKeySecretSeed(seedStrKey);
  const chainCodeBuf = decodeEd25519ChainCode(chainCode);
  const eddsa = await getEddsa();
  const h = createHash('sha512').update(seed).digest();
  const sk = clamp(bigIntFromBufferLE(h.subarray(0, 32)));
  const prefix = bigIntFromBufferBE(h.subarray(32));
  const pk = Eddsa.curve.basePointMult(sk);
  if (!eddsa.hdTree) {
    throw new Error('Eddsa HD tree is not initialized');
  }
  const derived = eddsa.hdTree.privateDerive({ pk, sk, prefix, chaincode: bigIntFromBufferBE(chainCodeBuf) }, path);
  if (derived.prefix === undefined) {
    throw new Error('soft derivation did not produce a nonce prefix');
  }
  return {
    kL: bigIntToBufferLE(derived.sk, 32),
    kR: bigIntToBufferBE(derived.prefix, 32),
    pub: bigIntToBufferLE(derived.pk, 32),
  };
}
