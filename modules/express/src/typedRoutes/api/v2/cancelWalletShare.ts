import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { ShareState } from '../../schemas/wallet';

/**
 * Path parameters for canceling a wallet share
 */
export const CancelWalletShareParams = {
  /** A cryptocurrency or token ticker symbol. */
  coin: t.string,
  /** The wallet share ID to cancel. */
  id: t.string,
} as const;

/**
 * Response for canceling a wallet share
 */
export const CancelWalletShareResponse200 = t.type({
  /** Whether the share state was changed by this operation. */
  changed: t.boolean,
  /** Current state of the wallet share after the operation. */
  state: ShareState,
});

export const CancelWalletShareResponse = {
  200: CancelWalletShareResponse200,
  400: BitgoExpressError,
} as const;

/**
 * Cancel a pending wallet share invitation
 *
 * Cancels an outgoing wallet share that has not yet been accepted.
 * Only the user who created the share can cancel it.
 *
 * @operationId express.wallet.cancelShare
 * @tag Express
 */
export const DeleteCancelWalletShare = httpRoute({
  path: '/api/v2/{coin}/walletshare/{id}',
  method: 'DELETE',
  request: httpRequest({
    params: CancelWalletShareParams,
  }),
  response: CancelWalletShareResponse,
});
