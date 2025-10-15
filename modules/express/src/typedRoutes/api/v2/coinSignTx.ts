import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for signing a transaction
 */
export const CoinSignTxParams = {
  /** The coin type */
  coin: t.string,
} as const;

/**
 * Transaction prebuild information
 */
export const TransactionPrebuild = t.partial({
  /** Transaction in hex format */
  txHex: t.string,
  /** Transaction in base64 format (for some coins) */
  txBase64: t.string,
  /** Transaction in JSON format (for some coins) */
  txInfo: t.any,
  /** Wallet ID for the transaction */
  walletId: t.string,
  /** Next contract sequence ID (for ETH) */
  nextContractSequenceId: t.number,
  /** Whether this is a batch transaction (for ETH) */
  isBatch: t.boolean,
  /** EIP1559 transaction parameters (for ETH) */
  eip1559: t.any,
  /** Hop transaction data (for ETH) */
  hopTransaction: t.any,
  /** Backup key nonce (for ETH) */
  backupKeyNonce: t.any,
  /** Recipients of the transaction */
  recipients: t.any,
});

/**
 * Request body for signing a transaction
 */
export const CoinSignTxBody = {
  /** Private key for signing */
  prv: optional(t.string),
  /** Transaction prebuild data */
  txPrebuild: optional(TransactionPrebuild),
  /** Whether this is the last signature in a multi-sig tx */
  isLastSignature: optional(t.boolean),
  /** Gas limit for ETH transactions */
  gasLimit: optional(t.union([t.string, t.number])),
  /** Gas price for ETH transactions */
  gasPrice: optional(t.union([t.string, t.number])),
  /** Transaction expiration time */
  expireTime: optional(t.number),
  /** Sequence ID for transactions */
  sequenceId: optional(t.number),
  /** Public keys for multi-signature transactions */
  pubKeys: optional(t.array(t.string)),
  /** For EVM cross-chain recovery */
  isEvmBasedCrossChainRecovery: optional(t.boolean),
  /** Recipients of the transaction */
  recipients: optional(t.any),
  /** Custodian transaction ID */
  custodianTransactionId: optional(t.string),
  /** Signing step for MuSig2 */
  signingStep: optional(t.union([t.literal('signerNonce'), t.literal('signerSignature'), t.literal('cosignerNonce')])),
  /** Allow non-segwit signing without previous transaction */
  allowNonSegwitSigningWithoutPrevTx: optional(t.boolean),
} as const;

/**
 * Response for a fully signed transaction
 */
export const FullySignedTransactionResponse = t.type({
  /** Transaction in hex format */
  txHex: t.string,
});

/**
 * Response for a half-signed account transaction
 */
export const HalfSignedAccountTransactionResponse = t.type({
  halfSigned: t.partial({
    txHex: optional(t.string),
    payload: optional(t.string),
    txBase64: optional(t.string),
  }),
});

/**
 * Response for a half-signed UTXO transaction
 */
export const HalfSignedUtxoTransactionResponse = t.type({
  txHex: t.string,
});

/**
 * Response for a transaction request
 */
export const SignedTransactionRequestResponse = t.type({
  txRequestId: t.string,
});

/**
 * Response for signing a transaction
 *
 * Uses TxRequestResponse (TransactionRequest) from @bitgo/public-types for TSS transaction requests
 * (supports both Lite and Full versions)
 */
export const CoinSignTxResponse = {
  /** Successfully signed transaction */
  200: t.union([
    FullySignedTransactionResponse,
    HalfSignedAccountTransactionResponse,
    HalfSignedUtxoTransactionResponse,
    SignedTransactionRequestResponse,
    TxRequestResponse,
  ]),
  /** Error response */
  400: BitgoExpressError,
};

/**
 * Sign a transaction for a specific coin
 *
 * This endpoint signs a transaction for a specific coin type.
 * The request body is passed directly to coin.signTransaction() and varies by coin.
 * Common fields include:
 * - txPrebuild: Contains transaction data like txHex or txBase64
 * - prv: Private key for signing
 * - isLastSignature: Whether this is the last signature in a multi-sig tx
 * - gasLimit: Gas limit for ETH transactions
 * - gasPrice: Gas price for ETH transactions
 * - expireTime: Transaction expiration time
 * - sequenceId: Sequence ID for transactions
 * - pubKeys: Public keys for multi-signature transactions
 * - isEvmBasedCrossChainRecovery: For EVM cross-chain recovery
 *
 * @tag express
 * @operationId express.v2.coin.signtx
 */
export const PostCoinSignTx = httpRoute({
  path: '/api/v2/:coin/signtx',
  method: 'POST',
  request: httpRequest({
    params: CoinSignTxParams,
    body: CoinSignTxBody,
  }),
  response: CoinSignTxResponse,
});
