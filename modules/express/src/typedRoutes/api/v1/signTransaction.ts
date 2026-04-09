import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const signTransactionRequestParams = {
  /** ID of the wallet */
  id: t.string,
};

export const signTransactionRequestBody = {
  /** Serialized unsigned transaction in hex format (required for regular signing, not used with psbt) */
  transactionHex: t.string,
  /** Array of unspent information matching transaction inputs - each contains chainPath and redeemScript (required for regular signing, not used with psbt) */
  unspents: t.array(t.any),
  /** Keychain containing xprv for signing (required for PSBT signing, or for regular signing if signingKey not provided) */
  keychain: optional(
    t.intersection([
      t.type({
        xprv: t.string,
      }),
      t.record(t.string, t.any),
    ])
  ),
  /** For legacy safe wallets, WIF private key (alternative to keychain for regular signing only, not used with psbt) */
  signingKey: optional(t.string),
  /** Extra signature verification (defaults to global BitGo config, always verified server-side) */
  validate: optional(t.boolean),
  /** PSBT (Partially Signed Bitcoin Transaction) in hex format - when provided, uses PSBT signing flow instead of regular signing */
  psbt: optional(t.string),
  /** WIF private key for signing single-key fee address inputs (used when transaction has fee inputs from single-key addresses) */
  feeSingleKeyWIF: optional(t.string),
  /** Enable Bitcoin Cash signing mode for BCH transactions */
  forceBCH: optional(t.boolean),
  /** Require at least two valid signatures for full local signing */
  fullLocalSigning: optional(t.boolean),
};

/**
 * Sign a transaction with wallet's user key
 *
 * Signs a previously created unsigned transaction with the wallet's user key. This endpoint
 * supports two signing flows: regular transaction signing and PSBT (Partially Signed Bitcoin
 * Transaction) signing.
 *
 * **Regular Transaction Signing:**
 * Required parameters:
 * - transactionHex: The unsigned transaction in hex format
 * - unspents: Array of unspent information (chainPath, redeemScript) matching transaction inputs
 * - keychain.xprv OR signingKey: Private key for signing
 *
 * **PSBT Signing:**
 * Required parameters:
 * - psbt: The PSBT in hex format
 * - keychain.xprv: Extended private key for HD signing
 *
 * **Response:**
 * - Regular signing: Returns { tx: string } - signed transaction hex
 * - PSBT signing: Returns { psbt: string } - signed PSBT hex
 *
 * **Note:** The validate parameter controls signature verification. If omitted, uses the
 * global BitGo validation setting. Signature verification is always performed server-side.
 *
 * @operationId express.v1.wallet.signTransaction
 * @tag express
 */
export const PostSignTransaction = httpRoute({
  path: '/api/v1/wallet/{id}/signtransaction',
  method: 'POST',
  request: httpRequest({
    params: signTransactionRequestParams,
    body: signTransactionRequestBody,
  }),
  response: {
    /** Successfully signed transaction. Returns { tx: string } for regular signing or { psbt: string } for PSBT signing. */
    200: t.UnknownRecord,
    /** Error response (e.g., missing required parameters, invalid transaction hex, invalid keychain, signature verification failure) */
    400: BitgoExpressError,
  },
});
