/**
 * @prettier
 *
 * @experimental Shared safe child derivation for mint, sign, and recovery.
 *
 * User child (every slot): hardened `m/44'/<coinType>'/<slot>'/<account>'`.
 * Multisig co-signers (backup / BitGo): the soft twin `m/44/<coinType>/<slot>/<account>`.
 * `<coinType>` is statics `bip44CoinType`, `<slot>` is statics `SAFE_ROOT_SLOT_ORDINALS[slot]`,
 * and `<account>` is the safe's per-(slot, coinType) counter.
 *
 * Do not use `derivedFromParentWithSeed` / `deriveKeyWithSeed` (`m/999999/a/b`) —
 * that is the custody hashed path and cannot reproduce a safe child.
 */
import * as t from 'io-ts';
import * as nacl from 'tweetnacl';
import { bip32, BIP32Interface } from '@bitgo/utxo-lib';
import { coins, MAX_BIP32_INDEX, SAFE_ROOT_SLOT_ORDINALS } from '@bitgo/statics';
import type { RootKeyType } from '@bitgo/public-types';
import { Ed25519KeyDeriver } from './ed25519KeyDeriver';
import type { ExternalBackupRoot } from './keycardCodec';
import { decodeEd25519StrKeySecretSeed, encodeEd25519StrKeyPublicKey } from './ed25519Pub';

const HARDENED_BIP44_PATH = /^m\/44'\/(\d+)'\/(\d+)'\/(\d+)'$/;
const SOFT_BIP44_PATH = /^m\/44\/(\d+)\/(\d+)\/(\d+)$/;
const SAFE_SLOT_ORDINALS: readonly number[] = Object.values(SAFE_ROOT_SLOT_ORDINALS);

export interface SafeBip44PathSegments {
  coinType: number;
  slotOrdinal: number;
  account: number;
}

/**
 * Assert `path` is a valid BIP32 path for the given derivation kind. Hardened paths require every
 * segment to carry the `'` marker; soft paths reject it. Every segment must be a non-negative
 * integer at or below {@link MAX_BIP32_INDEX}.
 */
export function assertBip32Path(path: string, opts: { hardened: boolean }): void {
  const re = opts.hardened ? /^m(\/\d+')+$/ : /^m(\/\d+)+$/;
  if (!re.test(path)) {
    throw new Error(`Invalid ${opts.hardened ? 'hardened' : 'soft'} derivation path '${path}'`);
  }
  const outOfRange = path
    .split('/')
    .slice(1)
    .map((segment) => Number(opts.hardened ? segment.slice(0, -1) : segment))
    .some((index) => !Number.isInteger(index) || index < 0 || index > MAX_BIP32_INDEX);
  if (outOfRange) {
    throw new Error(`Invalid ${opts.hardened ? 'hardened' : 'soft'} derivation path '${path}': index out of range`);
  }
}

/**
 * Canonical decimal only: `044` and `44` name one key under two strings, so string-equality
 * path checks (the server's unique index) would treat one child as two.
 */
function parseBip32Index(segment: string): number | undefined {
  const index = Number(segment);
  return Number.isInteger(index) && index <= MAX_BIP32_INDEX && String(index) === segment ? index : undefined;
}

function parseBip44Segments(match: RegExpExecArray | null): SafeBip44PathSegments | undefined {
  if (!match) {
    return undefined;
  }
  const coinType = parseBip32Index(match[1]);
  const slotOrdinal = parseBip32Index(match[2]);
  const account = parseBip32Index(match[3]);
  if (coinType === undefined || slotOrdinal === undefined || account === undefined) {
    return undefined;
  }
  if (!SAFE_SLOT_ORDINALS.includes(slotOrdinal)) {
    return undefined;
  }
  return { coinType, slotOrdinal, account };
}

export interface DerivedFromParentWithHardenedPathBrand {
  readonly DerivedFromParentWithHardenedPath: unique symbol;
}

export interface DerivedFromParentWithSoftPathBrand {
  readonly DerivedFromParentWithSoftPath: unique symbol;
}

/** Safe user-child path `m/44'/<coinType>'/<slot>'/<account>'`; also every MPC child. */
export type DerivedFromParentWithHardenedPath = t.Branded<string, DerivedFromParentWithHardenedPathBrand>;

/** Multisig co-signer path `m/44/<coinType>/<slot>/<account>`, the soft twin of a user-child path. */
export type DerivedFromParentWithSoftPath = t.Branded<string, DerivedFromParentWithSoftPathBrand>;

export function isDerivedFromParentWithHardenedPath(s: string): s is DerivedFromParentWithHardenedPath {
  return parseBip44Segments(HARDENED_BIP44_PATH.exec(s)) !== undefined;
}

export function isDerivedFromParentWithSoftPath(s: string): s is DerivedFromParentWithSoftPath {
  return parseBip44Segments(SOFT_BIP44_PATH.exec(s)) !== undefined;
}

export const DerivedFromParentWithHardenedPath = t.brand(
  t.string,
  (s): s is DerivedFromParentWithHardenedPath => isDerivedFromParentWithHardenedPath(s),
  'DerivedFromParentWithHardenedPath'
);

export const DerivedFromParentWithSoftPath = t.brand(
  t.string,
  (s): s is DerivedFromParentWithSoftPath => isDerivedFromParentWithSoftPath(s),
  'DerivedFromParentWithSoftPath'
);

/**
 * Reads the numeric segments out of a user/MPC child path. Rejects anything else, including a
 * cast soft path: a hardened derive ceremony must never run at, or register, a soft path.
 */
export function parseSafeBip44Path(path: DerivedFromParentWithHardenedPath): SafeBip44PathSegments {
  const segments = parseBip44Segments(HARDENED_BIP44_PATH.exec(path));
  if (segments === undefined) {
    throw new Error(`Invalid safe BIP44 path '${path}'`);
  }
  return segments;
}

/** The `<coinType>` segment for a coin. OFC and fiat coins have none and cannot mint a safe child. */
export function getSafeBip44CoinType(coin: string): number {
  const coinType = coins.get(coin).bip44CoinType;
  if (coinType === undefined) {
    throw new Error(`Coin '${coin}' has no BIP44 coin type and cannot derive a safe child`);
  }
  return coinType;
}

/**
 * Builds the user-child path `m/44'/<coinType>'/<slot>'/<account>'`. `coinType` comes from statics
 * (or the derivation-index response) and `account` from the safe's per-(slot, coinType) counter.
 */
export function buildSafeBip44Path(
  coinType: number,
  slot: RootKeyType,
  account: number
): DerivedFromParentWithHardenedPath {
  const path = `m/44'/${coinType}'/${SAFE_ROOT_SLOT_ORDINALS[slot]}'/${account}'`;
  if (!isDerivedFromParentWithHardenedPath(path)) {
    throw new Error(`Invalid safe BIP44 path segments: coinType=${coinType}, slot=${slot}, account=${account}`);
  }
  return path;
}

/** Strips hardening from every level: the co-signer path paired with a user-child path. */
export function toSoftTwinPath(path: DerivedFromParentWithHardenedPath): DerivedFromParentWithSoftPath {
  const softPath = path.replace(/'/g, '');
  if (!isDerivedFromParentWithSoftPath(softPath)) {
    throw new Error(`Invalid safe BIP44 path '${path}': no soft twin`);
  }
  return softPath;
}

/**
 * The type alone is not enough: a cast path with a soft level on a user child would let the
 * parent xpub plus the child prv recover the root.
 */
function assertHardenedPath(path: string): asserts path is DerivedFromParentWithHardenedPath {
  if (!isDerivedFromParentWithHardenedPath(path)) {
    throw new Error(`Invalid safe child path '${path}': expected m/44'/<coinType>'/<slot>'/<account>'`);
  }
}

export interface SafeHardenedChildKey {
  prv: string;
  pub: string;
  derivationPath: DerivedFromParentWithHardenedPath;
}

function childFromNode(child: BIP32Interface, derivationPath: DerivedFromParentWithHardenedPath): SafeHardenedChildKey {
  if (!child.privateKey) {
    throw new Error(`Failed to derive hardened safe child at ${derivationPath}`);
  }
  return {
    prv: child.toBase58(),
    pub: child.neutered().toBase58(),
    derivationPath,
  };
}

export function deriveSafeChildHardenedFromXprv(
  rootXprv: string,
  path: DerivedFromParentWithHardenedPath
): SafeHardenedChildKey {
  assertHardenedPath(path);
  return childFromNode(bip32.fromBase58(rootXprv).derivePath(path), path);
}

/** Re-derive and assert both results match before the child is registered. */
export function deriveAndSelfCheckSafeChildHardened(
  rootXprv: string,
  path: DerivedFromParentWithHardenedPath
): SafeHardenedChildKey {
  const first = deriveSafeChildHardenedFromXprv(rootXprv, path);
  const second = deriveSafeChildHardenedFromXprv(rootXprv, path);
  if (first.pub !== second.pub || first.prv !== second.prv) {
    throw new Error(`Safe child self-check failed at ${first.derivationPath}: derivation was not deterministic`);
  }
  return first;
}

/**
 * SLIP-0010 hardened derivation of a safe user child from an ed25519 root secret seed.
 *
 * `rootPrv` is a Stellar StrKey `S…` secret seed (what slot-② `ed25519Multisig` user roots store).
 * The derivation reuses the existing SLIP-0010 implementation {@link Ed25519KeyDeriver.derivePath}
 * (hardened-only CKDPriv over the `ed25519 seed` HMAC master), then expands the resulting 32-byte
 * child seed into a keypair with `nacl`. The child `pub` is a bare StrKey `G…`; the `prv` is the
 * raw 32-byte child seed as hex (the seed input a signer needs).
 *
 * Unlike the secp256k1 path, ed25519 hardened derivation needs no chain code — the composite
 * `pub‖chainCode` form is only for SOFT co-signer derivation and is not used here.
 */
export function deriveSafeChildEd25519Hardened(
  rootPrv: string,
  path: DerivedFromParentWithHardenedPath
): SafeHardenedChildKey {
  assertHardenedPath(path);
  const rawSeedHex = decodeEd25519StrKeySecretSeed(rootPrv).toString('hex');
  const childSeed = Ed25519KeyDeriver.derivePath(path, rawSeedHex).key;
  const keyPair = nacl.sign.keyPair.fromSeed(Uint8Array.from(childSeed));
  const pub = encodeEd25519StrKeyPublicKey(Buffer.from(keyPair.publicKey));
  return {
    prv: Buffer.from(childSeed).toString('hex'),
    pub,
    derivationPath: path,
  };
}

export interface SafeSecp256k1ChildTriplet {
  user: { prv: string; pub: string };
  backup: { prv: string; pub: string };
  bitgo: { pub: string };
}

/**
 * Triplet for a safe whose backup root is external: the backup child is pub-only unless the caller
 * supplied the root xprv from their own storage.
 */
export interface SafeSecp256k1ExternalBackupChildTriplet {
  user: { prv: string; pub: string };
  backup: { prv?: string; pub: string };
  bitgo: { pub: string };
}

/**
 * Derives a soft path one level at a time. Unlike `derivePath('m/…')`, which throws "Expected master,
 * got child" on any key that is not depth 0, this works on a root exported at any depth (an HSM or
 * hardware-wallet account xpub).
 */
export function deriveSoftPathRelative(node: BIP32Interface, path: DerivedFromParentWithSoftPath): BIP32Interface {
  assertBip32Path(path, { hardened: false });
  return path
    .split('/')
    .slice(1)
    .reduce((current, segment) => current.derive(Number(segment)), node);
}

/**
 * Derives the slot-① (secp256k1Multisig) child triplet from the keycard roots: the user child at
 * the hardened `path`, the backup and BitGo children at its soft twin.
 *
 * A backup root that is an {@link ExternalBackupRoot} is a public key only. Its child is derived
 * relatively (it is usually not a master key), and is pub-only unless `externalBackupRootPrv` — the
 * caller's own backup xprv — is supplied, in which case the derived private child must match it.
 * Local roots keep the strict master-key derivation.
 */
export function deriveSafeChildTriplet(
  roots: { user: string; backup: string; bitgo: string },
  path: DerivedFromParentWithHardenedPath
): SafeSecp256k1ChildTriplet;
export function deriveSafeChildTriplet(
  roots: { user: string; backup: string | ExternalBackupRoot; bitgo: string },
  path: DerivedFromParentWithHardenedPath,
  opts?: { externalBackupRootPrv?: string }
): SafeSecp256k1ExternalBackupChildTriplet;
export function deriveSafeChildTriplet(
  roots: { user: string; backup: string | ExternalBackupRoot; bitgo: string },
  path: DerivedFromParentWithHardenedPath,
  opts: { externalBackupRootPrv?: string } = {}
): SafeSecp256k1ExternalBackupChildTriplet {
  assertHardenedPath(path);
  const userRoot = bip32.fromBase58(roots.user);
  const bitgoRoot = bip32.fromBase58(roots.bitgo);
  if (userRoot.isNeutered()) {
    throw new Error('deriveSafeChildTriplet: user and backup roots must be private (xprv)');
  }
  if (!bitgoRoot.isNeutered()) {
    throw new Error('deriveSafeChildTriplet: bitgo root must be public (xpub)');
  }
  const softPath = toSoftTwinPath(path);
  const user = userRoot.derivePath(path);
  const bitgo = { pub: bitgoRoot.derivePath(softPath).toBase58() };
  const userChild = { prv: user.toBase58(), pub: user.neutered().toBase58() };

  if (typeof roots.backup === 'string') {
    const backupRoot = bip32.fromBase58(roots.backup);
    if (backupRoot.isNeutered()) {
      throw new Error('deriveSafeChildTriplet: user and backup roots must be private (xprv)');
    }
    const backup = backupRoot.derivePath(softPath);
    return { user: userChild, backup: { prv: backup.toBase58(), pub: backup.neutered().toBase58() }, bitgo };
  }

  const externalRoot = bip32.fromBase58(roots.backup.pub);
  if (!externalRoot.isNeutered()) {
    throw new Error('deriveSafeChildTriplet: external backup root must be public (xpub)');
  }
  const backupPub = deriveSoftPathRelative(externalRoot, softPath).toBase58();
  if (opts.externalBackupRootPrv === undefined) {
    return { user: userChild, backup: { pub: backupPub }, bitgo };
  }
  const prvRoot = bip32.fromBase58(opts.externalBackupRootPrv);
  if (prvRoot.isNeutered()) {
    throw new Error('deriveSafeChildTriplet: externalBackupRootPrv must be private (xprv)');
  }
  const backupPrvChild = deriveSoftPathRelative(prvRoot, softPath);
  if (backupPrvChild.neutered().toBase58() !== backupPub) {
    throw new Error('deriveSafeChildTriplet: externalBackupRootPrv does not match the external backup root pub');
  }
  return { user: userChild, backup: { prv: backupPrvChild.toBase58(), pub: backupPub }, bitgo };
}
