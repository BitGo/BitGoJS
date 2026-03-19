import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Ping
 *
 * Health check endpoint that returns 200 when the Express server is running.
 *
 * @operationId express.ping
 * @tag express
 * @private
 */
export const GetPingV1 = httpRoute({
  path: '/api/v1/ping',
  method: 'GET',
  request: httpRequest({}),
  response: {
    200: t.type({}),
    404: BitgoExpressError,
  },
});

/**
 * Ping
 *
 * Health check endpoint that returns 200 when the Express server is running.
 *
 * @operationId express.v2.ping
 * @tag express
 */
export const GetPing = httpRoute({
  path: '/api/v2/ping',
  method: 'GET',
  request: httpRequest({}),
  response: {
    200: t.type({}),
    404: BitgoExpressError,
  },
});
