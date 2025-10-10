import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request path parameters for signing a wallet transaction
 */
export const WalletSignTxParams = {
  /** The coin type */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Transaction prebuild information for wallet signing
 */
export const WalletTransactionPrebuild = t.partial({
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
 * Request body for signing a wallet transaction
 */
export const WalletSignTxBody = {
  /** Private key for signing */
  prv: optional(t.string),
  /** Transaction prebuild data */
  txPrebuild: optional(WalletTransactionPrebuild),
  /** Public keys for multi-signature transactions */
  pubs: optional(t.array(t.string)),
  /** Transaction request ID for TSS wallets */
  txRequestId: optional(t.string),
  /** Cosigner public key */
  cosignerPub: optional(t.string),
  /** Whether this is the last signature in a multi-sig tx */
  isLastSignature: optional(t.boolean),
  /** Wallet passphrase for TSS wallets */
  walletPassphrase: optional(t.string),
  /** API version: 'lite' or 'full' */
  apiVersion: optional(t.union([t.literal('lite'), t.literal('full')])),
  /** Multisig type version */
  multisigTypeVersion: optional(t.literal('MPCv2')),
  /** Gas limit for ETH transactions */
  gasLimit: optional(t.union([t.string, t.number])),
  /** Gas price for ETH transactions */
  gasPrice: optional(t.union([t.string, t.number])),
  /** Transaction expiration time */
  expireTime: optional(t.number),
  /** Sequence ID for transactions */
  sequenceId: optional(t.union([t.string, t.number])),
  /** Recipients of the transaction */
  recipients: optional(t.any),
  /** Custodian transaction ID */
  custodianTransactionId: optional(t.string),
  /** Signing step for MuSig2 */
  signingStep: optional(t.union([t.literal('signerNonce'), t.literal('signerSignature'), t.literal('cosignerNonce')])),
  /** Allow non-segwit signing without previous transaction */
  allowNonSegwitSigningWithoutPrevTx: optional(t.boolean),
  /** For EVM cross-chain recovery */
  isEvmBasedCrossChainRecovery: optional(t.boolean),
  /** Derivation seed for key derivation */
  derivationSeed: optional(t.string),
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
 * Response for signing a wallet transaction
 *
 * Uses TxRequestResponse (TransactionRequest) from @bitgo/public-types for TSS transaction requests
 * (supports both Lite and Full versions)
 */
export const WalletSignTxResponse = {
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
 * Sign a transaction for a specific wallet
 *
 * This endpoint signs a transaction for a specific wallet identified by coin type and wallet ID.
 * The request body is passed to wallet.signTransaction() and varies by coin and wallet type.
 *
 * Common fields include:
 * - txPrebuild: Contains transaction data like txHex or txBase64
 * - prv: Private key for signing (for non-TSS wallets)
 * - walletPassphrase: Passphrase for TSS wallets
 * - txRequestId: Transaction request ID for TSS wallets
 * - isLastSignature: Whether this is the last signature in a multi-sig tx
 * - pubs: Public keys for multi-signature transactions
 * - apiVersion: 'lite' or 'full' for TSS transaction requests
 * - gasLimit: Gas limit for ETH transactions
 * - gasPrice: Gas price for ETH transactions
 * - expireTime: Transaction expiration time
 * - sequenceId: Sequence ID for transactions
 * - isEvmBasedCrossChainRecovery: For EVM cross-chain recovery
 *
 * @operationId express.v2.wallet.signtx
 */
export const PostWalletSignTx = httpRoute({
  path: '/api/v2/:coin/wallet/:id/signtx',
  method: 'POST',
  request: httpRequest({
    params: WalletSignTxParams,
    body: WalletSignTxBody,
  }),
  response: WalletSignTxResponse,
});
