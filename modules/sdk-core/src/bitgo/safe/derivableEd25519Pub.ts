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
import * as nacl from 'tweetnacl';
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
  readonly kL: T; // signing scalar, reduced mod L
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
 * extended-key material — the reduced-mod-L scalar `kL`, the nonce prefix `kR`, and the matching
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

/**
 * Sign `message` with a BIP32-Ed25519 extended key directly, without a seed.
 *
 * A soft-derived child has no 32-byte seed whose SHA-512 yields `(kL, kR)`, so the
 * seed-based `nacl.sign.keyPair.fromSeed` cannot sign for it. This performs RFC 8032
 * scalar signing straight from the reduced-mod-L scalar `kL` and the nonce prefix `kR`.
 *
 * @param message bytes to sign
 * @param kL 32-byte signing scalar, reduced mod L (little-endian)
 * @param kR 32-byte nonce prefix (big-endian)
 * @returns 64-byte Ed25519 signature `R ‖ S`
 */
export async function signEd25519Extended(message: Buffer, kL: Buffer, kR: Buffer): Promise<Buffer> {
  if (kL.length !== 32) {
    throw new Error(`Invalid Ed25519 extended key kL length: expected 32 bytes, got ${kL.length}`);
  }
  if (kR.length !== 32) {
    throw new Error(`Invalid Ed25519 extended key kR length: expected 32 bytes, got ${kR.length}`);
  }
  await getEddsa();
  const curve = Eddsa.curve;
  const kLInt = bigIntFromBufferLE(kL);
  const r = curve.scalarReduce(
    bigIntFromBufferLE(
      createHash('sha512')
        .update(Buffer.concat([kR, message]))
        .digest()
    )
  );
  const R = curve.basePointMult(r);
  const A = curve.basePointMult(kLInt);
  const h = curve.scalarReduce(
    bigIntFromBufferLE(
      createHash('sha512')
        .update(Buffer.concat([bigIntToBufferLE(R, 32), bigIntToBufferLE(A, 32), message]))
        .digest()
    )
  );
  const S = curve.scalarAdd(r, curve.scalarMult(h, kLInt));
  return Buffer.concat([bigIntToBufferLE(R, 32), bigIntToBufferLE(S, 32)]);
}

/** An externally-produced Ed25519 signature over a transaction's signing message. */
export type ExternalEd25519Signature = {
  readonly publicKey: string; // raw 32-byte public key (hex)
  readonly signature: string; // raw 64-byte signature (hex)
};

/** Fails fast if a `ExternalEd25519Signature` has malformed hex/lengths. */
export function assertValidExternalEd25519Signature(sig: ExternalEd25519Signature): void {
  if (!/^[0-9a-f]{64}$/i.test(sig.publicKey)) {
    throw new Error('Invalid external Ed25519 public key: expected 32 bytes (64 hex characters)');
  }
  if (!/^[0-9a-f]{128}$/i.test(sig.signature)) {
    throw new Error('Invalid external Ed25519 signature: expected 64 bytes (128 hex characters)');
  }
}

/**
 * A lazily-invoked external Ed25519 signer. Carries the public key up front and produces the
 * signature on demand, once the message it must cover exists — unlike `ExternalEd25519Signature`,
 * which is a pre-made signature. Used for seedless soft-derived backup children whose signature
 * must cover transaction bytes that only exist at `recover()` time.
 */
export type ExternalEd25519Signer = {
  readonly publicKey: string; // raw 32-byte public key (hex)
  readonly sign: (message: Uint8Array) => Promise<{ signature: string }>; // raw 64-byte signature (hex)
};

/** Fails fast if an `ExternalEd25519Signer` is missing or mis-shaped. */
export function assertValidExternalEd25519Signer(signer: ExternalEd25519Signer): void {
  if (!/^[0-9a-f]{64}$/i.test(signer.publicKey)) {
    throw new Error('Invalid external Ed25519 public key: expected 32 bytes (64 hex characters)');
  }
  if (typeof signer.sign !== 'function') {
    throw new Error('Invalid external Ed25519 signer: sign must be a function');
  }
}

/**
 * Calls an `ExternalEd25519Signer` over `message`, fails fast unless the signature is a valid
 * 64-byte (128-hex) signature that verifies against the signer's advertised public key, and
 * returns the hex signature. The cryptographic check lives here — once, shared by every coin —
 * so no caller can inject a well-formed-but-wrong signature into a transaction.
 */
export async function signWithExternalEd25519Signer(
  signer: ExternalEd25519Signer,
  message: Uint8Array
): Promise<string> {
  assertValidExternalEd25519Signer(signer);
  // The signer gets a defensive copy: it must not be able to mutate the authoritative transaction
  // bytes, and the signature is verified against the original message, not whatever the signer
  // received or modified.
  const messageForSigner = Uint8Array.from(message);
  const result = await signer.sign(messageForSigner);
  if (!result || typeof result.signature !== 'string') {
    throw new Error('Invalid external Ed25519 signer: sign must resolve to { signature: string }');
  }
  if (!/^[0-9a-f]{128}$/i.test(result.signature)) {
    throw new Error('Invalid external Ed25519 signature: expected 64 bytes (128 hex characters)');
  }
  const signature = Buffer.from(result.signature, 'hex');
  const publicKey = Buffer.from(signer.publicKey, 'hex');
  if (!nacl.sign.detached.verify(message, signature, publicKey)) {
    throw new Error('Invalid external Ed25519 signer: signature does not verify against its public key');
  }
  return result.signature;
}
