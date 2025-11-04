import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for signing a transaction (external signer mode)
 */
export const CoinSignParams = {
  /** The coin type */
  coin: t.string,
} as const;

/**
 * Transaction prebuild information for external signing
 * Requires walletId to retrieve encrypted private key from filesystem
 */
export const TransactionPrebuildForExternalSigning = t.intersection([
  t.type({
    /** Wallet ID - required for retrieving encrypted private key */
    walletId: t.string,
  }),
  t.partial({
    /** Transaction in hex format */
    txHex: t.string,
    /** Transaction in base64 format (for some coins) */
    txBase64: t.string,
    /** Transaction in JSON format (for some coins) */
    txInfo: t.any,
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
  }),
]);

/**
 * Request body for signing a transaction in external signer mode
 *
 * This route is used when BitGo Express is configured with external signing.
 * The private key is retrieved from the filesystem and decrypted using
 * a wallet passphrase stored in the environment variable WALLET_{walletId}_PASSPHRASE.
 */
export const CoinSignBody = {
  /** Transaction prebuild data - must contain walletId */
  txPrebuild: TransactionPrebuildForExternalSigning,
  /**
   * Derivation seed for deriving a child key from the main private key.
   * If provided, the key will be derived using coin.deriveKeyWithSeed()
   */
  derivationSeed: optional(t.string),
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
export const HalfSignedAccountTransactionResponse = t.partial({
  halfSigned: t.partial({
    txHex: t.string,
    payload: t.string,
    txBase64: t.string,
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
 * Response for signing a transaction in external signer mode
 *
 * The response format matches coin.signTransaction() and varies based on:
 * - Whether the transaction is fully or half-signed
 * - The coin type (UTXO vs Account-based)
 * - Whether TSS is used (returns TxRequestResponse)
 */
export const CoinSignResponse = {
  /** Successfully signed transaction */
  200: t.union([
    FullySignedTransactionResponse,
    HalfSignedAccountTransactionResponse,
    HalfSignedUtxoTransactionResponse,
    SignedTransactionRequestResponse,
    TxRequestResponse,
  ]),
  /** Error response - validation or signing errors */
  400: BitgoExpressError,
};

/**
 * Sign a transaction using external signer mode
 *
 * This endpoint is used when BitGo Express is configured with external signing
 * (signerFileSystemPath config is set). It:
 *
 * 1. Retrieves the encrypted private key from the filesystem using walletId
 * 2. Decrypts it using the wallet passphrase from environment (WALLET_{walletId}_PASSPHRASE)
 * 3. Optionally derives a child key if derivationSeed is provided
 * 4. Signs the transaction using the private key
 *
 * **Configuration Requirements:**
 * - `signerFileSystemPath`: Path to JSON file containing encrypted private keys
 * - Environment variable: `WALLET_{walletId}_PASSPHRASE` for each wallet
 *
 * **Request Body:**
 * - `txPrebuild`: Transaction prebuild data (must include walletId)
 * - `derivationSeed`: Optional seed for deriving a child key
 * - Other fields are passed to coin.signTransaction()
 *
 * **Response:**
 * - Fully signed transaction (if all signatures collected)
 * - Half-signed transaction (if more signatures needed)
 * - Transaction request ID (for TSS wallets)
 *
 * @tag express
 * @operationId express.v2.coin.sign
 */
export const PostCoinSign = httpRoute({
  path: '/api/v2/{coin}/sign',
  method: 'POST',
  request: httpRequest({
    params: CoinSignParams,
    body: CoinSignBody,
  }),
  response: CoinSignResponse,
});
