import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for resource delegations endpoint
 */
export const ResourceDelegationsParams = {
  /** Coin identifier (e.g., 'trx', 'ttrx') */
  coin: t.string,
  /** Wallet ID */
  id: t.string,
} as const;

/**
 * Query parameters for resource delegations endpoint
 */
export const ResourceDelegationsQuery = {
  /** Filter by delegation type: 'owner' for outgoing, 'receiver' for incoming */
  type: optional(t.union([t.literal('owner'), t.literal('receiver')])),
  /** Filter by resource type (case-insensitive: energy, ENERGY, bandwidth, BANDWIDTH) */
  resource: optional(t.string),
  /** Maximum number of results to return */
  limit: optional(t.string),
} as const;

/**
 * A single delegation record
 */
export const DelegationRecord = t.type({
  from: t.string,
  to: t.string,
  amount: t.string,
  resource: t.string,
});

/**
 * Response for resource delegations
 */
export const ResourceDelegationsResponse = {
  /** Resource delegations for the wallet */
  200: t.type({
    address: t.string,
    coin: t.string,
    delegations: t.type({
      outgoing: t.array(DelegationRecord),
      incoming: t.array(DelegationRecord),
    }),
  }),
  /** Invalid request */
  400: BitgoExpressError,
} as const;

/**
 * Get Resource Delegations
 *
 * Query active outgoing and incoming ENERGY/BANDWIDTH resource delegations
 * for a TRX wallet.
 *
 * @operationId express.v2.wallet.resourcedelegations
 * @tag express
 */
export const GetResourceDelegations = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/resourcedelegations',
  method: 'GET',
  request: httpRequest({
    params: ResourceDelegationsParams,
    query: ResourceDelegationsQuery,
  }),
  response: ResourceDelegationsResponse,
});
