import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for one-shot Safe generation.
 */
export const GenerateSafeParams = {
  /** Enterprise public id that owns the safe */
  enterpriseId: t.string,
} as const;

/**
 * Request body for one-shot Safe generation.
 *
 * `enabledRootSlots` is decided by the server at initialize (Flipt); do not send it here.
 */
export const GenerateSafeBody = {
  /** Safe label */
  label: t.string,
  /** Passphrase used to encrypt locally generated root user/backup keys and to run MPC ceremonies */
  passphrase: t.string,
} as const;

/**
 * Response body for one-shot Safe generation.
 */
export const GenerateSafeResponse = {
  /** The newly created, finalized safe */
  200: t.UnknownRecord,
  /** Bad request */
  400: BitgoExpressError,
} as const;

/**
 * Generate Safe
 *
 * One-shot Wallet Safe creation for hot custody. Runs locally on BitGo Express:
 *
 * 1. Initialize the safe on BitGo (metadata only).
 * 2. Run the enabled root-key ceremonies on this machine (multisig keygen + MPC), encrypted with `passphrase`.
 * 3. Finalize the safe with the minted root key ids.
 *
 * If a ceremony fails, the SDK archives the half-created safe and throws with the per-slot failure list.
 * Create a new safe and retry.
 *
 * ⓘ This endpoint must be called through BitGo Express. `POST /api/v2/enterprise/{enterpriseId}/safes`
 * (without `/generate`) is the server-side initialize-only call and does not run local crypto.
 *
 * ⓘ Production Express requires TLS. The passphrase never leaves the Express host.
 *
 * @operationId express.v2.safes.generate
 * @tag Express
 * @private
 */
export const PostGenerateSafe = httpRoute({
  path: '/api/v2/enterprise/{enterpriseId}/safes/generate',
  method: 'POST',
  request: httpRequest({
    params: GenerateSafeParams,
    body: GenerateSafeBody,
  }),
  response: GenerateSafeResponse,
});
