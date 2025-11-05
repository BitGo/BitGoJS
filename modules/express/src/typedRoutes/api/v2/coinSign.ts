import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import { BitgoExpressError } from '../../schemas/error';
import {
  TransactionPrebuild,
  Recipient,
  FullySignedTransactionResponse,
  HalfSignedAccountTransactionResponse,
  HalfSignedUtxoTransactionResponse,
  SignedTransactionRequestResponse,
} from './coinSignTx';

/**
 * Request parameters for signing a transaction (external signer mode)
 */
export const CoinSignParams = {
  /** The coin type */
  coin: t.string,
} as const;

/**
 * Transaction prebuild information for external signing
 *
 * Same as TransactionPrebuild from coinSignTx, but with walletId as REQUIRED field.
 * The walletId is required for retrieving the encrypted private key from the filesystem.
 *
 * This is enforced by the handler at runtime (clientRoutes.ts:513-517).
 *
 * Reference: modules/express/src/typedRoutes/api/v2/coinSignTx.ts:102-191 (TransactionPrebuild)
 * Handler validation: modules/express/src/clientRoutes.ts:513-517 (handleV2Sign)
 */
export const TransactionPrebuildForExternalSigning = t.intersection([
  t.type({
    /** Wallet ID - REQUIRED for retrieving encrypted private key from filesystem */
    walletId: t.string,
  }),
  TransactionPrebuild,
]);

/**
 * Request body for signing a transaction in external signer mode
 *
 * This route is used when BitGo Express is configured with external signing.
 * The private key is retrieved from the filesystem and decrypted using
 * a wallet passphrase stored in the environment variable WALLET_{walletId}_PASSPHRASE.
 *
 * Fields are similar to CoinSignTxBody except:
 * - NO `prv` field (added automatically by handler from filesystem)
 * - HAS `derivationSeed` field (unique to external signing)
 * - `txPrebuild` has required `walletId` field
 *
 * Reference: modules/express/src/typedRoutes/api/v2/coinSignTx.ts:250-293 (CoinSignTxBody)
 * Handler: modules/express/src/clientRoutes.ts:512-539 (handleV2Sign)
 */
export const CoinSignBody = {
  /** Transaction prebuild data - must contain walletId (REQUIRED) */
  txPrebuild: TransactionPrebuildForExternalSigning,

  /**
   * Derivation seed for deriving a child key from the main private key.
   * If provided, the key will be derived using coin.deriveKeyWithSeed()
   * UNIQUE TO EXTERNAL SIGNING - not present in CoinSignTxBody
   */
  derivationSeed: optional(t.string),

  // ============ Universal fields ============
  /** Whether this is the last signature in a multi-sig tx */
  isLastSignature: optional(t.boolean),

  // ============ EVM-specific fields ============
  /** Gas limit for ETH transactions */
  gasLimit: optional(t.union([t.string, t.number])),
  /** Gas price for ETH transactions */
  gasPrice: optional(t.union([t.string, t.number])),
  /** Transaction expiration time */
  expireTime: optional(t.number),
  /** Sequence ID for transactions */
  sequenceId: optional(t.number),
  /** Recipients of the transaction */
  recipients: optional(t.array(Recipient)),
  /** Custodian transaction ID */
  custodianTransactionId: optional(t.string),
  /** For EVM cross-chain recovery */
  isEvmBasedCrossChainRecovery: optional(t.boolean),
  /** Wallet version (for EVM) */
  walletVersion: optional(t.number),
  /** Signing key nonce for EVM final signing */
  signingKeyNonce: optional(t.number),
  /** Wallet contract address for EVM final signing */
  walletContractAddress: optional(t.string),

  // ============ UTXO-specific fields ============
  /** Public keys for multi-signature transactions (xpub triple: user, backup, bitgo) */
  pubs: optional(t.array(t.string)),
  /** Cosigner public key (defaults to bitgo) */
  cosignerPub: optional(t.string),
  /** Signing step for MuSig2 */
  signingStep: optional(t.union([t.literal('signerNonce'), t.literal('signerSignature'), t.literal('cosignerNonce')])),
  /** Allow non-segwit signing without previous transaction (deprecated) */
  allowNonSegwitSigningWithoutPrevTx: optional(t.boolean),

  // ============ Solana-specific fields ============
  /** Public keys for Solana transactions */
  pubKeys: optional(t.array(t.string)),
} as const;

/**
 * Response codecs are imported from coinSignTx.ts since both endpoints call the same
 * coin.signTransaction() method and return identical response formats:
 *
 * - FullySignedTransactionResponse: For fully signed transactions (all signatures collected)
 * - HalfSignedAccountTransactionResponse: For half-signed account-based transactions (EVM, Algorand, etc.)
 * - HalfSignedUtxoTransactionResponse: For half-signed UTXO transactions (BTC, LTC, etc.)
 * - SignedTransactionRequestResponse: For TSS transaction requests
 * - TxRequestResponse: For TSS transaction requests (from @bitgo/public-types)
 *
 * Reference: modules/express/src/typedRoutes/api/v2/coinSignTx.ts:267-418 (Response codecs)
 */

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
