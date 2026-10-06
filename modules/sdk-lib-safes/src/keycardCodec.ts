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
 * public keys for C. The root-key-type keys are self-identifying, so a consumer parses by
 * key rather than by size/offset. Any non-empty subset of the four slots is valid, matching
 * partial-slot Safes right after creation (enabledRootSlots).
 */
export type SafeKeycardRoots = Partial<Record<SafeRootKeyType, string>>;

const safeRootSlotCodecs = {
  secp256k1Multisig: t.string,
  ecdsaMpc: t.string,
  eddsaMpc: t.string,
  ed25519Multisig: t.string,
} satisfies Record<SafeRootKeyType, t.Type<string, string, unknown>>;

const SAFE_ROOT_SLOT_ORDER = Object.keys(safeRootSlotCodecs) as SafeRootKeyType[];

const SafeKeycardRootsCodec: t.Type<SafeKeycardRoots, SafeKeycardRoots, unknown> = t.partial(safeRootSlotCodecs);

/**
 * Parses a safe keycard box value — the JSON packed by key-card's `generateSafeQrData`, e.g.
 * `{"secp256k1Multisig":"…","ed25519Multisig":"…",}` — into the root slots the box declares.
 * Throws if the value is not valid JSON, the box carries no root slots, an unknown root key, or
 * a root value is not a string. Recovery tooling calls this on the A/B/C box value, then
 * decrypts each present root with the safe password. An MPC root value is an opaque versioned
 * envelope; recovery must unwrap its `prvKeyShare` and `vrf` fields instead of treating the
 * decrypted bytes as a bare share.
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
