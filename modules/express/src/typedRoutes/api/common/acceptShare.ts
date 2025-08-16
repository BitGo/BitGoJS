import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const AcceptShareRequestParams = {
  shareId: t.string,
};

export const AcceptShareRequestBody = {
  userPassword: optional(t.string),
  newWalletPassphrase: optional(t.string),
  overrideEncryptedXprv: optional(t.string),
  walletShareId: t.string,
};

/**
 * Accept a wallet share
 *
 * @operationId express.v1.wallet.acceptShare
 */
export const PostAcceptShare = httpRoute({
  path: '/api/v1/walletshare/:shareId/acceptShare',
  method: 'POST',
  request: httpRequest({
    params: AcceptShareRequestParams,
    body: AcceptShareRequestBody,
  }),
  response: {
    200: t.UnknownRecord,
    400: BitgoExpressError,
  },
});
