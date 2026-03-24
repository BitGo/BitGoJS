import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for account resources endpoint
 */
export const AccountResourcesParams = {
  /** Coin identifier (e.g., 'trx', 'ttrx') */
  coin: t.string,
  /** Wallet ID */
  id: t.string,
} as const;

/**
 * Query parameters for account resources endpoint
 */
export const AccountResourcesQuery = {
  /** On-chain addresses to query resources for (comma-separated string or repeated query params) */
  addresses: t.union([t.string, t.array(t.string)]),
  /** Optional destination address to calculate energy deficit for token transfers */
  destinationAddress: optional(t.string),
} as const;

/**
 * Account resource information for a single address
 */
export const AccountResourceInfo = t.intersection([
  t.type({
    address: t.string,
    free_bandwidth_available: t.number,
    free_bandwidth_used: t.number,
    staked_bandwidth_available: t.number,
    staked_bandwidth_used: t.number,
    energy_available: t.number,
    energy_used: t.number,
    resourceDeficitForAssetTransfer: t.intersection([
      t.type({
        bandwidthDeficit: t.number,
        bandwidthSunRequired: t.string,
      }),
      t.partial({
        energyDeficit: t.number,
        energySunRequired: t.string,
      }),
    ]),
  }),
  t.partial({
    maxResourcesDelegatable: t.type({
      bandwidthWeight: t.string,
      energyWeight: t.string,
    }),
  }),
]);

/**
 * Failed address information
 */
export const FailedAddressInfo = t.type({
  address: t.string,
  error: t.string,
});

/**
 * Response for account resources
 */
export const AccountResourcesResponse = {
  /** Account resources for the queried addresses */
  200: t.type({
    resources: t.array(AccountResourceInfo),
    failedAddresses: t.array(FailedAddressInfo),
  }),
  /** Invalid request */
  400: BitgoExpressError,
} as const;

/**
 * Get Account Resources
 *
 * Query BANDWIDTH and ENERGY resource information for TRX wallet addresses.
 * Returns resource availability, usage, and optional deficit calculations
 * for token transfers.
 *
 * @operationId express.v2.wallet.accountresources
 * @tag express
 */
export const GetAccountResources = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/accountresources',
  method: 'GET',
  request: httpRequest({
    params: AccountResourcesParams,
    query: AccountResourcesQuery,
  }),
  response: AccountResourcesResponse,
});
