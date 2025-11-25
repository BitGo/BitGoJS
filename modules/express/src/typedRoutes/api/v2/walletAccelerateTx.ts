import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for accelerate transaction endpoint
 */
export const AccelerateTxParams = {
  /** Coin identifier (e.g., 'btc', 'tbtc', 'ltc') */
  coin: t.string,
  /** Wallet ID */
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
 * Request body for accelerating a transaction using CPFP or RBF
 *
 * IMPORTANT: Must provide EITHER cpfpTxIds OR rbfTxIds (mutually exclusive)
 *
 * CPFP (Child-Pays-For-Parent) Requirements:
 * - cpfpTxIds: Array of length 1
 * - cpfpFeeRate: Required unless noCpfpFeeRate=true
 * - maxFee: Required unless noMaxFee=true
 *
 * RBF (Replace-By-Fee) Requirements:
 * - rbfTxIds: Array of length 1
 * - feeMultiplier: Required and must be > 1
 *
 * The request body is organized into two sections:
 * 1. Fields from AccelerateTransactionOptions (acceleration-specific fields)
 * 2. Additional fields from PrebuildAndSignTransactionOptions (transaction building and signing fields)
 */
export const AccelerateTxRequestBody = {
  /** Transaction IDs to accelerate using CPFP (Child-Pays-For-Parent). Must be array of length 1. */
  cpfpTxIds: optional(t.array(t.string)),

  /** Transaction IDs to accelerate using RBF (Replace-By-Fee). Must be array of length 1. */
  rbfTxIds: optional(t.array(t.string)),

  /** Fee rate for the CPFP transaction (in satoshis/kB). Required for CPFP unless noCpfpFeeRate=true. */
  cpfpFeeRate: optional(t.number),

  /** If true, allows skipping cpfpFeeRate requirement for CPFP */
  noCpfpFeeRate: optional(t.boolean),

  /** Maximum fee willing to pay (in satoshis). Required for CPFP unless noMaxFee=true. */
  maxFee: optional(t.number),

  /** If true, allows skipping maxFee requirement for CPFP */
  noMaxFee: optional(t.boolean),

  /** Fee multiplier for RBF (must be > 1). Required when using rbfTxIds. */
  feeMultiplier: optional(t.number),

  /** Recipients array (will be set to empty array by SDK for acceleration) */
  recipients: optional(
    t.array(
      t.type({
        address: t.string,
        amount: t.union([t.string, t.number]),
      })
    )
  ),

  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),

  /** The private key (prv) in string form */
  prv: optional(t.string),

  /** Extended private key (alternative to walletPassphrase for certain operations) */
  xprv: optional(t.string),

  /** Array of public keys for signing */
  pubs: optional(t.array(t.string)),

  /** Co-signer public key */
  cosignerPub: optional(t.string),

  /** Flag indicating if this is the last signature */
  isLastSignature: optional(t.boolean),

  /** Pre-built transaction object */
  txPrebuild: optional(t.any),

  /** Multisig type version (e.g., 'MPCv2') */
  multisigTypeVersion: optional(t.literal('MPCv2')),

  /** Transaction request ID (for TSS wallets) */
  txRequestId: optional(t.string),

  /** Transaction verification parameters (used for verifying transaction before signing) */
  verifyTxParams: optional(t.any),

  /** API version to use for TSS transaction requests */
  apiVersion: optional(t.union([t.literal('lite'), t.literal('full')])),

  /** Estimate fees to aim for first confirmation within this number of blocks */
  numBlocks: optional(t.number),

  /** The desired fee rate for the transaction in base units per kilobyte (e.g., satoshis/kB) */
  feeRate: optional(t.number),

  /** The maximum limit for a fee rate in base units per kilobyte */
  maxFeeRate: optional(t.number),

  /** Custom gas price to be used for sending the transaction (for account-based coins) */
  gasPrice: optional(t.number),

  /** Gas limit for the transaction (for account-based coins) */
  gasLimit: optional(t.number),

  /** EIP-1559 fee parameters for Ethereum transactions */
  eip1559: optional(EIP1559Params),

  /** Minimum value of unspents to use (in base units) */
  minValue: optional(t.union([t.number, t.string])),

  /** Maximum value of unspents to use (in base units) */
  maxValue: optional(t.union([t.number, t.string])),

  /** Array of specific unspent IDs to use in the transaction */
  unspents: optional(t.array(t.any)),

  /** Minimum number of confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),

  /** If true, minConfirms also applies to change outputs */
  enforceMinConfirmsForChange: optional(t.boolean),

  /** Target number of unspents to maintain in the wallet */
  targetWalletUnspents: optional(t.number),

  /** Set to true to disable automatic change splitting for purposes of unspent management */
  noSplitChange: optional(t.boolean),

  /** Specifies the destination of the change output */
  changeAddress: optional(t.string),

  /** If true, allows using an external change address */
  allowExternalChangeAddress: optional(t.boolean),

  /** Address type for the transaction (e.g., 'p2sh', 'p2wsh') */
  addressType: optional(t.string),

  /** Change address type (e.g., 'p2sh', 'p2wsh') */
  changeAddressType: optional(t.string),

  /** The receive address from which funds will be withdrawn (supported for specific coins like ADA) */
  senderAddress: optional(t.string),

  /** The wallet ID of the sender wallet when different from current wallet (for BTC unstaking) */
  senderWalletId: optional(t.string),

  /** Receive address (for specific coins like ADA) */
  receiveAddress: optional(t.string),

  /** Custom sequence ID for the transaction */
  sequenceId: optional(t.string),

  /** Transaction nonce (for account-based coins) */
  nonce: optional(t.string),

  /** Type of transaction (e.g., 'trustline' for Stellar) */
  type: optional(t.string),

  /** Send this transaction using coin-specific instant sending method (if available) */
  instant: optional(t.boolean),

  /** If true, enables hop transactions for exchanges */
  hop: optional(t.boolean),

  /** If true, only preview the transaction without sending */
  preview: optional(t.boolean),

  /** Transaction format (legacy or psbt) */
  txFormat: optional(t.union([t.literal('legacy'), t.literal('psbt'), t.literal('psbt-lite')])),

  /** If set to false, sweep all funds including required minimums (e.g., DOT requires 1 DOT minimum) */
  keepAlive: optional(t.boolean),

  /** If true, indicates this is a test transaction */
  isTestTransaction: optional(t.boolean),

  /** Memo to use in transaction (supported by Stellar, XRP, etc.) */
  memo: optional(MemoParams),

  /** Messages to be signed with specific addresses */
  messages: optional(
    t.array(
      t.type({
        address: t.string,
        message: t.string,
      })
    )
  ),

  /** Absolute max ledger the transaction should be accepted in (for XRP) */
  lastLedgerSequence: optional(t.number),

  /** Relative ledger height (in relation to the current ledger) that the transaction should be accepted in */
  ledgerSequenceDelta: optional(t.number),

  /** Close remainder to address (for specific blockchain protocols like Algorand) */
  closeRemainderTo: optional(t.string),

  /** Non-participation flag (for governance/staking protocols like Algorand) */
  nonParticipation: optional(t.boolean),

  /** Valid from block height */
  validFromBlock: optional(t.number),

  /** Valid to block height */
  validToBlock: optional(t.number),

  /** Token name for token transfers */
  tokenName: optional(t.string),

  /** NFT collection ID (for NFT transfers) */
  nftCollectionId: optional(t.string),

  /** NFT ID (for NFT transfers) */
  nftId: optional(t.string),

  /** Token enablements array (for enabling multiple tokens in a single transaction) */
  enableTokens: optional(t.array(t.any)),

  /** Low fee transaction ID (for CPFP - Child Pays For Parent) */
  lowFeeTxid: optional(t.string),

  /** Custodian transaction ID (for institutional custody integrations) */
  custodianTransactionId: optional(t.string),

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

  /** Pre-built transaction (hex string or serialized object) */
  prebuildTx: optional(t.union([t.string, t.any])),

  /** Verification options for the transaction */
  verification: optional(t.any),

  /** Request ID for tracing and logging */
  reqId: optional(t.any),

  /** Flag indicating if this is a TSS transaction */
  isTss: optional(t.boolean),

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

  /** Comment to attach to the transaction */
  comment: optional(t.string),

  /** Message to attach to the transaction */
  message: optional(t.string),

  /** One-time password for 2FA */
  otp: optional(t.string),
} as const;

/**
 * Response for accelerate transaction operation
 *
 * The response structure varies based on wallet type and coin:
 * - Hot/Cold wallets: Transaction details (tx, txid, status, transfer)
 * - Custodial wallets: Pending approval or initiation details
 * - TSS wallets: May include txRequest, transfer, pendingApproval
 *
 * Common fields may include:
 * - tx: The signed transaction hex
 * - txid: The transaction ID
 * - status: Transaction status (e.g., 'signed', 'pending')
 * - transfer: Transfer object with coin, wallet, and transaction details
 * - pendingApproval: Pending approval details if transaction requires approval
 */
export const AccelerateTxResponse = t.unknown;

/**
 * Accelerate Transaction Confirmation (CPFP/RBF)
 *
 * This endpoint accelerates a stuck or slow transaction using either:
 * - **CPFP (Child-Pays-For-Parent)**: Creates a new transaction that spends the output
 *   of the stuck transaction with a higher fee, incentivizing miners to confirm both.
 * - **RBF (Replace-By-Fee)**: Replaces the original transaction with a new one that
 *   has a higher fee (only works if original transaction was marked as RBF-enabled).
 *
 * Supported coins: Primarily UTXO-based coins like Bitcoin (btc, tbtc), Litecoin (ltc), etc.
 *
 * **CPFP Requirements:**
 * - cpfpTxIds: Array with exactly one transaction ID
 * - cpfpFeeRate: Fee rate in satoshis/kB (required unless noCpfpFeeRate=true)
 * - maxFee: Maximum fee in satoshis (required unless noMaxFee=true)
 * - walletPassphrase, xprv, or prv: For signing the CPFP transaction
 *
 * **RBF Requirements:**
 * - rbfTxIds: Array with exactly one transaction ID
 * - feeMultiplier: Multiplier for the fee (must be > 1, e.g., 1.5 for 50% increase)
 * - walletPassphrase, xprv, or prv: For signing the replacement transaction
 *
 * **Important:**
 * - Must specify EITHER cpfpTxIds OR rbfTxIds (not both)
 * - Original transaction must be unconfirmed
 * - For RBF, original transaction must have been created with RBF enabled
 *
 * **Behavior:**
 * 1. Validates acceleration parameters (CPFP or RBF)
 * 2. Builds and signs the acceleration transaction
 * 3. Submits the transaction to the blockchain
 * 4. Returns transaction details
 *
 * @operationId express.v2.wallet.accelerateTx
 * @tag Express
 */
export const PostWalletAccelerateTx = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/acceleratetx',
  method: 'POST',
  request: httpRequest({
    params: AccelerateTxParams,
    body: AccelerateTxRequestBody,
  }),
  response: {
    /** Successfully accelerated transaction */
    200: AccelerateTxResponse,
    /** Invalid request parameters or validation failure (e.g., missing required fields, invalid array length) */
    400: BitgoExpressError,
    /** Internal server error, wallet not found, SDK errors, or coin operation failures */
    500: BitgoExpressError,
  },
});
