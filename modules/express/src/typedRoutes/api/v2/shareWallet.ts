import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { ShareState, ShareWalletKeychain } from '../../schemas/wallet';

/**
 * Path parameters for sharing a wallet
 */
export const ShareWalletParams = {
  /** A cryptocurrency or token ticker symbol. */
  coin: t.string,
  /** The wallet ID. */
  id: t.string,
} as const;

/**
 * Request body for sharing a wallet
 */
export const ShareWalletBody = {
  /** Email address of the user being invited. */
  email: t.string,
  /**
   * Comma-separated list of privileges for a wallet. Includes:
   * - `admin` - Can manage wallet policies and users and approve or reject pending approvals.
   * - `freeze` - Can freeze a wallet, disabling all withdrawals.
   * - `spend` - Can initiate withdrawals and generate new receive addresses.
   * - `trade` - Can initiate trades from a Go Account (`trading` wallet type).
   * - `view` - Can view balances and transactions.
   *
   * Permissions don't overlap. Required parameter if 'reshare' is false.
   */
  permissions: t.string,
  /** Wallet passphrase of the user sharing the wallet. */
  walletPassphrase: optional(t.string),
  /** User readable message to display to the share recipient. */
  message: optional(t.string),
  /** Flag for reinviting a user to the wallet. This is required if the invitee has already been invited to the wallet, but has changed their password and needs a new invite. */
  reshare: optional(t.boolean),
  /** If true, skips using a shared key (for when the wallet is shared without spend permission). */
  skipKeychain: optional(t.boolean),
  /** Flag for disabling invite notification email. */
  disableEmail: optional(t.boolean),
} as const;

/**
 * Response for sharing a wallet
 */
export const ShareWalletResponse200 = t.intersection([
  t.type({
    /** Wallet share id */
    id: t.string,
    /** Coin of the wallet */
    coin: t.string,
    /** Wallet id */
    wallet: t.string,
    /** Id of the sharer */
    fromUser: t.string,
    /** Id of the recipient */
    toUser: t.string,
    /** Comma-separated list of privileges for wallet */
    permissions: t.string,
  }),
  t.partial({
    /** Wallet label */
    walletLabel: t.string,
    /** User-readable message */
    message: t.string,
    /** Share state */
    state: ShareState,
    /** Enterprise id, if applicable */
    enterprise: t.string,
    /** Pending approval id, if one was generated */
    pendingApprovalId: t.string,
    /** Included if shared with spend permission */
    keychain: ShareWalletKeychain,
  }),
]);

export const ShareWalletResponse = {
  200: ShareWalletResponse200,
  400: BitgoExpressError,
} as const;

/**
 * Share wallet with an existing BitGo user
 *
 * @operationId express.v2.wallet.share
 * @tag Express
 */
export const PostShareWallet = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/share',
  method: 'POST',
  request: httpRequest({
    params: ShareWalletParams,
    body: ShareWalletBody,
  }),
  response: ShareWalletResponse,
});
