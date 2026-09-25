import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { RootKeyType } from '@bitgo/public-types';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for Phase-2-only Safe key ceremonies.
 */
export const GenerateSafeKeysParams = {
  /** Enterprise public id that owns the safe */
  enterpriseId: t.string,
  /** Already-initialized safe id to tag the ceremonies with */
  safeId: t.string,
} as const;

/**
 * Request body for Phase-2-only Safe key ceremonies.
 *
 * `initializeSafe` and `finalizeSafe` remain direct server calls (no local crypto).
 */
export const GenerateSafeKeysBody = {
  /** Passphrase used to encrypt locally generated root user/backup keys and to run MPC ceremonies */
  passphrase: t.string,
  /** Slots to run. Omit to run all four (older WP / retry of a full ceremony set). */
  enabledRootSlots: optional(t.array(RootKeyType)),
} as const;

/**
 * Response body for Phase-2-only Safe key ceremonies.
 */
export const GenerateSafeKeysResponse = {
  /** Minted root key ids, as ordered [user, backup, bitgo] triplets — the payload `finalizeSafe` consumes */
  200: t.UnknownRecord,
  /** Bad request */
  400: BitgoExpressError,
} as const;

/**
 * Generate Safe Keys
 *
 * Phase 2 of Wallet Safe creation: run the enabled root-key ceremonies for an already-initialized
 * safe. Use this when a thin client already called `POST /safes` (initialize) and only needs the
 * local ceremonies before `POST .../finalize`.
 *
 * If a ceremony fails, the SDK archives the half-created safe and throws with the per-slot failure
 * list. Create a new safe and retry.
 *
 * ⓘ This endpoint must be called through BitGo Express. One-shot creation is
 * `POST /api/v2/enterprise/{enterpriseId}/safes/generate`.
 *
 * @operationId express.v2.safes.keys.generate
 * @tag Express
 * @private
 */
export const PostGenerateSafeKeys = httpRoute({
  path: '/api/v2/enterprise/{enterpriseId}/safes/{safeId}/keys/generate',
  method: 'POST',
  request: httpRequest({
    params: GenerateSafeKeysParams,
    body: GenerateSafeKeysBody,
  }),
  response: GenerateSafeKeysResponse,
});
