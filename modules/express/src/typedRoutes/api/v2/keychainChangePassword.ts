import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for changing a keychain's password
 */
export const KeychainChangePasswordParams = {
  /** Coin identifier (e.g. btc, tbtc, eth) */
  coin: t.string,
  /** The keychain id */
  id: t.string,
} as const;

/**
 * Request body for changing a keychain's password
 */
export const KeychainChangePasswordBody = {
  /** The old password used to encrypt the keychain */
  oldPassword: t.string,
  /** The new password to re-encrypt the keychain */
  newPassword: t.string,
  /** Optional OTP to unlock the session if required */
  otp: optional(t.string),
} as const;

/**
 * Response for changing a keychain's password
 */
export const KeychainChangePasswordResponse = {
  /** Successful update */
  200: t.unknown,
  /** Invalid request or not found */
  400: BitgoExpressError,
  404: BitgoExpressError,
} as const;

/**
 * Change a keychain's passphrase, re-encrypting the key to a new password.
 *
 * @operationId express.v2.keychain.changePassword
 */
export const PostKeychainChangePassword = httpRoute({
  path: '/api/v2/{coin}/keychain/{id}/changepassword',
  method: 'POST',
  request: httpRequest({
    params: KeychainChangePasswordParams,
    body: KeychainChangePasswordBody,
  }),
  response: KeychainChangePasswordResponse,
});
