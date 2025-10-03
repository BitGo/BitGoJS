import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for signing a transaction
 */
export const CoinSignTxParams = {
  /** The coin type */
  coin: t.string,
};

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
};

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
 * Wallet types
 */
export const WalletType = t.union([
  t.literal('backing'),
  t.literal('cold'),
  t.literal('custodial'),
  t.literal('custodialPaired'),
  t.literal('hot'),
  t.literal('trading'),
  t.literal('advanced'),
]);

/**
 * Transaction request states
 */
export const TxRequestState = t.union([
  t.literal('pendingCommitment'),
  t.literal('pendingApproval'),
  t.literal('canceled'),
  t.literal('rejected'),
  t.literal('initialized'),
  t.literal('pendingDelivery'),
  t.literal('delivered'),
  t.literal('pendingUserSignature'),
  t.literal('signed'),
]);

/**
 * Transaction states
 */
export const TransactionState = t.union([
  t.literal('initialized'),
  t.literal('pendingCommitment'),
  t.literal('pendingSignature'),
  t.literal('signed'),
  t.literal('held'),
  t.literal('delivered'),
  t.literal('invalidSignature'),
  t.literal('rejected'),
]);

/**
 * Signature share types
 */
export const SignatureShareType = t.union([t.literal('user'), t.literal('backup'), t.literal('bitgo')]);

/**
 * Commitment types
 */
export const CommitmentType = t.union([t.literal('commitment'), t.literal('decommitment')]);

/**
 * Signature share record
 */
export const SignatureShareRecord = t.type({
  from: SignatureShareType,
  to: SignatureShareType,
  share: t.string,
  vssProof: optional(t.string),
  privateShareProof: optional(t.string),
  publicShare: optional(t.string),
});

/**
 * Commitment share record
 */
export const CommitmentShareRecord = t.type({
  from: SignatureShareType,
  to: SignatureShareType,
  share: t.string,
  type: CommitmentType,
});

/**
 * Unsigned transaction TSS
 */
export const UnsignedTransactionTss = t.type({
  serializedTxHex: t.string,
  signableHex: t.string,
  derivationPath: t.string,
  feeInfo: optional(
    t.type({
      fee: t.number,
      feeString: t.string,
    })
  ),
  coinSpecific: optional(t.record(t.string, t.unknown)),
  parsedTx: optional(t.unknown),
});

/**
 * Unsigned message TSS
 */
export const UnsignedMessageTss = t.type({
  derivationPath: t.string,
  message: t.string,
});

/**
 * Signed transaction
 */
export const SignedTx = t.type({
  id: t.string,
  tx: t.string,
  publicKey: optional(t.string),
  signature: optional(t.string),
});

/**
 * Transaction record
 */
export const TransactionRecord = t.type({
  state: TransactionState,
  unsignedTx: UnsignedTransactionTss,
  signatureShares: t.array(SignatureShareRecord),
  signedTx: optional(SignedTx),
  commitmentShares: optional(t.array(CommitmentShareRecord)),
});

/**
 * Message record
 */
export const MessageRecord = t.type({
  state: TransactionState,
  signatureShares: t.array(SignatureShareRecord),
  messageRaw: t.string,
  messageEncoded: optional(t.string),
  messageBroadcastable: optional(t.string),
  messageStandardType: optional(t.string),
  derivationPath: t.string,
  combineSigShare: optional(t.string),
  txHash: optional(t.string),
  commitmentShares: optional(t.array(CommitmentShareRecord)),
});

/**
 * Response for a TSS transaction request
 */
export const TxRequestResponse = t.type({
  txRequestId: t.string,
  walletId: t.string,
  walletType: WalletType,
  version: t.number,
  enterpriseId: optional(t.string),
  state: TxRequestState,
  date: t.string,
  userId: t.string,
  intent: t.unknown,
  pendingApprovalId: optional(t.string),
  policiesChecked: t.boolean,
  signatureShares: optional(t.array(SignatureShareRecord)),
  commitmentShares: optional(t.array(CommitmentShareRecord)),
  pendingTxHashes: optional(t.array(t.string)),
  txHashes: optional(t.array(t.string)),
  unsignedMessages: optional(t.array(UnsignedMessageTss)),
  unsignedTxs: t.array(UnsignedTransactionTss),
  transactions: optional(t.array(TransactionRecord)),
  messages: optional(t.array(MessageRecord)),
  apiVersion: optional(t.union([t.literal('full'), t.literal('lite')])),
  latest: t.boolean,
});

/**
 * Response for signing a transaction
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
