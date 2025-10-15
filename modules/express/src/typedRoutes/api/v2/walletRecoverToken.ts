import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for recovering tokens from a wallet
 */
export const RecoverTokenParams = {
  /** Coin ticker / chain identifier */
  coin: t.string,
  /** The ID of the wallet */
  id: t.string,
} as const;

/**
 * Request body for recovering tokens from a wallet
 */
export const RecoverTokenBody = {
  /** The contract address of the unsupported token to recover */
  tokenContractAddress: optional(t.string),
  /** The destination address where recovered tokens should be sent */
  recipient: optional(t.string),
  /** Whether to automatically broadcast the half-signed transaction to BitGo for cosigning and broadcasting */
  broadcast: optional(t.boolean),
  /** The wallet passphrase used to decrypt the user key */
  walletPassphrase: optional(t.string),
  /** The extended private key (alternative to walletPassphrase) */
  prv: optional(t.string),
} as const;

/**
 * Response for recovering tokens from a wallet
 */
export const RecoverTokenResponse = t.type({
  halfSigned: t.type({
    /** Recipient information for the recovery transaction */
    recipient: t.unknown,
    /** Expiration time for the transaction */
    expireTime: t.number,
    /** Contract sequence ID */
    contractSequenceId: t.number,
    /** Operation hash for the transaction */
    operationHash: t.string,
    /** Signature for the half-signed transaction */
    signature: t.string,
    /** Gas limit for the transaction */
    gasLimit: t.number,
    /** Gas price for the transaction */
    gasPrice: t.number,
    /** The token contract address being recovered */
    tokenContractAddress: t.string,
    /** The wallet ID */
    walletId: t.string,
  }),
});

/**
 * Recover unsupported tokens from a BitGo multisig wallet
 *
 * This endpoint builds a half-signed transaction to recover unsupported tokens from an ETH wallet.
 * The transaction can be manually submitted to BitGo for cosigning, or automatically broadcast
 * by setting the 'broadcast' parameter to true.
 *
 * Note: This endpoint is only supported for ETH family wallets.
 *
 * @tag express
 * @operationId express.v2.wallet.recovertoken
 */
export const PostWalletRecoverToken = httpRoute({
  path: '/api/v2/:coin/wallet/:id/recovertoken',
  method: 'POST',
  request: httpRequest({
    params: RecoverTokenParams,
    body: RecoverTokenBody,
  }),
  response: {
    /** Successfully created token recovery transaction */
    200: RecoverTokenResponse,
    /** Invalid request or token recovery fails */
    400: BitgoExpressError,
  },
});
