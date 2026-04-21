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
 * Body parameters for account resources endpoint
 */
export const AccountResourcesBody = {
  /** On-chain addresses to query resources for */
  addresses: t.array(t.string),
  /** Optional destination address to calculate energy deficit for token transfers */
  destinationAddress: optional(t.string),
} as const;

/**
 * Account resource information for a single address
 */
export const AccountResourceInfo = t.intersection([
  t.type({
    address: t.string,
    freeBandwidthAvailable: t.number,
    freeBandwidthUsed: t.number,
    stakedBandwidthAvailable: t.number,
    stakedBandwidthUsed: t.number,
    energyAvailable: t.number,
    energyUsed: t.number,
  }),
  t.partial({
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
    maxResourcesDelegatable: t.type({
      bandwidthSun: t.string,
      energySun: t.string,
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
 * @operationId express.v2.wallet.getaccountresources
 * @tag Express
 */
export const GetAccountResources = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/getaccountresources',
  method: 'POST',
  request: httpRequest({
    params: AccountResourcesParams,
    body: AccountResourcesBody,
  }),
  response: AccountResourcesResponse,
});
