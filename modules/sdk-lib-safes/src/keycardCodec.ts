/**
 * @prettier
 *
 * @experimental Safe keycard box codec.
 *
 * Each of Boxes A/B/C on a Safe keycard is a JSON object mapping a root slot name to that slot's key
 * string. It lives in this leaf so sdk-core and WRW can parse a box without depending on key-card,
 * which pulls in PDF/QR libraries and itself depends on sdk-core.
 */
import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { JsonFromString } from 'io-ts-types';
import type { RootKeyType } from '@bitgo/public-types';

/**
 * Identifier for one of a safe's four roots (one per signing scheme). Each value is the
 * root's `rootKeyType`, which is also the key used in the keycard's per-box JSON.
 */
export type SafeRootKeyType = RootKeyType;

/**
 * The JSON object encoded in a safe keycard box (A/B/C): the four roots keyed by
 * {@link SafeRootKeyType}. Values are per-root ciphertext for A/B (encryptedPrv or
 * reducedEncryptedPrv; safe MPC ciphertext decrypts to a versioned signing+VRF envelope) or
 * public keys for C. The root-key-type keys are self-identifying, so a
 * consumer parses by key rather than by size/offset. Box B's `ed25519Multisig` entry carries a
 * `{ prv, chainCode }` object (the chain code is independent randomness not recomputable from the
 * seed), and an external backup slot carries `{ kind: 'external', pub }`; every other entry is a
 * bare string.
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

export type SafeKeycardRoots = Record<SafeRootKeyType, SafeKeycardRootEntry>;

const SafeKeycardRootEntryCodec: t.Type<SafeKeycardRootEntry> = t.union([
  t.string,
  Ed25519ChainCodeEntryCodec,
  ExternalBackupEntryCodec,
]);

// Annotating with SafeKeycardRoots makes the compiler reject a key added to or removed from one side only.
const SafeKeycardRootsCodec: t.Type<SafeKeycardRoots> = t.type({
  secp256k1Multisig: SafeKeycardRootEntryCodec,
  ecdsaMpc: SafeKeycardRootEntryCodec,
  eddsaMpc: SafeKeycardRootEntryCodec,
  ed25519Multisig: SafeKeycardRootEntryCodec,
});

// Decodes a box's JSON string straight into the validated roots record.
const SafeKeycardBoxFromString = JsonFromString.pipe(SafeKeycardRootsCodec);

/**
 * Parses a safe keycard box value — the JSON packed by key-card's `generateSafeQrData`, e.g.
 * `{"secp256k1Multisig":"…","ecdsaMpc":"…",…}` — into its four roots. Throws if the value is
 * not valid JSON or any root is not a bare string, a `{ prv, chainCode }` entry or an external backup entry. Recovery tooling calls this on the A/B/C
 * box value, then decrypts each root value with the safe password. An MPC root value is an
 * opaque versioned envelope; recovery must unwrap its `prvKeyShare` and `vrf` fields instead
 * of treating the decrypted bytes as a bare share.
 */
export function parseSafeKeycardBox(data: string): SafeKeycardRoots {
  const decoded = SafeKeycardBoxFromString.decode(data);
  if (E.isLeft(decoded)) {
    // PathReporter, not decodeWithCodec: io-ts errors carry no message, so decodeWithCodec would report only "unknown".
    throw new Error(`parseSafeKeycardBox: ${PathReporter.report(decoded).join('; ')}`);
  }
  return decoded.right;
}
