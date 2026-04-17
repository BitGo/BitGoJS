import * as t from 'io-ts';
import { httpRoute, httpRequest, optional, type HttpRoute } from '@api-ts/io-ts-http';
import { TransactionRequest as TxRequestResponse, TransactionRequestApiVersion } from '@bitgo/public-types';
import { BitgoExpressError } from '../../schemas/error';
import { Recipient } from './coinSignTx';

/**
 * Request path parameters for signing a TSS wallet transaction
 */
export const WalletTxSignTSSParams = {
  /** A cryptocurrency or token ticker symbol */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Transaction prebuild information for TSS wallet signing
 */
export const WalletTxSignTSSTransactionPrebuild = t.partial({
  /** Transaction in hex format */
  txHex: t.string,
  /** Transaction in base64 format (for some coins) */
  txBase64: t.string,
  /** Transaction in JSON format (for some coins) */
  txInfo: t.any,
  /** Wallet ID for the transaction */
  walletId: t.string,
  /** Transaction request ID for TSS wallets */
  txRequestId: t.string,
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
  recipients: t.array(Recipient),
});

/**
 * Request body for signing a TSS wallet transaction
 */
export const WalletTxSignTSSBody = {
  /** Transaction prebuild data */
  txPrebuild: optional(WalletTxSignTSSTransactionPrebuild),
  /** A unique ID for the TxRequest document across all wallets. The combination of the txRequestId and version will always be unique */
  txRequestId: optional(t.string),
  /** Wallet passphrase for TSS wallets */
  walletPassphrase: optional(t.string),
  /** Public keys for multi-signature transactions */
  pubs: optional(t.array(t.string)),
  /** Private key for signing (for non-TSS wallets, rarely used with TSS) */
  prv: optional(t.string),
  /** Cosigner public key */
  cosignerPub: optional(t.string),
  /** Whether this is the last signature in a multi-sig tx */
  isLastSignature: optional(t.boolean),
  /** API version: 'lite' or 'full' */
  apiVersion: optional(TransactionRequestApiVersion),
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
  recipients: optional(t.array(Recipient)),
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
 * Response for signing a TSS wallet transaction
 *
 * Uses TxRequestResponse (TransactionRequest) from @bitgo/public-types for TSS transaction requests
 * (supports both Lite and Full versions)
 */
export const WalletTxSignTSSResponse = {
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
 * Sign transactions for MPC wallets. If using external-signer mode, you must maintain your keys, in the clear, on a separate Express server - BitGo doesn't decrypt your private MPC key shares.
 *
 * @operationId express.wallet.signtxtss
 * @tag Express
 */
export const PostWalletTxSignTSS: HttpRoute<'post'> = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/signtxtss',
  method: 'POST',
  request: httpRequest({
    params: WalletTxSignTSSParams,
    body: WalletTxSignTSSBody,
  }),
  response: WalletTxSignTSSResponse,
});
