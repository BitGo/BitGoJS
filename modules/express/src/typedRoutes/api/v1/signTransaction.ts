import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const signTransactionRequestParams = {
  /** ID of the wallet */
  id: t.string,
};

export const signTransactionRequestBody = {
  /** Serialized form of the transaction in hex */
  transactionHex: t.string,
  /** array of unspent information, where each unspent is a chainPath 
  and redeemScript with the same index as the inputs in the
  transactionHex */
  unspents: t.array(t.any),
  /** Keychain containing the xprv to sign with */
  keychain: t.intersection([
    t.type({
      xprv: t.string,
    }),
    t.record(t.string, t.any),
  ]),
  /** For legacy safe wallets, the private key string */
  signingKey: t.string,
  /** extra verification of signatures (which are always verified server-side) (defaults to global config) */
  validate: optional(t.boolean),
};

/**
 * signTransaction
 * Sign a previously created transaction with a keychain
 *
 * @tag express
 * @operationId express.v1.wallet.signTransaction
 */
export const PostSignTransaction = httpRoute({
  path: '/api/v1/wallet/{id}/signtransaction',
  method: 'POST',
  request: httpRequest({
    params: signTransactionRequestParams,
    body: signTransactionRequestBody,
  }),
  response: {
    /** Successfully accepted wallet share */
    200: t.UnknownRecord,
    /** Error response */
    400: BitgoExpressError,
  },
});
