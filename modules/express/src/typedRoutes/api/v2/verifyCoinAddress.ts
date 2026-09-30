import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for coin-specific address verification.
 * @property coin - Ticker or identifier of the coin (e.g. 'btc', 'eth').
 */
export const VerifyAddressV2Params = {
  /** A cryptocurrency or token ticker symbol. */
  coin: t.string,
};

/**
 * Request body for coin-specific address verification.
 *
 * @property address - The address string to validate.
 * @property supportOldScriptHashVersion - (UTXO only) When true, treat legacy script hash version as acceptable.
 * @property strictBase58 - (TRX only) When true, reject hex-form (0x-prefixed or 41-prefixed) input and require the canonical Base58 form.
 */
export const VerifyAddressV2Body = {
  /** Address which should be verified for correct format */
  address: t.string,
  /** Accept legacy script hash version for applicable UTXO coins (optional). */
  supportOldScriptHashVersion: optional(t.boolean),
  /**
   * (TRX only) When true, reject hex-form input and require the canonical Base58 form.
   * TRON addresses are accepted in three forms — canonical Base58 (T...), 41-prefixed hex,
   * and 0x-prefixed EVM-style hex — which are all encodings of the same address. Set this
   * flag to reject the hex forms during verification. Ignored for non-TRX coins (optional).
   */
  strictBase58: optional(t.boolean),
};

/**
 * Verify address for a given coin
 *
 * Returns whether the address is valid for the specified coin. The response does not convert
 * or normalize the address; it only validates the format.
 *
 * For UTXO coins, the optional supportOldScriptHashVersion flag allows legacy script hash versions.
 *
 * For TRON (trx and TRC-20 tokens such as trx:usdt), addresses are accepted in three forms:
 * canonical Base58 (T...), 41-prefixed hex, and 0x-prefixed EVM-style hex. All three are
 * alternative encodings of the same address and are accepted by default. Set strictBase58 to
 * true to reject the hex forms and require canonical Base58.
 *
 * @operationId express.verifycoinaddress
 * @tag Express
 * @public
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
