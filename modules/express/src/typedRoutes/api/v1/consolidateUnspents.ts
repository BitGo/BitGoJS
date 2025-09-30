import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for consolidating unspents in a wallet
 */
export const ConsolidateUnspentsRequestParams = {
  /** The ID of the wallet */
  id: t.string,
};

/**
 * Request body for consolidating unspents in a wallet
 */
export const ConsolidateUnspentsRequestBody = {
  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),
  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** Whether to validate addresses (defaults to true) */
  validate: optional(t.boolean),
  /** Target number of unspents to maintain (defaults to 1) */
  target: optional(t.number),
  /** Minimum size of unspents to consolidate */
  minSize: optional(t.union([t.number, t.string])),
  /** Maximum size of unspents to consolidate */
  maxSize: optional(t.union([t.number, t.string])),
  /** Maximum number of inputs per consolidation transaction (defaults to 200, must be ≥ 2) */
  maxInputCountPerConsolidation: optional(t.number),
  /** Maximum number of consolidation iterations (defaults to -1) */
  maxIterationCount: optional(t.number),
  /** Minimum number of confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),
  /** Custom fee rate in satoshis per kilobyte */
  feeRate: optional(t.number),
};

/**
 * Response for consolidating unspents in a wallet
 */
export const ConsolidateUnspentsResponse = t.array(
  t.type({
    /** The status of the transaction ('accepted', 'pendingApproval', or 'otp') */
    status: t.string,
    /** The transaction hex */
    tx: t.string,
    /** The transaction hash/ID */
    hash: t.string,
    /** Whether the transaction is instant */
    instant: t.boolean,
    /** The instant ID (if applicable) */
    instantId: optional(t.string),
    /** The fee amount in satoshis */
    fee: t.number,
    /** The fee rate in satoshis per kilobyte */
    feeRate: t.number,
    /** Travel rule information */
    travelInfos: t.unknown,
    /** BitGo fee information (if applicable) */
    bitgoFee: optional(t.unknown),
    /** Travel rule result (if applicable) */
    travelResult: optional(t.unknown),
  })
);

/**
 * Consolidate unspents in a wallet
 *
 * This endpoint consolidates unspents in a wallet by creating a transaction that spends from
 * multiple inputs to a single output. This is useful for reducing the number of UTXOs in a wallet,
 * which can improve performance and reduce transaction fees.
 *
 * @operationId express.v1.wallet.consolidateunspents
 */
export const PutConsolidateUnspents = httpRoute({
  path: '/api/v1/wallet/:id/consolidateunspents',
  method: 'PUT',
  request: httpRequest({
    params: ConsolidateUnspentsRequestParams,
    body: ConsolidateUnspentsRequestBody,
  }),
  response: {
    /** Successfully consolidated unspents */
    200: ConsolidateUnspentsResponse,
    /** Invalid request or consolidation fails */
    400: BitgoExpressError,
  },
});
