import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { DelegateResourcesParams, DelegationEntryCodec, DelegationFailureEntry } from './delegateResources';

/**
 * Request body for undelegating resources from multiple receiver addresses.
 * Each undelegation entry triggers a separate on-chain transaction that reclaims
 * previously delegated resources back to the wallet's root address.
 *
 * Signing behaviour by wallet type:
 *   - Hot (non-TSS)   → signed locally with walletPassphrase and submitted
 *   - Custodial non-TSS → sent for BitGo approval via initiateTransaction
 *   - TSS (any)       → build response contains txRequestId; signed by TSS service
 */
export const UndelegateResourcesRequestBody = {
  /** Undelegation entries — one on-chain transaction is built per entry */
  undelegations: t.array(DelegationEntryCodec),

  /** Wallet passphrase to decrypt the user key (hot wallets) */
  walletPassphrase: optional(t.string),
  /** Extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** One-time password for 2FA */
  otp: optional(t.string),

  /** API version for TSS transaction request response ('lite' or 'full') */
  apiVersion: optional(t.union([t.literal('lite'), t.literal('full')])),
} as const;

/**
 * Response for the undelegate resources operation.
 * Returns arrays of successful and failed undelegation transactions.
 */
export const UndelegateResourcesResponse = t.type({
  /** Successfully sent undelegation transactions */
  success: t.array(t.unknown),
  /** Errors from failed undelegation transactions */
  failure: t.array(DelegationFailureEntry),
});

/**
 * Response for partial success or failure cases (202/400).
 */
export const UndelegateResourcesErrorResponse = t.intersection([UndelegateResourcesResponse, BitgoExpressError]);

/**
 * Bulk Resource Undelegation
 *
 * Reclaims delegated resources (ENERGY or BANDWIDTH) back to a wallet's root address
 * from one or more receiver addresses. Each entry produces a separate on-chain transaction.
 *
 * Supported coins: TRON (trx, ttrx) and any future coins that support resource delegation.
 *
 * The API may return partial success (status 202) if some undelegations succeed but others fail.
 *
 * @operationId express.v2.wallet.undelegateresources
 * @tag express
 */
export const PostUndelegateResources = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/undelegateResources',
  method: 'POST',
  request: httpRequest({
    params: DelegateResourcesParams,
    body: UndelegateResourcesRequestBody,
  }),
  response: {
    /** All undelegations succeeded */
    200: UndelegateResourcesResponse,
    /** Partial success — some undelegations succeeded, others failed */
    202: UndelegateResourcesErrorResponse,
    /** All undelegations failed */
    400: UndelegateResourcesErrorResponse,
  },
});
