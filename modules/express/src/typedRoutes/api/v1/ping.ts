import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Ping (v1)
 *
 * Health check endpoint that returns 200 when the Express server is running.
 *
 * @operationId express.v1.ping
 * @tag Express
 * @private
 */
export const GetV1Ping = httpRoute({
  path: '/api/v1/ping',
  method: 'GET',
  request: httpRequest({}),
  response: {
    200: t.type({}),
    404: BitgoExpressError,
  },
});
