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
 * EIP1559 transaction parameters for Ethereum
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:1106
 */
export const EIP1559 = t.partial({
  /** Maximum fee per gas */
  maxFeePerGas: t.union([t.string, t.number]),
  /** Maximum priority fee per gas */
  maxPriorityFeePerGas: t.union([t.string, t.number]),
});

/**
 * Recipient information for a transaction
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:1100-1102
 */
export const Recipient = t.partial({
  /** Recipient address */
  address: t.string,
  /** Amount to send */
  amount: t.union([t.string, t.number]),
  /** Token name (for token transfers) */
  tokenName: t.string,
  /** Additional data */
  data: t.string,
});

/**
 * Hop transaction data for Ethereum
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:1110
 */
export const HopTransaction = t.partial({
  /** Transaction hex */
  txHex: t.string,
  /** User request signature */
  userReqSig: t.string,
  /** Maximum gas price */
  gasPriceMax: t.union([t.string, t.number]),
  /** Gas limit */
  gasLimit: t.union([t.string, t.number]),
});

/**
 * Half-signed transaction data
 */
export const HalfSignedData = t.partial({
  /** Transaction hash */
  txHash: t.string,
  /** Transaction payload */
  payload: t.string,
  /** Transaction in base64 format */
  txBase64: t.string,
});

/**
 * Transaction prebuild information
 * Reference: modules/abstract-utxo/src/abstractUtxoCoin.ts:336-346
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:1088-1116
 */
export const TransactionPrebuild = t.partial({
  /** Transaction in hex format */
  txHex: t.string,
  /** Transaction in base64 format (for some coins like Solana) */
  txBase64: t.string,
  /** Transaction info with unspents (for UTXO coins) - coin-specific structure, varies by coin type */
  txInfo: t.any,
  /** Wallet ID for the transaction */
  walletId: t.string,
  /** Transaction request ID (for TSS transactions) */
  txRequestId: t.string,
  /** Consolidate ID */
  consolidateId: t.string,
  /** Next contract sequence ID (for ETH) */
  nextContractSequenceId: t.number,
  /** Whether this is a batch transaction (for ETH) */
  isBatch: t.boolean,
  /** EIP1559 transaction parameters (for ETH) */
  eip1559: EIP1559,
  /** Hop transaction data (for ETH) */
  hopTransaction: HopTransaction,
  /** Backup key nonce (for ETH) */
  backupKeyNonce: t.union([t.number, t.string]),
  /** Recipients of the transaction */
  recipients: t.array(Recipient),
  /** Gas limit (for EVM chains) */
  gasLimit: t.union([t.string, t.number]),
  /** Gas price (for EVM chains) */
  gasPrice: t.union([t.string, t.number]),
  /** Transaction expiration time */
  expireTime: t.number,
  /** Half-signed transaction data */
  halfSigned: HalfSignedData,
  /** Payload string */
  payload: t.string,
});

/**
 * Request body for signing a transaction
 * Reference: modules/abstract-utxo/src/abstractUtxoCoin.ts:335-362 (UTXO fields)
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:168-177 (EVM fields)
 */
export const CoinSignTxBody = {
  /** Private key for signing (universal field) */
  prv: optional(t.string),
  /** Transaction prebuild data (universal field) */
  txPrebuild: optional(TransactionPrebuild),
  /** Whether this is the last signature in a multi-sig tx */
  isLastSignature: optional(t.boolean),

  // EVM-specific fields
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

  // UTXO-specific fields
  /** Public keys for multi-signature transactions (xpub triple: user, backup, bitgo) */
  pubs: optional(t.array(t.string)),
  /** Cosigner public key (defaults to bitgo) */
  cosignerPub: optional(t.string),
  /** Signing step for MuSig2 */
  signingStep: optional(t.union([t.literal('signerNonce'), t.literal('signerSignature'), t.literal('cosignerNonce')])),
  /** Allow non-segwit signing without previous transaction (deprecated) */
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
 *
 * Used by all account-based coins including:
 * - Generic account coins: Tron, Algorand, Solana, etc. (use txHex/payload/txBase64)
 * - EVM coins: Ethereum, Polygon, etc. (use txHex + EVM-specific fields)
 *
 * This type includes all possible fields as EVM responses are a superset of the base
 * HalfSignedAccountTransaction interface. TypeScript's structural typing allows this
 * since a superset is assignable to the base type.
 *
 * Reference: modules/sdk-core/src/bitgo/baseCoin/iBaseCoin.ts:408-414 (base)
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:1105-1118 (EVM superset)
 */
export const HalfSignedAccountTransactionResponse = t.type({
  halfSigned: t.partial({
    // Generic account-based coin fields
    /** Transaction in hex format (used by most account coins) */
    txHex: t.string,
    /** Transaction payload (used by some account coins) */
    payload: t.string,
    /** Transaction in base64 format (used by some account coins) */
    txBase64: t.string,

    // Additional EVM-specific fields (superset)
    /** Transaction recipients (EVM) */
    recipients: t.array(Recipient),
    /** Expiration timestamp (EVM) */
    expiration: t.number,
    /** Expire time timestamp (EVM) */
    expireTime: t.number,
    /** Contract sequence ID (EVM) */
    contractSequenceId: t.number,
    /** Sequence ID for replay protection (EVM) */
    sequenceId: t.number,
    /** EIP1559 parameters (EVM) */
    eip1559: EIP1559,
    /** Hop transaction data (EVM) */
    hopTransaction: HopTransaction,
    /** Custodian transaction ID (EVM) */
    custodianTransactionId: t.string,
    /** Whether this is a batch transaction (EVM) */
    isBatch: t.boolean,
  }),
});

/**
 * Response for a half-signed UTXO transaction (Bitcoin, Litecoin, etc.)
 * Reference: modules/sdk-core/src/bitgo/baseCoin/iBaseCoin.ts:404-406
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
 *
 * Response types match the SDK's SignedTransaction union:
 * - FullySignedTransactionResponse: Fully signed transaction with txHex
 * - HalfSignedAccountTransactionResponse: Half-signed account-based coins (includes EVM, Algorand, Solana, Tron, etc.)
 * - HalfSignedUtxoTransactionResponse: Half-signed UTXO coins (Bitcoin, Litecoin, etc.)
 * - SignedTransactionRequestResponse: TSS transaction request with txRequestId
 * - TxRequestResponse: Full TSS transaction request (Lite/Full versions)
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
 *
 * Universal fields:
 * - txPrebuild: Contains transaction data like txHex or txBase64
 * - prv: Private key for signing
 * - isLastSignature: Whether this is the last signature in a multi-sig tx
 *
 * EVM-specific fields (Ethereum, Polygon, etc.):
 * - gasLimit: Gas limit for transactions
 * - gasPrice: Gas price for transactions
 * - expireTime: Transaction expiration time
 * - sequenceId: Sequence ID for replay protection
 * - recipients: Transaction recipients
 * - custodianTransactionId: Custodian transaction ID
 * - walletVersion: Wallet version
 * - isEvmBasedCrossChainRecovery: For cross-chain recovery
 *
 * UTXO-specific fields (Bitcoin, Litecoin, etc.):
 * - pubs: Public keys array (xpub triple: user, backup, bitgo)
 * - cosignerPub: Cosigner's public key (defaults to bitgo)
 * - signingStep: MuSig2 signing step
 * - allowNonSegwitSigningWithoutPrevTx: Legacy parameter
 *
 * @tag express
 * @operationId express.v2.coin.signtx
 */
export const PostCoinSignTx = httpRoute({
  path: '/api/v2/{coin}/signtx',
  method: 'POST',
  request: httpRequest({
    params: CoinSignTxParams,
    body: CoinSignTxBody,
  }),
  response: CoinSignTxResponse,
});
