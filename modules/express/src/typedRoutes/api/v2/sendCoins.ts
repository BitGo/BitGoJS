import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { SendManyResponse, EIP1559Params, MemoParams, TokenEnablement } from './sendmany';

/**
 * Request parameters for sending to a single recipient (v2)
 */
export const SendCoinsRequestParams = {
  /** The coin identifier (e.g., 'btc', 'tbtc', 'eth', 'teth') */
  coin: t.string,
  /** The ID of the wallet */
  id: t.string,
} as const;

/**
 * Request body for sending to a single recipient (v2)
 *
 * This endpoint is a convenience wrapper around sendMany that accepts a single
 * address and amount instead of a recipients array. It supports the full set of
 * parameters available in sendMany.
 *
 * Internally, wallet.send() converts the address and amount into a recipients array
 * and calls wallet.sendMany(), so the response structure is identical.
 */
export const SendCoinsRequestBody = {
  /** The destination address - REQUIRED */
  address: t.string,

  /** The amount to send in base units (e.g., satoshis for BTC, wei for ETH) - REQUIRED */
  amount: t.union([t.number, t.string]),

  /** Data field for the transaction (e.g., for Ethereum contract calls) */
  data: optional(t.string),

  /** Fee limit for this transaction (e.g., for Tron TRC20 tokens) */
  feeLimit: optional(t.string),

  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),

  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),

  /** The private key (prv) in string form */
  prv: optional(t.string),

  /** Message to attach to the transaction */
  message: optional(t.string),

  /** Minimum number of confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),

  /** If true, minConfirms also applies to change outputs */
  enforceMinConfirmsForChange: optional(t.boolean),

  /** Custodian transaction ID (for institutional custody integrations like Metamask) */
  custodianTransactionId: optional(t.string),

  /** Token name for token transfers */
  tokenName: optional(t.string),

  // All SendManyOptions fields are also supported via the SendOptions index signature
  // Including these commonly used fields explicitly for better documentation:

  /** Estimate fees to aim for first confirmation within this number of blocks */
  numBlocks: optional(t.number),

  /** The desired fee rate for the transaction in base units per kilobyte (e.g., satoshis/kB) */
  feeRate: optional(t.union([t.number, t.string])),

  /** Fee multiplier (multiplies the estimated fee by this factor) */
  feeMultiplier: optional(t.number),

  /** The maximum limit for a fee rate in base units per kilobyte */
  maxFeeRate: optional(t.number),

  /** Target number of unspents to maintain in the wallet */
  targetWalletUnspents: optional(t.number),

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

  /** Type of transaction (e.g., 'trustline' for Stellar) */
  type: optional(t.string),

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
 * Send coins to a single recipient (v2)
 *
 * This endpoint is a convenience wrapper around the sendMany endpoint that accepts
 * a single address and amount instead of a recipients array.
 *
 * Internally, wallet.send() converts the address and amount into a recipients array
 * with a single recipient and calls wallet.sendMany(). This means:
 * 1. All sendMany parameters are supported
 * 2. The response structure is identical to sendMany
 *
 * The endpoint:
 * 1. Validates the address and amount parameters
 * 2. Builds a transaction to the specified address
 * 3. Signs the transaction with the user's key (decrypted with walletPassphrase or xprv)
 * 4. Requests a signature from BitGo's key
 * 5. Sends the fully-signed transaction to the blockchain network
 *
 * Supports:
 * - TSS wallets with txRequest flow
 * - Custodial wallets
 * - Traditional multisig wallets
 * - Account-based and UTXO-based coins
 * - Token transfers
 * - Advanced features like memo fields, hop transactions, EIP-1559 fees
 *
 * @operationId express.v2.wallet.sendcoins
 * @tag express
 */
export const PostSendCoins = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/sendcoins',
  method: 'POST',
  request: httpRequest({
    params: SendCoinsRequestParams,
    body: SendCoinsRequestBody,
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
