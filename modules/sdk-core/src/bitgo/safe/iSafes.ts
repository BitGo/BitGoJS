/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import { FinalizeSafeOptions, InitializeSafeOptions } from './iSafe';
import { Safe } from './safe';

/**
 * Options for safe creation.
 *
 * v1 targets the HOT custody model only: the multisig root user/backup keys are generated locally
 * by the SDK, encrypted with `passphrase`, and registered on BitGo; the MPC roots run the standard
 * hot ceremonies with the same passphrase. Self-managed cold keys and custodial safes are out of
 * scope for v1.
 * @experimental
 */
export interface CreateSafeOptions {
  label: string;
  passphrase: string; // encrypts the locally-generated multisig user/backup prvs; shared with the MPC ceremonies
}

/**
 * Handle returned by `initializeSafe`, threaded into the key ceremonies and finalize.
 * @experimental
 */
export interface SafeCreationHandle {
  safeId: string;
}

/**
 * The 12 minted root key ids produced by `createSafeKeys`, as 4 ordered [user, backup, bitgo]
 * triplets — exactly the payload `finalizeSafe` consumes.
 * @experimental
 */
export type SafeKeys = FinalizeSafeOptions;

/**
 * @experimental
 */
export interface ListSafesOptions {
  cursor?: string; // opaque cursor from a previous response's nextCursor
  limit?: number;
}

/**
 * @experimental
 */
export interface GetSafeOptions {
  id: string;
}

/**
 * @experimental
 */
export interface ISafes {
  /**
   * One-call convenience wrapper chaining the three creation phases:
   * initialize → createSafeKeys (4 safeId-tagged ceremonies) → finalize. HOT custody only in v1.
   * @experimental
   */
  generateSafe(params: CreateSafeOptions): Promise<Safe>;
  /**
   * Phase 1 — initialize a safe (metadata only, no key material).
   * @experimental
   */
  initializeSafe(params: InitializeSafeOptions): Promise<Safe>;
  /**
   * Phase 2 — run the 4 root key ceremonies tagged with `safeId`; returns the 12 minted key ids.
   * @experimental
   */
  createSafeKeys(params: CreateSafeOptions & SafeCreationHandle): Promise<SafeKeys>;
  /**
   * Phase 3 — finalize a safe with the 12 root key ids. Idempotent.
   * @experimental
   */
  finalizeSafe(safeId: string, params: FinalizeSafeOptions): Promise<Safe>;
  /** @experimental */
  list(params?: ListSafesOptions): Promise<{ safes: Safe[]; nextCursor?: string }>;
  /** @experimental */
  get(params: GetSafeOptions): Promise<Safe>;
}
