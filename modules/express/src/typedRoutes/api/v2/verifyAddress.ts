import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for coin-specific address verification.
 * @property coin - Ticker or identifier of the coin (e.g. 'btc', 'eth').
 */
export const VerifyAddressV2Params = {
  /** Coin ticker / chain identifier */
  coin: t.string,
};

/**
 * Request body for coin-specific address verification.
 *
 * @property address - The address string to validate.
 * @property supportOldScriptHashVersion - (UTXO only) When true, treat legacy script hash version as acceptable.
 */
export const VerifyAddressV2Body = {
  /** Address which should be verified for correct format */
  address: t.string,
  /** Accept legacy script hash version for applicable UTXO coins (optional). */
  supportOldScriptHashVersion: optional(t.boolean),
};

/**
 * Verify address for a given coin.
 *
 * Returns whether the address is valid for the specified coin.
 * For UTXO coins, an optional legacy script hash flag can be provided to allow previous script hash versions.
 *
 * @operationId express.verifycoinaddress
 * @tag express
 */
export const PostVerifyCoinAddress = httpRoute({
  path: '/api/v2/{coin}/verifyaddress',
  method: 'POST',
  request: httpRequest({
    params: VerifyAddressV2Params,
    body: VerifyAddressV2Body,
  }),
  response: {
    200: t.type({
      isValid: t.boolean,
    }),
    404: BitgoExpressError,
  },
});
