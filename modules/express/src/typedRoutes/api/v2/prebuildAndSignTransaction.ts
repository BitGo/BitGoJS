import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import { BitgoExpressError } from '../../schemas/error';
import {
  FullySignedTransactionResponse,
  HalfSignedAccountTransactionResponse,
  HalfSignedUtxoTransactionResponse,
  SignedTransactionRequestResponse,
  EIP1559,
} from './coinSignTx';

/**
 * Request parameters for prebuild and sign transaction
 */
export const PrebuildAndSignTransactionParams = {
  /** The coin type */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Token enablement configuration
 * Reference: modules/sdk-core/src/bitgo/utils/tss/baseTypes.ts:35-38
 */
export const TokenEnablement = t.intersection([
  t.type({
    /** Token name (REQUIRED) */
    name: t.string,
  }),
  t.partial({
    /** Token address - Solana requires tokens to be enabled for specific address (OPTIONAL) */
    address: t.string,
  }),
]);

/**
 * Memo information for transactions (e.g., Stellar, EOS)
 * Reference: modules/sdk-core/src/bitgo/wallet/iWallet.ts:57-60
 * Both fields are REQUIRED when memo object is present
 */
export const Memo = t.type({
  /** Memo value (REQUIRED) */
  value: t.string,
  /** Memo type (REQUIRED) */
  type: t.string,
});

/**
 * Recipient information for transactions
 * Reference: modules/sdk-core/src/bitgo/wallet/iWallet.ts:92-97
 *
 */
export const Recipient = t.intersection([
  t.type({
    /** Recipient address (REQUIRED) */
    address: t.string,
    /** Amount to send (REQUIRED) */
    amount: t.union([t.string, t.number]),
  }),
  t.partial({
    /** Token name for token transfers (OPTIONAL) */
    tokenName: t.string,
    /** Token-specific data (OPTIONAL) */
    tokenData: t.any,
  }),
]);

/**
 * Message to sign for transaction
 * Reference: modules/sdk-core/src/bitgo/wallet/iWallet.ts:125
 * Both fields are REQUIRED when message object is present
 */
export const MessageToSign = t.type({
  /** Address (REQUIRED) */
  address: t.string,
  /** Message to sign (REQUIRED) */
  message: t.string,
});

/**
 * Reservation information for transactions
 */
export const Reservation = t.partial({
  /** Expiration time */
  expireTime: t.string,
  /** Pending approval ID */
  pendingApprovalId: t.string,
});

/**
 * Solana instruction account
 */
export const SolInstructionKey = t.partial({
  /** Account public key */
  pubkey: t.string,
  /** Whether account is a signer */
  isSigner: t.boolean,
  /** Whether account is writable */
  isWritable: t.boolean,
});

/**
 * Solana custom instruction
 */
export const SolInstruction = t.partial({
  /** Program ID */
  programId: t.string,
  /** Account keys */
  keys: t.array(SolInstructionKey),
  /** Instruction data */
  data: t.string,
});

/**
 * Solana versioned transaction address lookup table
 */
export const SolAddressLookupTable = t.partial({
  /** Account key */
  accountKey: t.string,
  /** Writable indexes */
  writableIndexes: t.array(t.number),
  /** Readonly indexes */
  readonlyIndexes: t.array(t.number),
});

/**
 * Solana versioned transaction message header
 */
export const SolMessageHeader = t.partial({
  /** Number of required signatures */
  numRequiredSignatures: t.number,
  /** Number of readonly signed accounts */
  numReadonlySignedAccounts: t.number,
  /** Number of readonly unsigned accounts */
  numReadonlyUnsignedAccounts: t.number,
});

/**
 * Solana versioned instruction
 */
export const SolVersionedInstruction = t.partial({
  /** Program ID index */
  programIdIndex: t.number,
  /** Account key indexes */
  accountKeyIndexes: t.array(t.number),
  /** Instruction data */
  data: t.string,
});

/**
 * Solana versioned transaction data
 */
export const SolVersionedTransactionData = t.partial({
  /** Versioned instructions */
  versionedInstructions: t.array(SolVersionedInstruction),
  /** Address lookup tables */
  addressLookupTables: t.array(SolAddressLookupTable),
  /** Static account keys */
  staticAccountKeys: t.array(t.string),
  /** Message header */
  messageHeader: SolMessageHeader,
  /** Recent blockhash */
  recentBlockhash: t.string,
});

/**
 * Aptos custom transaction parameters
 */
export const AptosCustomTransactionParams = t.partial({
  /** Module name */
  moduleName: t.string,
  /** Function name */
  functionName: t.string,
  /** Type arguments */
  typeArguments: t.array(t.string),
  /** Function arguments */
  functionArguments: t.array(t.any),
  /** ABI definition */
  abi: t.any,
});

/**
 * Keychain structure for verification
 */
export const KeychainForVerification = t.partial({
  /** User keychain public key */
  pub: t.string,
  /** Keychain ID */
  id: t.string,
});

/**
 * Keychains for verification
 */
export const KeychainsForVerification = t.partial({
  /** User keychain */
  user: KeychainForVerification,
  /** Backup keychain */
  backup: KeychainForVerification,
  /** BitGo keychain */
  bitgo: KeychainForVerification,
});

/**
 * Address verification data
 */
export const AddressVerificationData = t.partial({
  /** Chain index */
  chain: t.number,
  /** Address index */
  index: t.number,
  /** Coin-specific address data */
  coinSpecific: t.any,
});

/**
 * Fee information
 */
export const FeeInfo = t.partial({
  /** Fee amount */
  fee: t.number,
  /** Fee as string */
  feeString: t.string,
});

/**
 * Consolidation details for sweep/consolidation transactions
 * Reference: modules/sdk-core/src/bitgo/wallet/iWallet.ts:230
 * Note: senderAddressIndex is REQUIRED when consolidationDetails exists
 */
export const ConsolidationDetails = t.type({
  /** Sender address index (REQUIRED) */
  senderAddressIndex: t.number,
});

/**
 * Transaction prebuild result (for when transaction is already prebuilt)
 * Extends TransactionPrebuild with additional fields
 * Reference: modules/sdk-core/src/bitgo/wallet/iWallet.ts:227-242
 */
export const TransactionPrebuildResult = t.intersection([
  t.type({
    /** Wallet ID (REQUIRED) */
    walletId: t.string,
  }),
  t.partial({
    // From TransactionPrebuild
    /** Transaction hex */
    txHex: t.string,
    /** Transaction base64 */
    txBase64: t.string,
    /** Transaction info */
    txInfo: t.any,
    /** Transaction request ID */
    txRequestId: t.string,
    /** Consolidate ID */
    consolidateId: t.string,
    /** Consolidation details */
    consolidationDetails: ConsolidationDetails,
    /** Fee information */
    feeInfo: FeeInfo,
    /** Pending approval ID */
    pendingApprovalId: t.string,
    /** Payload string */
    payload: t.string,
  }),
]);

/**
 * Verification options for transaction verification
 */
export const VerificationOptions = t.partial({
  /** Disable networking for verification */
  disableNetworking: t.boolean,
  /** Keychains for verification */
  keychains: KeychainsForVerification,
  /** Addresses to verify */
  addresses: t.record(t.string, AddressVerificationData),
  /** Allow paygo output */
  allowPaygoOutput: t.boolean,
  /** Consider migrated-from address as internal */
  considerMigratedFromAddressInternal: t.boolean,
  /** Verify token enablement */
  verifyTokenEnablement: t.boolean,
  /** Verify consolidation to base address */
  consolidationToBaseAddress: t.boolean,
});

/**
 * Request body for prebuild and sign transaction
 * Combines all fields from PrebuildAndSignTransactionOptions interface
 */
export const PrebuildAndSignTransactionBody = {
  // === Core PrebuildTransactionOptions fields ===
  /** Recipients of the transaction */
  recipients: optional(t.array(Recipient)),
  /** Number of blocks to use for fee estimation */
  numBlocks: optional(t.number),
  /** Maximum fee rate */
  maxFeeRate: optional(t.number),
  /** Minimum confirmations */
  minConfirms: optional(t.number),
  /** Enforce minimum confirms for change */
  enforceMinConfirmsForChange: optional(t.boolean),
  /** Target wallet unspents */
  targetWalletUnspents: optional(t.number),
  /** Minimum value */
  minValue: optional(t.union([t.number, t.string])),
  /** Maximum value */
  maxValue: optional(t.union([t.number, t.string])),
  /** Sequence ID */
  sequenceId: optional(t.string),
  /** Last ledger sequence (XRP) */
  lastLedgerSequence: optional(t.number),
  /** Ledger sequence delta (XRP) */
  ledgerSequenceDelta: optional(t.number),
  /** Gas price */
  gasPrice: optional(t.number),
  /** Do not split change */
  noSplitChange: optional(t.boolean),
  /** Unspents to use */
  unspents: optional(t.array(t.any)),
  /** Sender address (for specific coins like ADA) */
  senderAddress: optional(t.string),
  /** Sender wallet ID (for BTC unstaking) */
  senderWalletId: optional(t.string),
  /** Messages to sign */
  messages: optional(t.array(MessageToSign)),
  /** Change address */
  changeAddress: optional(t.string),
  /** Allow external change address */
  allowExternalChangeAddress: optional(t.boolean),
  /** Transaction type */
  type: optional(t.string),
  /** Close remainder to address (Algorand) */
  closeRemainderTo: optional(t.string),
  /** Non-participation flag (Algorand) */
  nonParticipation: optional(t.boolean),
  /** Valid from block */
  validFromBlock: optional(t.number),
  /** Valid to block */
  validToBlock: optional(t.number),
  /** Instant send */
  instant: optional(t.boolean),
  /** Memo */
  memo: optional(Memo),
  /** Address type */
  addressType: optional(t.string),
  /** Change address type */
  changeAddressType: optional(t.string),
  /** Use hop transaction (ETH) */
  hop: optional(t.boolean),
  /** Wallet passphrase for signing */
  walletPassphrase: optional(t.string),
  /** Reservation information */
  reservation: optional(Reservation),
  /** Offline verification */
  offlineVerification: optional(t.boolean),
  /** Wallet contract address */
  walletContractAddress: optional(t.string),
  /** IDF signed timestamp */
  idfSignedTimestamp: optional(t.string),
  /** IDF user ID */
  idfUserId: optional(t.string),
  /** IDF version */
  idfVersion: optional(t.number),
  /** Comment */
  comment: optional(t.string),
  /** Token name for token transfers */
  tokenName: optional(t.string),
  /** NFT collection ID */
  nftCollectionId: optional(t.string),
  /** NFT ID */
  nftId: optional(t.string),
  /** Tokens to enable */
  enableTokens: optional(t.array(TokenEnablement)),
  /** Nonce */
  nonce: optional(t.string),
  /** Preview transaction */
  preview: optional(t.boolean),
  /** EIP1559 parameters (ETH) */
  eip1559: optional(EIP1559),
  /** Gas limit */
  gasLimit: optional(t.number),
  /** Low fee transaction ID for CPFP */
  lowFeeTxid: optional(t.string),
  /** Receive address */
  receiveAddress: optional(t.string),
  /** Is TSS transaction */
  isTss: optional(t.boolean),
  /** Custodian transaction ID */
  custodianTransactionId: optional(t.string),
  /** API version ('lite' or 'full') */
  apiVersion: optional(t.union([t.literal('lite'), t.literal('full')])),
  /** Keep alive (for coins with minimum balance) */
  keepAlive: optional(t.boolean),
  /** Transaction format ('legacy', 'psbt', or 'psbt-lite') */
  txFormat: optional(t.union([t.literal('legacy'), t.literal('psbt'), t.literal('psbt-lite')])),
  /** Solana custom instructions */
  solInstructions: optional(t.array(SolInstruction)),
  /** Solana versioned transaction data */
  solVersionedTransactionData: optional(SolVersionedTransactionData),
  /** Aptos custom transaction parameters */
  aptosCustomTransactionParams: optional(AptosCustomTransactionParams),
  /** Transaction request ID */
  txRequestId: optional(t.string),
  /** Whether this is the last signature */
  isLastSignature: optional(t.boolean),
  /** Multisig type version */
  multisigTypeVersion: optional(t.literal('MPCv2')),
  /** Transaction prebuild data */
  txPrebuild: optional(TransactionPrebuildResult),
  /** Private key for signing */
  prv: optional(t.string),
  /** Public keys for signing */
  pubs: optional(t.array(t.string)),
  /** Cosigner public key */
  cosignerPub: optional(t.string),
  /**
   * Transaction verification parameters
   * Reference: modules/sdk-core/src/bitgo/wallet/iWallet.ts:283-286
   */
  verifyTxParams: optional(
    t.intersection([
      t.type({
        /** Transaction parameters (REQUIRED when verifyTxParams exists) */
        txParams: t.partial({
          /** Recipients */
          recipients: t.array(Recipient),
          /** Wallet passphrase */
          walletPassphrase: t.string,
          /** Transaction type */
          type: t.string,
          /** Memo */
          memo: Memo,
          /** Tokens to enable */
          enableTokens: t.array(TokenEnablement),
        }),
      }),
      t.partial({
        /** Verification options (OPTIONAL) */
        verification: VerificationOptions,
      }),
    ])
  ),
  /** Pre-built transaction (string or object) - alternative to txPrebuild */
  prebuildTx: optional(t.union([t.string, TransactionPrebuildResult])),
  /** Verification options */
  verification: optional(VerificationOptions),
} as const;

/**
 * Response codecs imported from coinSignTx for consistency.
 * Both endpoints call wallet.prebuildAndSignTransaction() or similar signing methods
 * and return the same SignedTransaction union type.
 *
 * Possible response types:
 * - FullySignedTransactionResponse: For hot wallets (all signatures collected)
 * - HalfSignedAccountTransactionResponse: For cold wallets, account-based coins (needs more signatures)
 * - HalfSignedUtxoTransactionResponse: For cold wallets, UTXO coins (needs more signatures)
 * - SignedTransactionRequestResponse: For transaction requests
 * - TxRequestResponse: For TSS wallets (returns transaction request ID)
 *
 * Reference: modules/express/src/typedRoutes/api/v2/coinSignTx.ts:267-418
 * Note: Response types are imported and re-exported at the top of this file
 */

/**
 * Combined response type for prebuild and sign transaction
 * Returns one of several possible response types depending on wallet type and signing flow
 */
export const PrebuildAndSignTransactionResponse = t.union([
  FullySignedTransactionResponse,
  HalfSignedAccountTransactionResponse,
  HalfSignedUtxoTransactionResponse,
  SignedTransactionRequestResponse,
  TxRequestResponse, // For TSS wallets
]);

/**
 * Response types for prebuild and sign transaction endpoint
 */
export const PrebuildAndSignTransactionApiResponse = {
  /** Successfully prebuilt and signed transaction */
  200: PrebuildAndSignTransactionResponse,
  /** Error response */
  400: BitgoExpressError,
};

/**
 * Prebuild and sign a transaction
 *
 * This endpoint combines transaction building and signing in one atomic operation:
 * 1. Builds the transaction using the BitGo Platform API
 * 2. Signs with the user key (wallet passphrase required)
 * 3. Requests signature from BitGo HSM (second key)
 * 4. Returns the signed transaction (ready for broadcast)
 *
 * The request body accepts fields from:
 * - **PrebuildTransactionOptions**: Transaction building parameters (recipients, fees, etc.)
 * - **WalletSignTransactionOptions**: Signing configuration (passphrase, etc.)
 * - **Additional fields**: prebuildTx (if already prebuilt), verification options
 *
 * Common use cases:
 * - **Simple send**: Provide `recipients` and `walletPassphrase`
 * - **Custom fees**: Add `numBlocks`, `gasPrice`, `gasLimit`
 * - **Memo transactions**: Include `memo` (XLM, EOS, etc.)
 * - **TSS wallets**: Returns transaction request ID for approval flow
 *
 * Response varies by wallet type:
 * - **Hot wallets**: Returns fully signed transaction (`txHex`)
 * - **Cold wallets**: Returns half-signed transaction (`halfSigned.txHex`)
 * - **TSS wallets**: Returns transaction request (`txRequestId`)
 *
 * @tag express
 * @operationId express.v2.wallet.prebuildandsigntransaction
 */
export const PostPrebuildAndSignTransaction = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/prebuildAndSignTransaction',
  method: 'POST',
  request: httpRequest({
    params: PrebuildAndSignTransactionParams,
    body: PrebuildAndSignTransactionBody,
  }),
  response: PrebuildAndSignTransactionApiResponse,
});
