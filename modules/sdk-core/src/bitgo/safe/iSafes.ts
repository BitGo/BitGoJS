/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import type { InitializeSafeResponse } from '@bitgo/public-types';
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
 *
 * `enabledRootSlots` is the server-decided (Flipt, evaluated once at initialize) set of root-key
 * slots to generate; absent (older WP) falls back to all 4 slots.
 * @experimental
 */
export interface SafeCreationHandle {
  safeId: string;
  enabledRootSlots?: InitializeSafeResponse['enabledRootSlots'];
}

/**
 * The minted root key ids produced by `createSafeKeys`, as ordered [user, backup, bitgo]
 * triplets for the enabled slots — exactly the payload `finalizeSafe` consumes.
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
   * initialize → createSafeKeys (safeId-tagged ceremonies for the enabled root slots) → finalize.
   * HOT custody only in v1.
   * @experimental
   */
  generateSafe(params: CreateSafeOptions): Promise<Safe>;
  /**
   * Phase 1 — initialize a safe (metadata only, no key material). The server response is
   * `{ id, status }` plus optional `enabledRootSlots` (no `label`/`enterpriseId`/`creator`/`users`/
   * `createdAt` yet), so this returns that raw shape rather than a full `Safe`.
   * @experimental
   */
  initializeSafe(params: InitializeSafeOptions): Promise<InitializeSafeResponse>;
  /**
   * Phase 2 — run the enabled root key ceremonies tagged with `safeId`; returns the minted key ids.
   * @experimental
   */
  createSafeKeys(params: CreateSafeOptions & SafeCreationHandle): Promise<SafeKeys>;
  /**
   * Phase 3 — finalize a safe with the minted root key ids. Idempotent.
   * @experimental
   */
  finalizeSafe(safeId: string, params: FinalizeSafeOptions): Promise<Safe>;
  /**
   * Archive a safe. Also the abandonment path for a stuck `initializing` safe.
   * @experimental
   */
  archiveSafe(safeId: string): Promise<Safe>;
  /** @experimental */
  list(params?: ListSafesOptions): Promise<{ safes: Safe[]; nextCursor?: string }>;
  /** @experimental */
  get(params: GetSafeOptions): Promise<Safe>;
}
