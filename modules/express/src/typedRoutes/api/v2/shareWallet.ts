import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { ShareState, ShareWalletKeychain } from '../../schemas/wallet';

/**
 * Path parameters for sharing a wallet
 */
export const ShareWalletParams = {
  /** Coin ticker / chain identifier */
  coin: t.string,
  /** Wallet ID */
  id: t.string,
} as const;

/**
 * Request body for sharing a wallet
 */
export const ShareWalletBody = {
  /** Recipient email address */
  email: t.string,
  /** Permissions string, e.g., "view,spend" */
  permissions: t.string,
  /** Wallet passphrase used to derive shared key when needed */
  walletPassphrase: optional(t.string),
  /** Optional message to include with the share */
  message: optional(t.string),
  /** If true, allows sharing without a keychain */
  reshare: optional(t.boolean),
  /** If true, skips sharing the wallet keychain with the recipient */
  skipKeychain: optional(t.boolean),
  /** If true, suppresses email notification to the recipient */
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
 * Share this wallet with another BitGo user.
 *
 * @operationId express.v2.wallet.share
 * @tag express
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
