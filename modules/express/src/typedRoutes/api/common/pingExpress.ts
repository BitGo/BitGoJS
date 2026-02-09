import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Ping Express
 *
 * Health check endpoint which returns a simple status payload when the Express server is running.
 * Useful for load balancers and monitoring systems that expect a JSON response body.
 *
 * @operationId express.pingExpress
 * @tag express
 */
export const GetPingExpress = httpRoute({
  path: '/api/v[12]/pingexpress',
  method: 'GET',
  request: httpRequest({}),
  response: {
    200: t.type({ status: t.string }),
    404: BitgoExpressError,
  },
});
