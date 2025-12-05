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
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:116-119
 *
 * Note: Changed to t.partial() to support multiple use cases:
 * 1. Full EIP1559 transactions: { maxFeePerGas, maxPriorityFeePerGas }
 * 2. Legacy token transactions: { isEip1559: false } (SDK marker for non-EIP1559)
 * 3. Legacy base coin transactions: undefined (field omitted entirely)
 */
export const EIP1559 = t.partial({
  /** Maximum priority fee per gas */
  maxPriorityFeePerGas: t.union([t.string, t.number]),
  /** Maximum fee per gas */
  maxFeePerGas: t.union([t.string, t.number]),
  /** Flag indicating whether transaction uses EIP1559 fee model */
  isEip1559: t.boolean,
});

/**
 * Replay protection options for EVM transactions
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:121-124
 * Note: Both fields are REQUIRED when ReplayProtectionOptions object is provided
 */
export const ReplayProtectionOptions = t.type({
  /** Chain ID (REQUIRED) */
  chain: t.union([t.string, t.number]),
  /** Hardfork name (REQUIRED) */
  hardfork: t.string,
});

/**
 * Recipient information for a transaction
 * Reference: modules/sdk-core/src/bitgo/baseCoin/iBaseCoin.ts:468-472 (Recipient)
 * Reference: modules/sdk-core/src/bitgo/baseCoin/iBaseCoin.ts:79-84 (ITransactionRecipient)
 * Validation: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:622-642
 *
 * Note: address and amount are REQUIRED (accessed without null checks in SDK validation)
 * tokenName, data, and memo are OPTIONAL
 */
export const Recipient = t.intersection([
  t.type({
    /** Recipient address (REQUIRED) */
    address: t.string,
    /** Amount to send (REQUIRED) */
    amount: t.union([t.string, t.number]),
  }),
  t.partial({
    /** Token name (for token transfers) (OPTIONAL) */
    tokenName: t.string,
    /** Additional data (EVM) (OPTIONAL) */
    data: t.string,
    /** Memo field (used in ITransactionRecipient for various coins) (OPTIONAL) */
    memo: t.string,
  }),
]);

/**
 * Hop transaction data for Ethereum
 * Reference: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:90-102 (HopPrebuild - full interface)
 * Note: All fields are REQUIRED when HopPrebuild object is provided
 */
export const HopTransaction = t.type({
  /** Transaction hex (REQUIRED) */
  tx: t.string,
  /** Transaction ID (REQUIRED) */
  id: t.string,
  /** Signature (REQUIRED) */
  signature: t.string,
  /** Payment ID (REQUIRED) */
  paymentId: t.string,
  /** Gas price (REQUIRED) */
  gasPrice: t.number,
  /** Gas limit (REQUIRED) */
  gasLimit: t.number,
  /** Amount to send (REQUIRED) */
  amount: t.number,
  /** Recipient address (REQUIRED) */
  recipient: t.string,
  /** Transaction nonce (REQUIRED) */
  nonce: t.number,
  /** User request signature (REQUIRED) */
  userReqSig: t.string,
  /** Maximum gas price (REQUIRED) */
  gasPriceMax: t.number,
});

/**
 * Half-signed transaction data
 *
 * This covers two use cases:
 * 1. Response halfSigned data (txHex, payload, txBase64, txHash) - general coins
 * 2. Request txPrebuild.halfSigned for EVM final signing (expireTime, contractSequenceId, backupKeyNonce, signature, txHex)
 *
 * Reference:
 * - Response: modules/sdk-core/src/bitgo/baseCoin/iBaseCoin.ts:408-414
 * - Request: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:147-153 (SignFinalOptions.txPrebuild.halfSigned)
 */
export const HalfSignedData = t.partial({
  // From response/general usage (HalfSignedAccountTransaction)
  /** Transaction in hex format */
  txHex: t.string,
  /** Transaction payload */
  payload: t.string,
  /** Transaction in base64 format */
  txBase64: t.string,
  /** Transaction hash */
  txHash: t.string,

  // From SignFinalOptions.txPrebuild.halfSigned (EVM final signing request)
  /** Expiration time (EVM final signing) */
  expireTime: t.number,
  /** Contract sequence ID (EVM final signing) */
  contractSequenceId: t.number,
  /** Backup key nonce (EVM final signing) */
  backupKeyNonce: t.number,
  /** Signature (EVM final signing) */
  signature: t.string,
});

/**
 * Build parameters structure
 * Reference: modules/sdk-core/src/bitgo/baseCoin/iBaseCoin.ts:315-318
 */
export const BuildParams = t.partial({
  /** Preview mode flag */
  preview: t.boolean,
  /** Recipients for the transaction */
  recipients: t.array(Recipient),
});

/**
 * Address information for transaction signing (used by Tron, Tezos, etc.)
 * Reference: modules/sdk-coin-trx/src/trx.ts:55-59
 * Note: All fields are REQUIRED when AddressInfo object is provided
 */
export const AddressInfo = t.type({
  /** Address string (REQUIRED) */
  address: t.string,
  /** Chain index for address derivation (REQUIRED) */
  chain: t.number,
  /** Address index for derivation (REQUIRED) */
  index: t.number,
});

/**
 * Transaction prebuild information
 *
 * Base interface: modules/sdk-core/src/bitgo/baseCoin/iBaseCoin.ts:327-331
 * EVM extension: modules/abstract-eth/src/abstractEthLikeNewCoins.ts:126-138
 * UTXO extension: modules/abstract-utxo/src/abstractUtxoCoin.ts:248-251
 *
 * This codec covers all fields from:
 * - SDK Core Base (txBase64, txHex, txInfo, buildParams, consolidateId, txRequestId)
 * - EVM-specific (coin, token, nextContractSequenceId, isBatch, eip1559, hopTransaction, etc.)
 * - UTXO-specific (blockHeight)
 * - Account-based coins (addressInfo, source, feeInfo, keys, addressVersion, etc.)
 */
export const TransactionPrebuild = t.partial({
  // ============ Base SDK Core fields ============
  /** Transaction in hex format */
  txHex: t.string,
  /** Transaction in base64 format (Solana, Stellar, etc.) */
  txBase64: t.string,
  /** Transaction info with unspents (UTXO coins) - coin-specific structure */
  txInfo: t.any,
  /** Build parameters including recipients (from BaseSignable) */
  buildParams: BuildParams,
  /** Consolidate ID (from BaseSignable) */
  consolidateId: t.string,
  /** Transaction request ID for TSS transactions (from BaseSignable) */
  txRequestId: t.string,

  // ============ Universal fields ============
  /** Wallet ID for the transaction */
  walletId: t.string,
  /** Transaction expiration time */
  expireTime: t.number,
  /** Half-signed transaction data */
  halfSigned: HalfSignedData,
  /** Payload string */
  payload: t.string,

  // ============ EVM-specific fields ============
  /** Coin identifier (EVM - required in EVM interface) */
  coin: t.string,
  /** Token identifier (EVM - optional in EVM interface) */
  token: t.string,
  /** Next contract sequence ID (EVM) */
  nextContractSequenceId: t.number,
  /** Whether this is a batch transaction (EVM) */
  isBatch: t.boolean,
  /** EIP1559 transaction parameters (EVM) */
  eip1559: EIP1559,
  /** Replay protection options (EVM) */
  replayProtectionOptions: ReplayProtectionOptions,
  /** Hop transaction data (EVM) - can be string (in SignFinalOptions) or HopPrebuild object (in TransactionPrebuild) */
  hopTransaction: t.union([t.string, HopTransaction]),
  /** Backup key nonce (EVM) */
  backupKeyNonce: t.union([t.number, t.string]),
  /** Recipients of the transaction */
  recipients: t.array(Recipient),
  /** Gas limit (EVM chains) */
  gasLimit: t.union([t.string, t.number]),
  /** Gas price (EVM chains) */
  gasPrice: t.union([t.string, t.number]),

  // ============ UTXO-specific fields ============
  /** Block height (UTXO coins) */
  blockHeight: t.number,

  // ============ Account-based coin specific fields ============
  /** Address information for derivation (Tron, Tezos) - USED in Tron signTransaction */
  addressInfo: AddressInfo,
  /** Source address (Solana, Tezos, Hedera, Flare) */
  source: t.string,
  /** Fee information (Tron, Tezos, Hedera) - coin-specific structure */
  feeInfo: t.any,
  /** Data to sign (Tezos) */
  dataToSign: t.string,
  /** Keys array (Algorand) */
  keys: t.array(t.string),
  /** Address version (Algorand) */
  addressVersion: t.number,

  // ============ Near-specific fields ============
  /** Key for Near transactions */
  key: t.string,
  /** Block hash for Near transactions */
  blockHash: t.string,
  /** Nonce for Near transactions (bigint in SDK, but JSON uses number/string) */
  nonce: t.any,

  // ============ Polkadot-specific fields ============
  /** Transaction data for Polkadot */
  transaction: t.any,
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
  /** Signing key nonce for EVM final signing */
  signingKeyNonce: optional(t.number),
  /** Wallet contract address for EVM final signing */
  walletContractAddress: optional(t.string),

  // UTXO-specific fields
  /** Public keys for multi-signature transactions (xpub triple: user, backup, bitgo) */
  pubs: optional(t.array(t.string)),
  /** Cosigner public key (defaults to bitgo) */
  cosignerPub: optional(t.string),
  /** Signing step for MuSig2 */
  signingStep: optional(t.union([t.literal('signerNonce'), t.literal('signerSignature'), t.literal('cosignerNonce')])),
  /** Allow non-segwit signing without previous transaction (deprecated) */
  allowNonSegwitSigningWithoutPrevTx: optional(t.boolean),

  // Solana-specific fields
  /** Public keys for Solana transactions */
  pubKeys: optional(t.array(t.string)),
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
    /** Hop transaction data (EVM) - can be string or object */
    hopTransaction: t.union([t.string, HopTransaction]),
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
