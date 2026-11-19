/**
 * @prettier
 *
 * @experimental Safe keycard box codec.
 *
 * Each of Boxes A/B/C on a Safe keycard is a JSON object mapping a root slot name to that slot's key
 * string. It lives in this leaf so sdk-core and WRW can parse a box without depending on key-card,
 * which pulls in PDF/QR libraries and itself depends on sdk-core.
 *
 * A box self-identifies which slots it carries via its keys; any non-empty subset of the four root
 * slots is accepted — a Safe created with only some root slots enabled can still be read back.
 */
import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { JsonFromString } from 'io-ts-types';
import type { RootKeyType } from '@bitgo/public-types';
import { validateJSONAgainstCodec } from './codecs';

/**
 * Identifier for one of a safe's four roots (one per signing scheme). Each value is the
 * root's `rootKeyType`, which is also the key used in the keycard's per-box JSON.
 */
export type SafeRootKeyType = RootKeyType;

/**
 * The JSON object encoded in a safe keycard box (A/B/C): 0–4 roots keyed by
 * {@link SafeRootKeyType}. Values are per-root ciphertext for A/B (encryptedPrv or
 * reducedEncryptedPrv; safe MPC ciphertext decrypts to a versioned signing+VRF envelope) or
 * public keys for C. Any non-empty subset of the four slots is valid, matching partial-slot
 * Safes right after creation (enabledRootSlots). Box B's `ed25519Multisig` entry carries a
 * `{ prv, chainCode }` object (the chain code is independent randomness not recomputable from
 * the seed), and an external backup slot carries `{ kind: 'external', pub }`; every other
 * entry is a bare string.
 */
export const Ed25519ChainCodeEntryCodec = t.type({ prv: t.string, chainCode: t.string });
export type Ed25519ChainCodeEntry = t.TypeOf<typeof Ed25519ChainCodeEntryCodec>;

/**
 * Box B entry for a slot whose backup root is external: the caller (BYOK) or a KRS provider holds the
 * backup private key, so the card carries only the root public key. For `ed25519Multisig` the pub is
 * the derivable composite (`pub32 || chainCode32`), so the chain code survives. `provider` names the
 * KRS provider and is absent for a caller-supplied key. Additive: boxes without it still decode.
 */
export const ExternalBackupEntryCodec = t.intersection([
  t.type({ kind: t.literal('external'), pub: t.string }),
  t.partial({ provider: t.string }),
]);
export type ExternalBackupEntry = t.TypeOf<typeof ExternalBackupEntryCodec>;

/**
 * What `decryptSafeKeycard` returns for an external backup root: there is nothing to decrypt.
 */
export type ExternalBackupRoot = { external: true; pub: string; provider?: string };

export type SafeKeycardRootEntry = string | Ed25519ChainCodeEntry | ExternalBackupEntry;

export type SafeKeycardRoots = Partial<Record<SafeRootKeyType, SafeKeycardRootEntry>>;

const SafeKeycardRootEntryCodec: t.Type<SafeKeycardRootEntry> = t.union([
  t.string,
  Ed25519ChainCodeEntryCodec,
  ExternalBackupEntryCodec,
]);

const safeRootSlotCodecs = {
  secp256k1Multisig: SafeKeycardRootEntryCodec,
  ecdsaMpc: SafeKeycardRootEntryCodec,
  eddsaMpc: SafeKeycardRootEntryCodec,
  ed25519Multisig: SafeKeycardRootEntryCodec,
} satisfies Record<SafeRootKeyType, t.Type<SafeKeycardRootEntry, SafeKeycardRootEntry, unknown>>;

// Canonical slot order shared with key-card's SAFE_ROOT_ORDER; boxes written by
// generateSafeQrData are keyed in this order, so byte-for-byte round-trips preserve it.
const SAFE_ROOT_SLOT_ORDER = Object.keys(safeRootSlotCodecs) as SafeRootKeyType[];

const SafeKeycardRootsCodec: t.Type<SafeKeycardRoots, SafeKeycardRoots, unknown> = t.partial(safeRootSlotCodecs);

/**
 * Parses a safe keycard box value — the JSON packed by key-card's `generateSafeQrData`, e.g.
 * `{"secp256k1Multisig":"…","ed25519Multisig":"…"}` — into the root slots the box declares.
 * Throws if the value is not valid JSON, the box carries no root slots, it names an unknown
 * root key, or a root value is not a bare string, a `{ prv, chainCode }` entry or an external
 * backup entry. Recovery tooling calls this on the A/B/C box value, then decrypts each present
 * root with the safe password. An MPC root value is an opaque versioned envelope; recovery
 * must unwrap its `prvKeyShare` and `vrf` fields instead of treating the decrypted bytes as a
 * bare share.
 */
export function parseSafeKeycardBox(data: string): SafeKeycardRoots {
  const decoded = JsonFromString.decode(data);
  if (E.isLeft(decoded)) {
    // PathReporter, not decodeWithCodec: io-ts errors carry no message, so decodeWithCodec would report only "unknown".
    throw new Error(`parseSafeKeycardBox: ${PathReporter.report(decoded).join('; ')}`);
  }
  const roots = validateJSONAgainstCodec(
    decoded.right,
    SafeKeycardRootsCodec,
    SAFE_ROOT_SLOT_ORDER,
    'parseSafeKeycardBox'
  );
  if (Object.keys(roots).length === 0) {
    throw new Error('parseSafeKeycardBox: empty slot set');
  }
  return roots;
}
