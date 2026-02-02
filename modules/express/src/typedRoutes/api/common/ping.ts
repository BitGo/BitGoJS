import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Ping
 *
 * Health check endpoint for BitGo Express. Use this endpoint to verify that the
 * Express server is running and responsive before making other API calls.
 *
 * Common use cases:
 * - Load balancer health checks
 * - Container orchestration liveness probes (Kubernetes, ECS)
 * - Monitoring and alerting systems
 * - Pre-flight connectivity validation from client applications
 *
 * This endpoint requires no authentication and returns an empty 200 response
 * when the service is operational.
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
