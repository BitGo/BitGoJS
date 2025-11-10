import * as t from 'io-ts';
import { DateFromISOString } from 'io-ts-types';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for sending to multiple recipients (v2)
 */
export const SendManyRequestParams = {
  /** The coin identifier (e.g., 'btc', 'tbtc', 'eth', 'teth') */
  coin: t.string,
  /** The ID of the wallet */
  id: t.string,
} as const;

/**
 * EIP-1559 fee parameters for Ethereum transactions
 * When eip1559 object is present, both fields are REQUIRED
 */
export const EIP1559Params = t.type({
  /** Maximum priority fee per gas (in wei) - REQUIRED */
  maxPriorityFeePerGas: t.union([t.number, t.string]),
  /** Maximum fee per gas (in wei) - REQUIRED */
  maxFeePerGas: t.union([t.number, t.string]),
});

/**
 * Memo object for chains that support memos (e.g., Stellar, XRP)
 * When memo object is present, both fields are REQUIRED
 */
export const MemoParams = t.type({
  /** Memo value - REQUIRED */
  value: t.string,
  /** Memo type - REQUIRED */
  type: t.string,
});

/**
 * Token transfer recipient parameters
 * tokenType and tokenQuantity are REQUIRED when this object is present
 */
const TokenTransferRecipientParams = t.intersection([
  t.type({
    /** Type of token (e.g., 'ERC20', 'ERC721', 'ERC1155', 'NATIVE') - REQUIRED */
    tokenType: t.string,
    /** Quantity of tokens to transfer (as string) - REQUIRED */
    tokenQuantity: t.string,
  }),
  t.partial({
    /** Token contract address (for ERC20, ERC721, etc.) - OPTIONAL */
    tokenContractAddress: t.string,
    /** Token name - OPTIONAL */
    tokenName: t.string,
    /** Token ID (for NFTs - ERC721, ERC1155) - OPTIONAL */
    tokenId: t.string,
    /** Decimal places for the token - OPTIONAL */
    decimalPlaces: t.number,
  }),
]);

/**
 * Recipient object for sendMany transactions
 */
const RecipientParams = t.type({
  /** Recipient address */
  address: t.string,
  /** Amount to send (in base units, e.g., satoshis for BTC, wei for ETH) */
  amount: t.union([t.number, t.string]),
});

const RecipientParamsOptional = t.partial({
  /** Fee limit for this specific recipient (e.g., for Tron TRC20 tokens) */
  feeLimit: t.string,
  /** Data field for this recipient (can be hex string or token transfer params) */
  data: t.union([t.string, TokenTransferRecipientParams]),
  /** Token name for this specific recipient */
  tokenName: t.string,
  /** Token data for this specific recipient */
  tokenData: TokenTransferRecipientParams,
});

/**
 * Complete recipient object combining required and optional fields
 */
const Recipient = t.intersection([RecipientParams, RecipientParamsOptional]);

/**
 * Token enablement configuration
 * name is REQUIRED when this object is present
 */
export const TokenEnablement = t.intersection([
  t.type({
    /** Token name - REQUIRED */
    name: t.string,
  }),
  t.partial({
    /** Token address (some chains like Solana require tokens to be enabled for specific address) - OPTIONAL */
    address: t.string,
  }),
]);

/**
 * Request body for sending to multiple recipients (v2)
 *
 * This endpoint supports the full set of parameters available in the BitGo SDK
 * for building, signing, and sending transactions to multiple recipients.
 */
export const SendManyRequestBody = {
  /** Array of recipients with addresses and amounts */
  recipients: optional(t.array(Recipient)),

  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),

  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),

  /** The private key (prv) in string form */
  prv: optional(t.string),

  /** Estimate fees to aim for first confirmation within this number of blocks */
  numBlocks: optional(t.number),

  /** The desired fee rate for the transaction in base units per kilobyte (e.g., satoshis/kB) */
  feeRate: optional(t.number),

  /** Fee multiplier (multiplies the estimated fee by this factor) */
  feeMultiplier: optional(t.number),

  /** The maximum limit for a fee rate in base units per kilobyte */
  maxFeeRate: optional(t.number),

  /** Minimum number of confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),

  /** If true, minConfirms also applies to change outputs */
  enforceMinConfirmsForChange: optional(t.boolean),

  /** Target number of unspents to maintain in the wallet */
  targetWalletUnspents: optional(t.number),

  /** Message to attach to the transaction */
  message: optional(t.string),

  /** Minimum value of unspents to use (in base units) */
  minValue: optional(t.union([t.number, t.string])),

  /** Maximum value of unspents to use (in base units) */
  maxValue: optional(t.union([t.number, t.string])),

  /** Custom sequence ID for the transaction */
  sequenceId: optional(t.string),

  /** Absolute max ledger the transaction should be accepted in (for XRP) */
  lastLedgerSequence: optional(t.number),

  /** Relative ledger height (in relation to the current ledger) that the transaction should be accepted in */
  ledgerSequenceDelta: optional(t.number),

  /** Custom gas price to be used for sending the transaction (for account-based coins) */
  gasPrice: optional(t.number),

  /** Set to true to disable automatic change splitting for purposes of unspent management */
  noSplitChange: optional(t.boolean),

  /** Array of specific unspent IDs to use in the transaction */
  unspents: optional(t.array(t.string)),

  /** Comment to attach to the transaction */
  comment: optional(t.string),

  /** One-time password for 2FA */
  otp: optional(t.string),

  /** Specifies the destination of the change output */
  changeAddress: optional(t.string),

  /** If true, allows using an external change address */
  allowExternalChangeAddress: optional(t.boolean),

  /** Send this transaction using coin-specific instant sending method (if available) */
  instant: optional(t.boolean),

  /** Memo to use in transaction (supported by Stellar, XRP, etc.) */
  memo: optional(MemoParams),

  /** Transfer ID for tracking purposes */
  transferId: optional(t.number),

  /** EIP-1559 fee parameters for Ethereum transactions */
  eip1559: optional(EIP1559Params),

  /** Gas limit for the transaction (for account-based coins) */
  gasLimit: optional(t.number),

  /** Token name for token transfers */
  tokenName: optional(t.string),

  /** Type of transaction (e.g., 'trustline' for Stellar) */
  type: optional(t.string),

  /** Custodian transaction ID (for institutional custody integrations) */
  custodianTransactionId: optional(t.string),

  /** If true, enables hop transactions for exchanges */
  hop: optional(t.boolean),

  /** Address type for the transaction (e.g., 'p2sh', 'p2wsh') */
  addressType: optional(t.string),

  /** Change address type (e.g., 'p2sh', 'p2wsh') */
  changeAddressType: optional(t.string),

  /** Transaction format (legacy or psbt) */
  txFormat: optional(t.union([t.literal('legacy'), t.literal('psbt'), t.literal('psbt-lite')])),

  /** If set to false, sweep all funds including required minimums (e.g., DOT requires 1 DOT minimum) */
  keepAlive: optional(t.boolean),

  /** NFT collection ID (for NFT transfers) */
  nftCollectionId: optional(t.string),

  /** NFT ID (for NFT transfers) */
  nftId: optional(t.string),

  /** Transaction nonce (for account-based coins) */
  nonce: optional(t.string),

  /** If true, only preview the transaction without sending */
  preview: optional(t.boolean),

  /** Receive address (for specific coins like ADA) */
  receiveAddress: optional(t.string),

  /** Messages to be signed with specific addresses */
  messages: optional(
    t.array(
      t.type({
        address: t.string,
        message: t.string,
      })
    )
  ),

  /** The receive address from which funds will be withdrawn (supported for specific coins like ADA) */
  senderAddress: optional(t.string),

  /** The wallet ID of the sender wallet when different from current wallet (for BTC unstaking) */
  senderWalletId: optional(t.string),

  /** Close remainder to address (for specific blockchain protocols like Algorand) */
  closeRemainderTo: optional(t.string),

  /** Non-participation flag (for governance/staking protocols like Algorand) */
  nonParticipation: optional(t.boolean),

  /** Valid from block height */
  validFromBlock: optional(t.number),

  /** Valid to block height */
  validToBlock: optional(t.number),

  /** Reservation parameters for unspent management */
  reservation: optional(
    t.partial({
      expireTime: t.string,
      pendingApprovalId: t.string,
    })
  ),

  /** Enable offline transaction verification */
  offlineVerification: optional(t.boolean),

  /** Wallet contract address (for smart contract wallets) */
  walletContractAddress: optional(t.string),

  /** IDF (Identity Framework) signed timestamp */
  idfSignedTimestamp: optional(t.string),

  /** IDF user ID */
  idfUserId: optional(t.string),

  /** IDF version number */
  idfVersion: optional(t.number),

  /** Array of tokens to enable on the wallet */
  enableTokens: optional(t.array(TokenEnablement)),

  /** Low fee transaction ID (for CPFP - Child Pays For Parent) */
  lowFeeTxid: optional(t.string),

  /** Flag indicating if this is a TSS transaction */
  isTss: optional(t.boolean),

  /** API version to use for the transaction */
  apiVersion: optional(t.string),

  /** Custom Solana instructions to include in the transaction */
  solInstructions: optional(
    t.array(
      t.type({
        programId: t.string,
        keys: t.array(
          t.type({
            pubkey: t.string,
            isSigner: t.boolean,
            isWritable: t.boolean,
          })
        ),
        data: t.string,
      })
    )
  ),

  /** Solana versioned transaction data for building transactions with Address Lookup Tables */
  solVersionedTransactionData: optional(
    t.partial({
      versionedInstructions: t.array(
        t.type({
          programIdIndex: t.number,
          accountKeyIndexes: t.array(t.number),
          data: t.string,
        })
      ),
      addressLookupTables: t.array(
        t.type({
          accountKey: t.string,
          writableIndexes: t.array(t.number),
          readonlyIndexes: t.array(t.number),
        })
      ),
      staticAccountKeys: t.array(t.string),
      messageHeader: t.type({
        numRequiredSignatures: t.number,
        numReadonlySignedAccounts: t.number,
        numReadonlyUnsignedAccounts: t.number,
      }),
      recentBlockhash: t.string,
    })
  ),

  /** Custom transaction parameters for Aptos entry function calls */
  aptosCustomTransactionParams: optional(
    t.intersection([
      t.type({
        /** Module name - REQUIRED */
        moduleName: t.string,
        /** Function name - REQUIRED */
        functionName: t.string,
      }),
      t.partial({
        /** Type arguments - OPTIONAL */
        typeArguments: t.array(t.string),
        /** Function arguments - OPTIONAL */
        functionArguments: t.array(t.any),
        /** ABI - OPTIONAL */
        abi: t.any,
      }),
    ])
  ),

  /** Array of public keys for signing */
  pubs: optional(t.array(t.string)),

  /** Transaction request ID (for TSS wallets) */
  txRequestId: optional(t.string),

  /** Co-signer public key */
  cosignerPub: optional(t.string),

  /** Flag indicating if this is the last signature */
  isLastSignature: optional(t.boolean),

  /** Pre-built transaction object */
  txPrebuild: optional(t.any),

  /** Multisig type version (e.g., 'MPCv2') */
  multisigTypeVersion: optional(t.literal('MPCv2')),

  /** Pre-built transaction (hex string or serialized object) */
  prebuildTx: optional(t.union([t.string, t.any])),

  /** Verification options for the transaction */
  verification: optional(t.any),

  /** Transaction verification parameters (used for verifying transaction before signing) */
  verifyTxParams: optional(
    t.intersection([
      t.type({
        /** Transaction parameters to verify - REQUIRED when verifyTxParams is present */
        txParams: t.partial({
          /** Recipients for verification */
          recipients: t.array(
            t.intersection([
              t.type({
                /** Recipient address */
                address: t.string,
                /** Amount to send */
                amount: t.union([t.string, t.number]),
              }),
              t.partial({
                /** Token name */
                tokenName: t.string,
                /** Memo */
                memo: t.string,
              }),
            ])
          ),
          /** Wallet passphrase */
          walletPassphrase: t.string,
          /** Transaction type */
          type: t.string,
          /** Memo for verification */
          memo: MemoParams,
          /** Tokens to enable */
          enableTokens: t.array(TokenEnablement),
        }),
      }),
      t.partial({
        /** Verification options - OPTIONAL */
        verification: t.any,
      }),
    ])
  ),
} as const;

/**
 * Entry in a transfer (input or output)
 */
const TransferEntry = t.intersection([
  t.type({
    /** Address associated with this entry - REQUIRED */
    address: t.string,
  }),
  t.partial({
    /** Label for the address - OPTIONAL */
    label: t.string,
    /** Whether this entry failed - OPTIONAL */
    failed: t.boolean,
    /** Whether this is a change output - OPTIONAL */
    isChange: t.boolean,
    /** Whether this is a fee entry - OPTIONAL */
    isFee: t.boolean,
    /** Whether this is an internal transfer - OPTIONAL */
    isInternal: t.boolean,
    /** Whether this is a PayGo entry - OPTIONAL */
    isPayGo: t.boolean,
    /** Memo associated with this entry - OPTIONAL */
    memo: t.string,
    /** Reward address (for staking) - OPTIONAL */
    rewardAddress: t.string,
    /** Entry subtype - OPTIONAL */
    subtype: t.string,
    /** Token name - OPTIONAL */
    token: t.string,
    /** Token contract hash - OPTIONAL */
    tokenContractHash: t.string,
    /** Value in base units (number) - OPTIONAL */
    value: t.number,
    /** Value as string - OPTIONAL */
    valueString: t.string,
    /** Wallet ID - OPTIONAL */
    wallet: t.string,
    /** Backing fee as string - OPTIONAL */
    backingFeeString: t.string,
    /** Entry type - OPTIONAL */
    type: t.string,
    /** NFT ID - OPTIONAL */
    nftId: t.string,
    /** NFT symbol - OPTIONAL */
    nftSymbol: t.string,
    /** Associated native coin address - OPTIONAL */
    associatedNativeCoinAddress: t.string,
  }),
]);

/**
 * History item in transfer history
 */
const TransferHistory = t.intersection([
  t.type({
    /** Action performed (e.g., 'created', 'signed', 'confirmed') - REQUIRED */
    action: t.string,
    /** Date of the action - REQUIRED */
    date: DateFromISOString,
  }),
  t.partial({
    /** Comment for this history item - OPTIONAL */
    comment: t.string,
    /** Transfer ID (for replaced transfers) - OPTIONAL */
    transferId: t.string,
    /** Transaction ID - OPTIONAL */
    txid: t.string,
    /** User who performed the action - OPTIONAL */
    user: t.string,
    /** Malformed transfer data - OPTIONAL */
    malformedTransfer: t.unknown,
  }),
]);

/**
 * Transfer object returned by sendMany - simplified with optional fields
 */
export const Transfer = t.type({
  /** Coin identifier - REQUIRED */
  coin: t.string,
  /** Transfer ID - REQUIRED */
  id: t.string,
  /** Wallet ID - REQUIRED */
  wallet: t.string,
  /** Enterprise ID - OPTIONAL */
  enterprise: optional(t.string),
  /** Transaction ID - REQUIRED */
  txid: t.string,
  /** Transaction ID type - OPTIONAL */
  txidType: optional(t.string),
  /** Block height - REQUIRED */
  height: t.number,
  /** Height ID - OPTIONAL */
  heightId: optional(t.string),
  /** Transfer date - REQUIRED */
  date: DateFromISOString,
  /** Number of confirmations - REQUIRED */
  confirmations: t.number,
  /** Transfer type ('send' or 'receive') - REQUIRED */
  type: t.string,
  /** Value (number) - OPTIONAL */
  value: optional(t.number),
  /** Value as string - REQUIRED */
  valueString: t.string,
  /** Intended value string - OPTIONAL */
  intendedValueString: optional(t.string),
  /** Base value (in base currency) - OPTIONAL */
  baseValue: optional(t.number),
  /** Base value as string - OPTIONAL */
  baseValueString: optional(t.string),
  /** Base value without fees - OPTIONAL */
  baseValueWithoutFees: optional(t.number),
  /** Base value without fees as string - OPTIONAL */
  baseValueWithoutFeesString: optional(t.string),
  /** Fee as string - OPTIONAL */
  feeString: optional(t.string),
  /** PayGo fee - OPTIONAL */
  payGoFee: optional(t.number),
  /** PayGo fee as string - OPTIONAL */
  payGoFeeString: optional(t.string),
  /** USD value of the transfer in dollars - OPTIONAL */
  usd: optional(t.number),
  /** USD exchange rate used for conversion - OPTIONAL */
  usdRate: optional(t.number),
  /** Transfer state (e.g., 'signed', 'confirmed', 'rejected') - REQUIRED */
  state: t.string,
  /** Tags - OPTIONAL */
  tags: optional(t.array(t.string)),
  /** Transfer history - REQUIRED */
  history: t.array(TransferHistory),
  /** Transfer comment - OPTIONAL */
  comment: optional(t.string),
  /** Virtual size (for Bitcoin) - OPTIONAL */
  vSize: optional(t.number),
  /** Coin-specific data (format varies by blockchain) - OPTIONAL */
  coinSpecific: optional(t.any),
  /** Sequence ID - OPTIONAL */
  sequenceId: optional(t.string),
  /** Array of entries (inputs/outputs) - OPTIONAL */
  entries: optional(t.array(TransferEntry)),
  /** Users notified flag - OPTIONAL */
  usersNotified: optional(t.boolean),
  /** Label (stored in DB, not returned in API response) - OPTIONAL */
  label: optional(t.string),
  /** Transfer IDs that this transfer replaces - OPTIONAL */
  replaces: optional(t.array(t.string)),
  /** Transfer ID that replaced this transfer - OPTIONAL */
  replacedBy: optional(t.array(t.string)),
});

/**
 * Resolver object for pending approval actions - simplified with optional fields
 * Represents a user who has resolved/approved a pending approval action
 */
const Resolver = t.type({
  /** User who resolved the action - REQUIRED */
  user: t.string,
  /** Date when the action was resolved - REQUIRED */
  date: DateFromISOString,
  /** Type of resolution (e.g., 'approved', 'rejected') - REQUIRED */
  resolutionType: t.string,
  /** Signatures provided during resolution - REQUIRED */
  signatures: t.array(t.string),
  /** Link to video verification (if applicable) - OPTIONAL */
  videoLink: optional(t.string),
  /** Video approver ID (if video verification was used) - OPTIONAL */
  videoApprover: optional(t.string),
  /** Video verification exception information - OPTIONAL */
  videoException: optional(t.string),
});

/**
 * Pending approval information - simplified with optional fields
 */
const PendingApprovalInfo = t.type({
  /** Type of pending approval - OPTIONAL */
  type: optional(t.string),
  /** Transaction request details - OPTIONAL */
  transactionRequest: optional(
    t.type({
      /** Build parameters - OPTIONAL */
      buildParams: optional(t.unknown),
      /** Coin-specific data - OPTIONAL */
      coinSpecific: optional(t.unknown),
      /** Comment - OPTIONAL */
      comment: optional(t.string),
      /** Fee - OPTIONAL */
      fee: optional(t.unknown),
      /** Whether transaction is unsigned - OPTIONAL */
      isUnsigned: optional(t.boolean),
      /** Recipients - OPTIONAL */
      recipients: optional(
        t.array(
          t.partial({
            /** Recipient address - OPTIONAL */
            address: t.string,
            /** Amount to send - OPTIONAL */
            amount: t.unknown,
            /** Data field - OPTIONAL */
            data: t.string,
          })
        )
      ),
      /** Requested amount - OPTIONAL */
      requestedAmount: optional(t.unknown),
      /** Source wallet ID - OPTIONAL */
      sourceWallet: optional(t.string),
      /** Triggered policy - OPTIONAL */
      triggeredPolicy: optional(t.unknown),
      /** Valid transaction - OPTIONAL */
      validTransaction: optional(t.string),
      /** Valid transaction hash - OPTIONAL */
      validTransactionHash: optional(t.string),
    })
  ),
});

/**
 * Pending approval object - simplified with optional fields to reduce type depth
 */
export const PendingApproval = t.type({
  /** Pending approval ID - OPTIONAL */
  id: optional(t.string),
  /** Coin type - OPTIONAL */
  coin: optional(t.string),
  /** Wallet ID (if wallet-level approval) - OPTIONAL */
  wallet: optional(t.string),
  /** Enterprise ID (if enterprise-level approval) - OPTIONAL */
  enterprise: optional(t.string),
  /** Organization ID - OPTIONAL */
  organization: optional(t.string),
  /** User who created the pending approval - OPTIONAL */
  creator: optional(t.string),
  /** Create date - OPTIONAL */
  createDate: optional(DateFromISOString),
  /** Pending approval information - OPTIONAL */
  info: optional(PendingApprovalInfo),
  /** State of the pending approval - OPTIONAL */
  state: optional(t.string),
  /** Scope of the pending approval - OPTIONAL */
  scope: optional(t.string),
  /** User IDs involved - OPTIONAL */
  userIds: optional(t.array(t.string)),
  /** Number of approvals required - OPTIONAL */
  approvalsRequired: optional(t.number),
  /** Wallet label - OPTIONAL */
  walletLabel: optional(t.string),
  /** Resolvers who have acted - OPTIONAL */
  resolvers: optional(t.array(Resolver)),
});

/**
 * Unified Response Codec for both 200 and 202 status codes
 * Split into smaller parts to avoid TypeScript maximum length error
 *
 * Covers all 5 response paths (see SENDMANY_RESPONSE_FLOWCHART.md):
 * - Path 1A: TSS Full API (Pending) → 200 with { pendingApproval, txRequest }
 * - Path 1B: TSS Full API (Success) → 200 or 202 with { transfer, txRequest, status, ... }
 * - Path 1C: TSS Lite API → 200 with TxRequest object
 * - Path 2: Custodial → 200 with { error?, pendingApprovals? }
 * - Path 3: Non-Custodial → 200 or 202 with { status, transfer?, ... }
 *
 * All fields are optional to accommodate different wallet types and scenarios.
 * The HTTP status code (200 vs 202) conveys the semantic difference.
 */

// Basic transaction fields
const SendManyResponseBasic = t.type({
  /** Transfer details - varies by coin and wallet type */
  transfer: optional(Transfer),
  /** Transaction status (e.g., 'signed', 'accepted', 'pendingApproval') */
  status: optional(t.string),
  /** Transaction hex */
  tx: optional(t.string),
  /** Transaction ID/hash */
  txid: optional(t.string),
});

// Complex type fields (using t.unknown to avoid TypeScript serialization limits)
const SendManyTxRequestResponse = t.type({
  /** Transaction request object - used in TSS wallets */
  txRequest: optional(TxRequestResponse),
});

const SendManyPendingApprovalResponse = t.type({
  /** Pending approval object - used when approval is pending */
  pendingApproval: optional(PendingApproval),
});

// Combined response codec
export const SendManyResponse = t.intersection([
  SendManyResponseBasic,
  SendManyTxRequestResponse,
  SendManyPendingApprovalResponse,
]);

/**
 * Send to multiple recipients (v2)
 *
 * This endpoint sends funds to multiple recipients by:
 * 1. Building a transaction with the specified recipients and parameters
 * 2. Signing the transaction with the user's key (decrypted with walletPassphrase or xprv)
 * 3. Requesting a signature from BitGo's key
 * 4. Sending the fully-signed transaction to the blockchain network
 *
 * The v2 API supports:
 * - Multiple recipients in a single transaction
 * - Full control over transaction fees (feeRate, maxFeeRate, numBlocks)
 * - UTXO selection (minValue, maxValue, unspents array)
 * - Instant transactions (if supported by the coin)
 * - TSS wallets with txRequest flow
 * - Account-based and UTXO-based coins
 * - Token transfers
 * - Advanced features like memo fields, hop transactions, EIP-1559 fees
 *
 * @operationId express.v2.wallet.sendmany
 * @tag express
 */
export const PostSendMany = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/sendmany',
  method: 'POST',
  request: httpRequest({
    params: SendManyRequestParams,
    body: SendManyRequestBody,
  }),
  response: {
    /** Successfully sent transaction */
    200: SendManyResponse,
    /** Transaction requires approval (same structure as 200) */
    202: SendManyResponse,
    /** Invalid request or send operation fails */
    400: BitgoExpressError,
  },
});
