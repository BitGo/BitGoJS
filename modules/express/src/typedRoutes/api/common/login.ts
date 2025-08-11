import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const LoginRequest = {
  password: t.string,
  email: optional(t.string),
  username: optional(t.string),
  otp: optional(t.string),
  trust: optional(t.number),
  forceSMS: optional(t.boolean),
  extensible: optional(t.boolean),
  forceV1Auth: optional(t.boolean),
  /**
   * Whether or not to ensure that the user's ECDH keychain is created.
   * @type {boolean}
   * @default false
   * @description If set to true, the user's ECDH keychain will be created if it does not already exist.
   * The ecdh keychain is a user level keychain that enables the sharing of secret material,
   * primarily for wallet sharing, as well as the signing of less private material such as various cryptographic challenges.
   * It is highly recommended that this is always set to avoid any issues when using a BitGo wallet
   */
  ensureEcdhKeychain: optional(t.boolean),
  forReset2FA: optional(t.boolean),
  /**
   * The initial stage fingerprint hash used for device identification and verification.
   * @type {string}
   * @default undefined
   * @description An SHA-256 hash string generated from device-specific attributes
   */
  initialHash: optional(t.string),
  /**
   * The final stage fingerprint hash used for trusted device verification.
   * @type {string}
   * @default undefined
   * @description An SHA-256 hash string derived from the initialHash and verification code
   */
  fingerprintHash: optional(t.string),
};

/**
 * Login
 *
 * @operationId express.login
 */
export const PostLogin = httpRoute({
  path: '/api/v[12]/user/login',
  method: 'POST',
  request: httpRequest({
    body: LoginRequest,
  }),
  response: {
    200: t.type({
      email: t.string,
      password: t.string,
      forceSMS: t.boolean,
      otp: optional(t.string),
      trust: optional(t.number),
      extensible: optional(t.boolean),
      extensionAddress: optional(t.string),
      forceV1Auth: optional(t.boolean),
      forReset2FA: optional(t.boolean),
      initialHash: optional(t.string),
      fingerprintHash: optional(t.string),
    }),
    404: BitgoExpressError,
  },
});
