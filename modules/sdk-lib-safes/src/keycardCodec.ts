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
 * consumer parses by key rather than by size/offset.
 */
export type SafeKeycardRoots = Record<SafeRootKeyType, string>;

// Annotating with SafeKeycardRoots makes the compiler reject a key added to or removed from one side only.
const SafeKeycardRootsCodec: t.Type<SafeKeycardRoots> = t.type({
  secp256k1Multisig: t.string,
  ecdsaMpc: t.string,
  eddsaMpc: t.string,
  ed25519Multisig: t.string,
});

// Decodes a box's JSON string straight into the validated roots record.
const SafeKeycardBoxFromString = JsonFromString.pipe(SafeKeycardRootsCodec);

/**
 * Parses a safe keycard box value — the JSON packed by key-card's `generateSafeQrData`, e.g.
 * `{"secp256k1Multisig":"…","ecdsaMpc":"…",…}` — into its four roots. Throws if the value is
 * not valid JSON or any root is missing/non-string. Recovery tooling calls this on the A/B/C
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
