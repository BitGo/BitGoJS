import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Health check endpoint. Returns 200 if the Express server is running.
 * Use this to verify the Express server is up and responding.
 *
 * @operationId express.ping
 * @tag express
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
