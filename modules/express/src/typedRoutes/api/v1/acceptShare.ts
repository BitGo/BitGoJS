import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const AcceptShareRequestParams = {
  /** ID of the wallet share to accept */
  shareId: t.string,
};

export const AcceptShareRequestBody = {
  /** User's password for authentication */
  userPassword: optional(t.string),
  /** New passphrase to encrypt the shared wallet's keys */
  newWalletPassphrase: optional(t.string),
  /** Optional encrypted private key to use instead of generating a new one */
  overrideEncryptedXprv: optional(t.string),
};

/**
 * Accept a Wallet Share
 * Allows users to accept a wallet share invitation from another user.
 * When a wallet is shared with a user, they need to accept the share to gain access
 * to the wallet according to the permissions granted by the sharing user.
 *
 * @operationId express.v1.wallet.acceptShare
 * @tag express
 */
export const PostAcceptShare = httpRoute({
  path: '/api/v1/walletshare/{shareId}/acceptShare',
  method: 'POST',
  request: httpRequest({
    params: AcceptShareRequestParams,
    body: AcceptShareRequestBody,
  }),
  response: {
    /** Successfully accepted wallet share */
    200: t.UnknownRecord,
    /** Error response */
    400: BitgoExpressError,
  },
});
