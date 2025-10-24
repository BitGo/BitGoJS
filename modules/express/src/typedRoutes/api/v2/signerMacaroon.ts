import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for creating a signer macaroon
 * @property {string} coin - A lightning coin name (e.g, lnbtc).
 * @property {string} walletId - The ID of the wallet.
 */
export const SignerMacaroonParams = {
  /** A lightning coin name (e.g, lnbtc). */
  coin: t.string,
  /** The ID of the wallet. */
  walletId: t.string,
} as const;

/**
 * Request body for creating a signer macaroon
 * @property {string} passphrase - Passphrase to decrypt the admin macaroon of the signer node.
 * @property {boolean} addIpCaveatToMacaroon - If true, adds an IP caveat to the generated signer macaroon.
 */
export const SignerMacaroonBody = {
  /** Passphrase to decrypt the admin macaroon of the signer node. */
  passphrase: t.string,
  /** If true, adds an IP caveat to the generated signer macaroon. */
  addIpCaveatToMacaroon: optional(t.boolean),
} as const;

/**
 * Response
 * - 200: Returns the updated wallet. On success, the wallet's `coinSpecific` includes the generated signer macaroon (derived from the signer node admin macaroon), optionally with an IP caveat.
 * - 400: BitGo Express error payload when macaroon creation cannot proceed (e.g., invalid coin, wallet not self‑custody lightning, missing encrypted signer admin macaroon, or external IP not set when an IP caveat is requested).
 *
 * See platform spec: POST /api/v2/{coin}/wallet/{walletId}/signermacaroon
 */
export const SignerMacaroonResponse = {
  /** The updated wallet with the generated signer macaroon. */
  200: t.UnknownRecord,
  /** BitGo Express error payload. */
  400: BitgoExpressError,
} as const;

/**
 * Lightning - Create signer macaroon
 *
 * This is only used for self-custody lightning.
 * Create the signer macaroon for the watch-only Lightning Network Daemon (LND) node.
 * This macaroon derives from the signer node admin macaroon and is used by the watch-only node to request signatures from the signer node for operational tasks.
 * Returns the updated wallet with the encrypted signer macaroon in the `coinSpecific` response field.
 *
 * @operationId express.lightning.signerMacaroon
 */
export const PostSignerMacaroon = httpRoute({
  method: 'POST',
  path: '/api/v2/{coin}/wallet/{walletId}/signermacaroon',
  request: httpRequest({
    params: SignerMacaroonParams,
    body: SignerMacaroonBody,
  }),
  response: SignerMacaroonResponse,
});
