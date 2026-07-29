import * as t from 'io-ts';
import { NumberFromString } from 'io-ts-types';
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
  /** Filter by delegation direction: 'outgoing' for delegations from this address, 'incoming' for delegations to this address; omit to fetch both */
  type: optional(t.union([t.literal('outgoing'), t.literal('incoming')])),
  /** Filter by resource type (case-insensitive: ENERGY, energy, BANDWIDTH, bandwidth) */
  resource: optional(t.string),
  /** Maximum number of results to return */
  limit: optional(NumberFromString),
  /** Pagination cursor from previous response */
  nextBatchPrevId: optional(t.string),
} as const;

/**
 * A single delegation record
 */
export const DelegationRecord = t.type({
  id: t.string,
  coin: t.string,
  ownerAddress: t.string,
  receiverAddress: t.string,
  resource: t.union([t.literal('ENERGY'), t.literal('BANDWIDTH')]),
  balance: t.string,
  updatedAt: t.string,
});

/**
 * Response for resource delegations
 */
export const ResourceDelegationsResponse = {
  /** Resource delegations for the wallet */
  200: t.type({
    address: t.string,
    coin: t.string,
    delegations: t.intersection([
      t.type({
        outgoing: t.array(DelegationRecord),
        incoming: t.array(DelegationRecord),
      }),
      t.partial({
        nextBatchPrevId: t.string,
      }),
    ]),
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
 * @tag Express
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
