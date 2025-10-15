import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for fanning out unspents in a wallet
 */
export const FanoutUnspentsRequestParams = {
  /** The ID of the wallet */
  id: t.string,
};

/**
 * Request body for fanning out unspents in a wallet
 */
export const FanoutUnspentsRequestBody = {
  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),
  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** Whether to validate addresses (defaults to true) */
  validate: optional(t.boolean),
  /** Target number of unspents to create (must be at least 2 and less than 300) */
  target: t.number,
  /** Minimum number of confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),
};

/**
 * Response for fanning out unspents in a wallet
 */
export const FanoutUnspentsResponse = t.type({
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
});

/**
 * Fan out unspents in a wallet
 *
 * This endpoint fans out unspents in a wallet by creating a transaction that spends from
 * multiple inputs to multiple outputs. This is useful for increasing the number of UTXOs
 * in a wallet, which can improve transaction parallelization.
 *
 * @tag express
 * @operationId express.v1.wallet.fanoutunspents
 */
export const PutFanoutUnspents = httpRoute({
  path: '/api/v1/wallet/{id}/fanoutunspents',
  method: 'PUT',
  request: httpRequest({
    params: FanoutUnspentsRequestParams,
    body: FanoutUnspentsRequestBody,
  }),
  response: {
    /** Successfully fanned out unspents */
    200: FanoutUnspentsResponse,
    /** Invalid request or fan out fails */
    400: BitgoExpressError,
  },
});
