import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Ping BitGo Express (v1)
 *
 * Use this endpoint to check whether your local BitGo Express server is up and reachable. It returns immediately without contacting bitgo.com, so it succeeds even when BitGo's servers are unavailable. Use [Ping](/reference/expressping) instead if you also need to confirm connectivity to BitGo.
 *
 * @operationId express.v1.pingexpress
 * @tag Express
 * @private
 */
export const GetV1PingExpress = httpRoute({
  path: '/api/v1/pingexpress',
  method: 'GET',
  request: httpRequest({}),
  response: {
    200: t.type({ status: t.string }),
    404: BitgoExpressError,
  },
});
