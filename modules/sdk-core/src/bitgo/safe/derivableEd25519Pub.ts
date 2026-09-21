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

import { Ed25519BIP32, Eddsa } from '../../account-lib';
import { decodeDerivableEd25519Pub } from '@bitgo/sdk-lib-safes';

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

/** Soft-derive `m/<index>` and return the derived raw 32-byte public key. */
export async function softDeriveChildPubEd25519(compositePub: string, index: number): Promise<Buffer> {
  if (!Number.isInteger(index) || index < 0 || index > 0x7fffffff) {
    throw new Error(`ed25519 safe co-signer derivation index must be non-hardened, got ${index}`);
  }
  const { pub, chainCode } = decodeDerivableEd25519Pub(compositePub);
  const eddsa = await getEddsa();
  return Buffer.from(
    eddsa.deriveUnhardened(Buffer.concat([pub, chainCode]).toString('hex'), `m/${index}`).slice(0, 64),
    'hex'
  );
}
