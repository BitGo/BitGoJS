import { createHash } from 'crypto';
import { OFFLINE_SIGNING_SHARE_MAX_AGE_MS } from './ecdsa/ecdsa';

/** Entries older than this are dropped once the map exceeds the size cap; mirrors the express ConsumedShareRegistry retention. */
const CONSUMED_OFFLINE_SIGNING_SESSION_MAX_AGE_MS = 30 * 24 * 3600 * 1000;
/** Hard size cap: beyond this, the oldest entries are evicted. */
const CONSUMED_OFFLINE_SIGNING_SESSION_MAX_ENTRIES = 100_000;

/**
 * Encrypted offline-signing session blobs that have already been consumed by a
 * round-2/round-3 helper. Single-use enforcement: replaying a round-1/round-2
 * session blob restores the same DSG nonce, and two partial signatures under one
 * nonce leak the signer's key share (CWE-323, WAL-2455/WAL-2457). Keyed by a
 * formatting-independent digest of the ciphertext (see computeEncryptedSessionDigest)
 * with a consumption timestamp; the map is bounded by a hard size cap, with expired
 * entries dropped lazily only when the cap is exceeded. Module-level because the
 * express route constructs a fresh per-request utils instance.
 */
const consumedEncryptedOfflineSigningSessions = new Map<string, number>();

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCanonicalBase64(value: string): boolean {
  return Buffer.from(value, 'base64').toString('base64') === value;
}
/** Session blobs expire with the GG18 offline-signing share retention window; the express durable registry prunes at the same age. */
const DSG_SESSION_MAX_AGE_MS = OFFLINE_SIGNING_SHARE_MAX_AGE_MS;
/** Tolerance for clock skew when comparing the minted stamp against the local clock. */
const DSG_SESSION_CLOCK_SKEW_MS = 60_000;

/**
 * Validates an encrypted DSG session blob's adata: `STATE:<createdEpochMs>:<signableHex>:<derivationPath>`.
 * The created stamp bounds the replay window to the registry retention (the durable registry prunes
 * entries at the same age, so pruning never drops an entry that could still be accepted).
 */
export function validateDsgSessionAdata(encryptedSession: string, state: string, expectedAdata: string): void {
  let cypherJson: { adata?: unknown };
  try {
    cypherJson = JSON.parse(encryptedSession);
  } catch {
    throw new Error('Failed to parse cyphertext to JSON, got: ' + encryptedSession);
  }
  if (typeof cypherJson.adata !== 'string') {
    throw new Error('Adata does not match cyphertext adata');
  }
  const stored = decodeURIComponent(cypherJson.adata);
  const [storedState, created, ...rest] = stored.split(':');
  if (storedState !== state || !/^\d+$/.test(created ?? '') || rest.join(':') !== expectedAdata) {
    throw new Error('Adata does not match cyphertext adata');
  }
  const createdMs = Number(created);
  const now = Date.now();
  if (createdMs > now + DSG_SESSION_CLOCK_SKEW_MS || now - createdMs >= DSG_SESSION_MAX_AGE_MS) {
    throw new Error('Encrypted session envelope has expired; restart the signing session');
  }
}

/**
 * Digest of an encrypted session blob that is invariant under every
 * decrypt-equivalent reformulation: hashing the raw string would let a relay
 * re-serialize the same ciphertext into a "fresh" blob and replay the same DSG
 * nonce. The digest covers the decoded bytes that decryption actually consumes
 * (base64-decoded iv and ct); for v1 (SJCL/CCM) the iv is truncated to the
 * effective nonce length, mirroring @bitgo/sdk-api decryptV1.ts ccmNonceLength
 * (keep in sync), because trailing iv bytes do not affect decryption. The salt
 * is deliberately omitted: altering it changes the derived key, so decryption
 * fails and no nonce is restored (merging such blobs is fail-closed).
 * Exported so the express route's durable ConsumedShareRegistry keys consumed
 * offline signing sessions identically.
 */
export function computeEncryptedSessionDigest(encryptedSession: string): string {
  let envelope: Record<string, unknown>;
  try {
    envelope = JSON.parse(encryptedSession);
  } catch {
    throw new Error('Session state is not a valid encrypted session envelope');
  }
  if (!isJsonObject(envelope) || typeof envelope.iv !== 'string' || typeof envelope.ct !== 'string') {
    throw new Error('Session state is not a valid encrypted session envelope');
  }
  // Strict canonical base64 only: Node's decoder stops at the first '=' while the
  // SJCL fallback decoder strips every '=' (and whitespace), so an envelope with a
  // '=' inserted inside iv/ct decrypts identically but would otherwise digest to a
  // different prefix and evade the single-use registry. Legitimate envelopes are
  // canonical base64 and pass this round-trip unchanged.
  if (!isCanonicalBase64(envelope.iv) || !isCanonicalBase64(envelope.ct)) {
    throw new Error('Session state is not a valid encrypted session envelope');
  }
  const iv = Buffer.from(envelope.iv, 'base64');
  const ct = Buffer.from(envelope.ct, 'base64');
  // v2 (GCM) authenticates the full iv. v1 (CCM) truncates the iv to the nonce length
  // (real SJCL envelopes carry a 16-byte iv for a 13-byte nonce), so hash only the
  // effective nonce bytes.
  let effectiveIv = iv;
  if (envelope.v !== 2) {
    const tagBytes = typeof envelope.ts === 'number' ? envelope.ts / 8 : 0;
    const nonceLen = ccmNonceLength(ct.length - tagBytes);
    if (nonceLen <= 0 || iv.length < nonceLen) {
      // decryption would reject this envelope anyway
      throw new Error('Session state is not a valid encrypted session envelope');
    }
    effectiveIv = iv.subarray(0, nonceLen);
  }
  return createHash('sha256').update(effectiveIv).update(ct).digest('hex');
}

/**
 * Mirrors @bitgo/sdk-api decryptV1.ts ccmNonceLength: v1 (SJCL/CCM) decryption
 * truncates the iv to the nonce length derived from the plaintext size, so
 * trailing iv bytes do not affect decryption. Keep in sync with decryptV1.ts.
 */
function ccmNonceLength(plaintextLen: number): number {
  let l = 2;
  while (l < 4 && plaintextLen >= 2 ** (8 * l)) {
    l++;
  }
  return 15 - l;
}

export function assertEncryptedSessionNotConsumed(digest: string): void {
  if (consumedEncryptedOfflineSigningSessions.has(digest)) {
    throw new Error('Session state has already been used; replay is not allowed');
  }
}

/**
 * Marks a session blob consumed. Called only right before the decrypted DSG
 * nonce state is restored: nothing before this point uses the nonce, and the
 * first call to reach here consumes the blob, so a concurrent replay cannot
 * restore the same nonce twice (the check-then-set is synchronous).
 */
export function markEncryptedSessionConsumed(digest: string): void {
  if (consumedEncryptedOfflineSigningSessions.has(digest)) {
    throw new Error('Session state has already been used; replay is not allowed');
  }
  const now = Date.now();
  consumedEncryptedOfflineSigningSessions.set(digest, now);
  pruneConsumedEncryptedOfflineSigningSessions(now);
}

function pruneConsumedEncryptedOfflineSigningSessions(now: number): void {
  if (consumedEncryptedOfflineSigningSessions.size <= CONSUMED_OFFLINE_SIGNING_SESSION_MAX_ENTRIES) {
    return;
  }
  for (const [key, consumedAt] of consumedEncryptedOfflineSigningSessions) {
    if (now - consumedAt >= CONSUMED_OFFLINE_SIGNING_SESSION_MAX_AGE_MS) {
      consumedEncryptedOfflineSigningSessions.delete(key);
    } else {
      // Insertion order is chronological under a monotonic clock; a backwards
      // clock adjustment only delays pruning, and the size cap below still holds.
      break;
    }
  }
  while (consumedEncryptedOfflineSigningSessions.size > CONSUMED_OFFLINE_SIGNING_SESSION_MAX_ENTRIES) {
    const oldest = consumedEncryptedOfflineSigningSessions.keys().next();
    if (oldest.done) {
      break;
    }
    consumedEncryptedOfflineSigningSessions.delete(oldest.value);
  }
}
