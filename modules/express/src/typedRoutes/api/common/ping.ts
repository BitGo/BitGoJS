import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Ping
 *
 * Health check endpoint that verifies the Express server is running
 *
 * @operationId express.ping
 * @tag express
 * @public
 */
export const GetPing = httpRoute({
  path: '/api/v[12]/ping',
  method: 'GET',
  request: httpRequest({}),
  response: {
    200: t.type({}),
    404: BitgoExpressError,
  },
});
