import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for the delegate resources endpoint
 */
export const DelegateResourcesParams = {
  /** Coin identifier (e.g., 'trx', 'ttrx') */
  coin: t.string,
  /** Wallet ID */
  id: t.string,
} as const;

/**
 * A single resource delegation entry
 */
export const DelegationEntryCodec = t.type({
  /** On-chain address that will receive the delegated resources */
  receiverAddress: t.string,
  /** Amount of TRX (in SUN) to stake for the delegation */
  amount: t.string,
  /** Resource type to delegate (e.g. 'ENERGY', 'BANDWIDTH') */
  resource: t.string,
});

/**
 * Request body for delegating resources to multiple receiver addresses.
 * Each delegation entry triggers a separate on-chain staking transaction
 * from the wallet's root address to the receiver address.
 *
 * Signing behaviour by wallet type:
 *   - Hot (non-TSS)   → signed locally with walletPassphrase and submitted
 *   - Custodial non-TSS → sent for BitGo approval via initiateTransaction
 *   - TSS (any)       → build response contains txRequestId; signed by TSS service
 */
export const DelegateResourcesRequestBody = {
  /** Delegation entries — one on-chain transaction is built per entry */
  delegations: t.array(DelegationEntryCodec),

  /** Wallet passphrase to decrypt the user key (hot wallets) */
  walletPassphrase: optional(t.string),
  /** Extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** One-time password for 2FA */
  otp: optional(t.string),

  /** API version for TSS transaction request response ('lite' or 'full') */
  apiVersion: optional(t.union([t.literal('lite'), t.literal('full')])),
} as const;

export const DelegationFailureEntry = t.type({
  /** Human-readable error message */
  message: t.string,
  /** Receiver address that failed, if available */
  receiverAddress: t.union([t.string, t.undefined]),
});

/**
 * Response for the delegate resources operation.
 * Returns arrays of successful and failed delegation transactions.
 */
export const DelegateResourcesResponse = t.type({
  /** Successfully sent delegation transactions */
  success: t.array(t.unknown),
  /** Errors from failed delegation transactions */
  failure: t.array(DelegationFailureEntry),
});

/**
 * Response for partial success or failure cases (202/400).
 * Includes both the transaction results and error metadata.
 */
export const DelegateResourcesErrorResponse = t.intersection([DelegateResourcesResponse, BitgoExpressError]);

/**
 * Bulk Resource Delegation
 *
 * Delegates resources (ENERGY or BANDWIDTH) from a wallet's root address to one or more
 * receiver addresses. Each delegation entry produces a separate on-chain staking transaction.
 * This is the resource-delegation analogue of the consolidateAccount endpoint.
 *
 * Supported coins: TRON (trx, ttrx) and any future coins that support resource delegation.
 *
 * The API may return partial success (status 202) if some delegations succeed but others fail.
 *
 * @operationId express.v2.wallet.delegateresources
 * @tag express
 */
export const PostDelegateResources = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/delegateResources',
  method: 'POST',
  request: httpRequest({
    params: DelegateResourcesParams,
    body: DelegateResourcesRequestBody,
  }),
  response: {
    /** All delegations succeeded */
    200: DelegateResourcesResponse,
    /** Partial success — some delegations succeeded, others failed */
    202: DelegateResourcesErrorResponse,
    /** All delegations failed */
    400: DelegateResourcesErrorResponse,
  },
});
