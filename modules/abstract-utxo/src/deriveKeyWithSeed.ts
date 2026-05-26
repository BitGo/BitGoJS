import { createHash } from 'crypto';

import type { BIP32 } from '@bitgo/wasm-utxo';

/**
 * Derive a child key from `key` using a path determined by `seed`.
 *
 * Mirrors `BaseCoin.deriveKeyWithSeedBip32` from sdk-core but operates on
 * wasm-utxo's BIP32 class (which has the same `derivePath` semantics).
 */
export function deriveKeyWithSeed(key: BIP32, seed: string): { key: BIP32; derivationPath: string } {
  const sha = (input: string | Buffer): Buffer => createHash('sha256').update(input).digest();
  const derivationPathInput = sha(sha(seed)).toString('hex');
  const derivationPath = `m/999999/${parseInt(derivationPathInput.slice(0, 7), 16)}/${parseInt(
    derivationPathInput.slice(7, 14),
    16
  )}`;
  return { key: key.derivePath(derivationPath), derivationPath };
}
