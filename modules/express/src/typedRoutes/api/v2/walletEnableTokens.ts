import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for enable tokens endpoint
 */
export const EnableTokensParams = {
  /** Coin identifier (e.g., 'algo', 'sol', 'xtz', 'trx') */
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
 * Request body for enabling tokens on a wallet
 * Based on BuildTokenEnablementOptions which extends PrebuildTransactionOptions
 *
 * This endpoint supports the full set of parameters available in the BitGo SDK
 * for building, signing, and sending token enablement transactions.
 *
 * Note: Recipients field is NOT supported for token enablement transactions.
 * The SDK will throw an error if recipients are specified.
 */
export const EnableTokensRequestBody = {
  /** Array of tokens to enable (REQUIRED - must have at least one token) */
  enableTokens: t.array(TokenEnablement),

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
  verifyTxParams: optional(t.any),
} as const;

/**
 * Response for enable tokens operation
 * Returns arrays of successful and failed token enablement transactions
 *
 * The success array contains responses from sendTokenEnablement which vary by wallet type:
 * - TSS wallets: May include txRequest, transfer, pendingApproval, status fields
 * - Hot/Cold wallets: Transaction details (tx, txid, status, transfer, etc.)
 * - Custodial wallets: Pending approval or initiation details
 *
 * All fields are optional to accommodate different wallet types and scenarios.
 */
export const EnableTokensResponse = t.type({
  /** Array of successfully sent token enablement transactions */
  success: t.array(t.unknown),
  /** Array of errors from failed token enablement transactions */
  failure: t.array(t.unknown),
});

/**
 * Enable Tokens on Wallet
 *
 * Some chains require tokens to be enabled before they can be received or sent.
 * This endpoint builds, signs, and sends transactions that enable the specified tokens.
 *
 * Supported coins: Algorand (algo), Solana (sol), Tezos (xtz), Tron (trx), Stellar (xlm), etc.
 *
 * The endpoint processes each token enablement as a separate transaction and returns:
 * - success: Array of successfully created/sent token enablement transactions
 * - failure: Array of errors from failed token enablements
 *
 * Requirements:
 * - enableTokens: Array of tokens to enable with name and optional address
 * - walletPassphrase, xprv, or prv: For signing the transactions (required based on wallet type)
 *
 * Behavior:
 * - For hot/cold wallets: Builds, signs, and submits transactions
 * - For custodial wallets: Initiates the transactions
 * - For TSS wallets: Uses TSS signing flow
 *
 * Note: The endpoint processes all token enablements and returns partial success if some succeed
 * but others fail. Check both success and failure arrays in the response.
 *
 * @operationId express.v2.wallet.enableTokens
 * @tag express
 */
export const PostWalletEnableTokens = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/enableTokens',
  method: 'POST',
  request: httpRequest({
    params: EnableTokensParams,
    body: EnableTokensRequestBody,
  }),
  response: {
    /** Successfully enabled tokens (may include partial failures in failure array) */
    200: EnableTokensResponse,
    /** Invalid request parameters or validation failure */
    400: BitgoExpressError,
    /** Internal server error, wallet not found, SDK errors, or coin operation failures */
    500: BitgoExpressError,
  },
});
