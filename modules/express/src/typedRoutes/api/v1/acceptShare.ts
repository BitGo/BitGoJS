import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const AcceptShareRequestParams = {
  /** ID of the wallet share to accept */
  shareId: t.string,
};

/**
 * Credentials and override for accepting a wallet share.
 * User password for ECDH decryption, new wallet passphrase, or pre-encrypted xprv for override path.
 */
export const AcceptShareRequestBody = {
  /**
   * User's password for authentication.
   * Required when accepting shares with spend/admin permissions that include encrypted keychains,
   * unless overrideEncryptedXprv is provided. Used to decrypt the user's ECDH keychain
   * for deriving the shared secret that decrypts the shared wallet keys.
   */
  userPassword: optional(t.string),
  /**
   * New passphrase to encrypt the shared wallet keys with.
   * If not provided, defaults to userPassword. This passphrase will be required
   * for future wallet operations that need to decrypt the wallet keys.
   * Only applicable when accepting shares with encrypted keychains.
   */
  newWalletPassphrase: optional(t.string),
  /**
   * Pre-encrypted wallet xprv received through an out-of-band secure channel.
   * When provided, bypasses the ECDH key derivation and decryption process.
   * Use this only if you received the encrypted key separately from the share invitation.
   * The xprv must already be encrypted with your desired passphrase.
   */
  overrideEncryptedXprv: optional(t.string),
};

/** Response from accepting a wallet share */
export const AcceptShareResponse = t.type({
  /**
   * Indicates whether the share state was changed by this operation.
   * true: The share was successfully accepted (state changed from pending to accepted).
   * false: The share was already in the target state (already accepted).
   */
  changed: t.boolean,
  /**
   * Current state of the wallet share after the operation.
   * Possible values: 'accepted', 'rejected', 'active', 'pendingapproval', 'canceled'
   * Should be 'accepted' after a successful acceptance.
   */
  state: t.string,
});

/**
 * Accept a Wallet Share
 *
 * Accepts a wallet share invitation from another user, granting access to the shared wallet
 * according to the permissions specified by the sharing user.
 *
 * ## Wallet Share Permissions
 * - **View**: Read-only access to wallet information and transactions
 * - **Spend**: Ability to create and sign transactions
 * - **Admin**: Full control including user management and settings
 *
 * ## Acceptance Workflow
 *
 * The acceptance process varies based on the share type:
 *
 * ### 1. View-Only Shares
 * No encryption processing needed. The share is accepted immediately without requiring userPassword.
 *
 * ### 2. Spend/Admin Shares with Keychain (Standard Path)
 * Uses ECDH (Elliptic Curve Diffie-Hellman) key sharing:
 * - Requires `userPassword` to decrypt your ECDH keychain
 * - Derives a shared secret between you and the sharing user
 * - Decrypts the shared wallet keys using this secret
 * - Re-encrypts the keys with `newWalletPassphrase` (or `userPassword` if not specified)
 * - Stores the encrypted keys for future wallet operations
 *
 * ### 3. Override Path (Out-of-Band Key Exchange)
 * When `overrideEncryptedXprv` is provided:
 * - Bypasses the ECDH key derivation process
 * - Uses the pre-encrypted xprv directly
 * - No password required (keys are already encrypted)
 *
 * ## Security Notes
 * - `userPassword` must match your BitGo account password
 * - `newWalletPassphrase` should be strong and securely stored
 * - The ECDH key exchange ensures only the intended recipient can decrypt the wallet keys
 * - `overrideEncryptedXprv` should only be used for keys received through a separate secure channel
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
    200: AcceptShareResponse,
    /** Error response */
    400: BitgoExpressError,
  },
});
