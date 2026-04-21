import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { LoginRequest } from '../v1/login';

/**
 * Login
 *
 * Authenticate a user and retrieve their session details.
 *
 * @operationId express.login
 * @tag Express
 * @public
 */
export const PostV2Login = httpRoute({
  path: '/api/v2/user/login',
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
