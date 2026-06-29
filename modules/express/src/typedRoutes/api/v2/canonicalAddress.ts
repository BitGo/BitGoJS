import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for canonical address conversion
 */
export const CanonicalAddressRequestParams = {
  /** A cryptocurrency or token ticker symbol. */
  coin: t.string,
} as const;

/**
 * Request body for canonical address conversion
 */
export const CanonicalAddressRequestBody = {
  /** Address to canonicalize */
  address: t.string,
  /** Desired address format: 'base58' (supported by BCH, BSV, LTC) or 'cashaddr' (supported by BCH only). Defaults to 'base58'. LTC ignores this parameter. */
  version: optional(t.union([t.literal('base58'), t.literal('cashaddr')])),
  /** @deprecated Use version instead. Fallback parameter for version. */
  scriptHashVersion: optional(t.union([t.literal('base58'), t.literal('cashaddr')])),
} as const;

/**
 * Canonicalize an LTC or BCH address.
 *
 * @operationId express.canonicaladdress
 * @tag Express
 */
export const PostCanonicalAddress = httpRoute({
  path: '/api/v2/{coin}/canonicaladdress',
  method: 'POST',
  request: httpRequest({
    params: CanonicalAddressRequestParams,
    body: CanonicalAddressRequestBody,
  }),
  response: {
    /** OK */
    200: t.string,
    /** Error response (e.g., unsupported coin, invalid address format, invalid version parameter) */
    400: BitgoExpressError,
  },
});
