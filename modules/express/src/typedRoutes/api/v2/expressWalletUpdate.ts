import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 *  Parameters for Express Wallet Update
 */
export const ExpressWalletUpdateParams = {
  /** Coin ticker / chain identifier */
  coin: t.string,
  /** Wallet ID */
  id: t.string,
} as const;

/**
 *  Request body for Express Wallet Update
 */
export const ExpressWalletUpdateBody = {
  /** The host address of the lightning signer node. */
  signerHost: t.string,
  /** The TLS certificate for the lighting signer node encoded to base64. */
  signerTlsCert: t.string,
  /** (Optional) The signer macaroon for the lighting signer node. */
  signerMacaroon: optional(t.string),
  /** The wallet passphrase (used locally to decrypt and sign). */
  passphrase: t.string,
} as const;

/**
 * Response for Express Wallet Update
 */
export const ExpressWalletUpdateResponse = {
  /** Updated Wallet */
  200: t.UnknownRecord,
  /** Bad Request */
  400: BitgoExpressError,
  /** Forbidden */
  403: BitgoExpressError,
  /** Not Found */
  404: BitgoExpressError,
} as const;

/**
 * Express - Update Wallet
 * The express update wallet route is meant to be used for lightning (lnbtc/tlnbtc).
 * For other coins, use the standard wallet update endpoint.
 *
 * @operationId express.wallet.update
 */
export const PutExpressWalletUpdate = httpRoute({
  path: '/express/api/v2/{coin}/wallet/{id}',
  method: 'PUT',
  request: httpRequest({
    params: ExpressWalletUpdateParams,
    body: ExpressWalletUpdateBody,
  }),
  response: ExpressWalletUpdateResponse,
});
