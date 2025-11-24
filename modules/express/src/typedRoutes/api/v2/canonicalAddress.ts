import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for canonical address conversion
 */
export const CanonicalAddressRequestParams = {
  /** Coin identifier - must be ltc, bch, bsv or their testnet equivalents (tltc, tbch, tbsv) */
  coin: t.string,
} as const;

/**
 * Request body for canonical address conversion
 */
export const CanonicalAddressRequestBody = {
  /** Address to canonicalize - can be in any supported format (base58, cashaddr for BCH only, etc.) */
  address: t.string,
  /** Desired address format: 'base58' (supported by BCH, BSV, LTC) or 'cashaddr' (supported by BCH only). Defaults to 'base58'. LTC ignores this parameter. */
  version: optional(t.union([t.literal('base58'), t.literal('cashaddr')])),
  /** @deprecated Use version instead. Fallback parameter for version. */
  scriptHashVersion: optional(t.union([t.literal('base58'), t.literal('cashaddr')])),
} as const;

/**
 * Canonicalize address format
 *
 * Converts cryptocurrency addresses between different formats. This endpoint is specifically
 * designed for coins that support multiple address formats.
 *
 * **Supported Coins:**
 * - **Bitcoin Cash (BCH/TBCH)**: Converts between base58 and cashaddr formats
 * - **Bitcoin SV (BSV/TBSV)**: Supports base58 format only (cashaddr not supported)
 * - **Litecoin (LTC/TLTC)**: Returns address unchanged (included for API consistency)
 *
 * **Address Formats:**
 * - **base58**: Traditional Bitcoin-style addresses (e.g., '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu', '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC')
 * - **cashaddr**: Bitcoin Cash address format with network prefix (e.g., 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a')
 *
 * **BCH Behavior:**
 * - version='base58': Converts any input format to base58 canonical format
 * - version='cashaddr': Converts any input format to cashaddr format (adds network prefix if missing)
 * - Default (no version): Converts to base58 format
 *
 * **BSV Behavior (Deprecated):**
 * - version='base58': Converts address to base58 canonical format
 * - version='cashaddr': Not supported - will return error "unsupported address format cashaddr for network bitcoinsv"
 * - Default (no version): Converts to base58 format
 *
 * **LTC Behavior:**
 * - Returns the input address unchanged regardless of version parameter
 * - Included for API consistency but performs no transformation
 *
 * **Response:** Returns the canonical address string directly (as JSON string primitive).
 *
 * @operationId express.v2.canonicaladdress
 * @tag express
 */
export const PostCanonicalAddress = httpRoute({
  path: '/api/v2/{coin}/canonicaladdress',
  method: 'POST',
  request: httpRequest({
    params: CanonicalAddressRequestParams,
    body: CanonicalAddressRequestBody,
  }),
  response: {
    /** Successfully converted address. Returns the canonical address string in the requested format. */
    200: t.string,
    /** Error response (e.g., unsupported coin, invalid address format, invalid version parameter) */
    400: BitgoExpressError,
  },
});
