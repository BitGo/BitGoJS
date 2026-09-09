/**
 * @prettier
 *
 * @experimental Shared safe child derivation for mint and sign.
 *
 * User child: hardened `m/<index>'` from the sequential `safe.derivationIndex[slot]`.
 * Backup / BitGo children are soft-derived server-side at `m/<index>` (not here).
 *
 * Do not use `derivedFromParentWithSeed` / `deriveKeyWithSeed` (`m/999999/a/b`) —
 * that is the custody hashed path and cannot reproduce a safe child.
 */
import * as t from 'io-ts';
import * as nacl from 'tweetnacl';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
import { Ed25519KeyDeriver } from '../../account-lib/util/ed25519KeyDeriver';
import { decodeWithCodec } from '../utils/codecs';
import { decodeEd25519StrKeySecretSeed, encodeEd25519StrKeyPublicKey } from './derivableEd25519Pub';

const MAX_BIP32_INDEX = 0x7fffffff;
export const DERIVED_FROM_PARENT_WITH_HARDENED_PATH = /^m\/(\d+)'$/;

export function parseSafeDerivationIndex(index: string | number): number {
  let idx: number;
  if (typeof index === 'number') {
    idx = index;
  } else if (/^\d+$/.test(index)) {
    idx = Number(index);
  } else {
    throw new Error(`Invalid safe derivation index '${index}': expected a non-negative integer`);
  }
  if (!Number.isInteger(idx) || idx < 0 || idx > MAX_BIP32_INDEX) {
    throw new Error(`Invalid safe derivation index '${index}': expected a non-negative integer`);
  }
  return idx;
}

export function getSafeHardenedDerivationPath(index: string | number): string {
  return `m/${parseSafeDerivationIndex(index)}'`;
}

export interface DerivedFromParentWithHardenedPathBrand {
  readonly DerivedFromParentWithHardenedPath: unique symbol;
}

export type DerivedFromParentWithHardenedPath = t.Branded<string, DerivedFromParentWithHardenedPathBrand>;

export const DerivedFromParentWithHardenedPath = t.brand(
  t.string,
  (s): s is DerivedFromParentWithHardenedPath => parseDerivedFromParentWithHardenedPathIndex(s) !== undefined,
  'DerivedFromParentWithHardenedPath'
);

function parseDerivedFromParentWithHardenedPathIndex(path: string): number | undefined {
  const match = DERIVED_FROM_PARENT_WITH_HARDENED_PATH.exec(path);
  if (!match) {
    return undefined;
  }
  try {
    return parseSafeDerivationIndex(match[1]);
  } catch {
    return undefined;
  }
}

export function parseDerivedFromParentWithHardenedPath(path: string): number {
  const validated = decodeWithCodec(DerivedFromParentWithHardenedPath, path, 'derivedFromParentWithHardenedPath');
  const index = parseDerivedFromParentWithHardenedPathIndex(validated);
  if (index === undefined) {
    throw new Error(`Invalid derivedFromParentWithHardenedPath '${path}': expected m/<n>'`);
  }
  return index;
}

export interface SafeHardenedChildKey {
  prv: string;
  pub: string;
  derivationPath: string;
}

function childFromNode(child: BIP32Interface, derivationPath: string): SafeHardenedChildKey {
  if (!child.privateKey) {
    throw new Error(`Failed to derive hardened safe child at ${derivationPath}`);
  }
  return {
    prv: child.toBase58(),
    pub: child.neutered().toBase58(),
    derivationPath,
  };
}

export function deriveSafeChildHardenedFromXprv(rootXprv: string, index: string | number): SafeHardenedChildKey {
  const idx = parseSafeDerivationIndex(index);
  const derivationPath = getSafeHardenedDerivationPath(idx);
  return childFromNode(bip32.fromBase58(rootXprv).deriveHardened(idx), derivationPath);
}

/** Re-derive and assert both results match before the child is registered. */
export function deriveAndSelfCheckSafeChildHardened(rootXprv: string, index: string | number): SafeHardenedChildKey {
  const first = deriveSafeChildHardenedFromXprv(rootXprv, index);
  const second = deriveSafeChildHardenedFromXprv(rootXprv, index);
  if (first.pub !== second.pub || first.prv !== second.prv) {
    throw new Error(`Safe child self-check failed at ${first.derivationPath}: derivation was not deterministic`);
  }
  return first;
}

/**
 * SLIP-0010 hardened derivation of a safe user child from an ed25519 root secret seed.
 *
 * `rootPrv` is a Stellar StrKey `S…` secret seed (what slot-④ `ed25519Multisig` user roots store).
 * The derivation reuses the existing SLIP-0010 implementation {@link Ed25519KeyDeriver.derivePath}
 * (hardened-only CKDPriv over the `ed25519 seed` HMAC master), then expands the resulting 32-byte
 * child seed into a keypair with `nacl`. The child `pub` is a bare StrKey `G…`; the `prv` is the
 * raw 32-byte child seed as hex (the seed input a signer needs).
 *
 * Unlike the secp256k1 path, ed25519 hardened derivation needs no chain code — the composite
 * `pub‖chainCode` form is only for SOFT co-signer derivation and is not used here.
 */
export function deriveSafeChildEd25519Hardened(rootPrv: string, index: string | number): SafeHardenedChildKey {
  const idx = parseSafeDerivationIndex(index);
  const derivationPath = getSafeHardenedDerivationPath(idx);
  const rawSeedHex = decodeEd25519StrKeySecretSeed(rootPrv).toString('hex');
  const childSeed = Ed25519KeyDeriver.derivePath(derivationPath, rawSeedHex).key;
  const keyPair = nacl.sign.keyPair.fromSeed(Uint8Array.from(childSeed));
  const pub = encodeEd25519StrKeyPublicKey(Buffer.from(keyPair.publicKey));
  return {
    prv: Buffer.from(childSeed).toString('hex'),
    pub,
    derivationPath,
  };
}
