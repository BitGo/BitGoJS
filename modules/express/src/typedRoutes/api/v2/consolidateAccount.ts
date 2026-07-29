import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for consolidate account endpoint
 */
export const ConsolidateAccountParams = {
  /** A cryptocurrency or token ticker symbol */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Request body for consolidating account balances
 * Based on BuildConsolidationTransactionOptions which extends:
 * - PrebuildTransactionOptions (iWallet.ts lines 90-221)
 * - WalletSignTransactionOptions (iWallet.ts lines 265-289)
 */
export const ConsolidateAccountRequestBody = {
  /** Optional: restrict the consolidation to the specified receive addresses. If not provided, will consolidate the funds from all receive addresses up to 500 addresses */
  consolidateAddresses: optional(t.array(t.string)),

  /** Passphrase to decrypt the user key on the wallet. Required if External Signer is not used to sign the transactions */
  walletPassphrase: optional(t.string),
  /** Extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** One-time password for 2FA */
  otp: optional(t.string),

  /** Transaction recipients */
  recipients: optional(
    t.array(
      t.type({
        address: t.string,
        amount: t.union([t.string, t.number]),
      })
    )
  ),
  /** Estimate fees to aim for confirmation within this number of blocks */
  numBlocks: optional(t.number),
  /** Maximum fee rate limit */
  maxFeeRate: optional(t.number),
  /** Minimum number of confirmations needed */
  minConfirms: optional(t.number),
  /** If true, minConfirms also applies to change outputs */
  enforceMinConfirmsForChange: optional(t.boolean),
  /** Target number of unspents in wallet after consolidation */
  targetWalletUnspents: optional(t.number),
  /** Minimum value of balances to use (in base units) */
  minValue: optional(t.union([t.number, t.string])),
  /** Maximum value of balances to use (in base units) */
  maxValue: optional(t.union([t.number, t.string])),
  /** Sequence ID for transaction tracking */
  sequenceId: optional(t.string),
  /** Last ledger sequence (for Stellar/XRP) */
  lastLedgerSequence: optional(t.number),
  /** Ledger sequence delta (for Stellar/XRP) */
  ledgerSequenceDelta: optional(t.number),
  /** Gas price for Ethereum-like chains */
  gasPrice: optional(t.number),
  /** If true, does not split change output */
  noSplitChange: optional(t.boolean),
  /** Array of specific unspents to use in transaction */
  unspents: optional(t.array(t.string)),
  /** Receive address from which funds will be withdrawn (for ADA) */
  senderAddress: optional(t.string),
  /** Sender wallet ID when different from current wallet */
  senderWalletId: optional(t.string),
  /** Messages to attach to outputs */
  messages: optional(
    t.array(
      t.type({
        address: t.string,
        message: t.string,
      })
    )
  ),
  /** Change address for the transaction */
  changeAddress: optional(t.string),
  /** Allow using external change address */
  allowExternalChangeAddress: optional(t.boolean),
  /** Transaction type */
  type: optional(t.string),
  /** Close remainder to this address (for Algorand) */
  closeRemainderTo: optional(t.string),
  /** Non-participation flag (for Algorand) */
  nonParticipation: optional(t.boolean),
  /** Valid from block number */
  validFromBlock: optional(t.number),
  /** Valid to block number */
  validToBlock: optional(t.number),
  /** If true, creates instant transaction */
  instant: optional(t.boolean),
  /** Transaction memo */
  memo: optional(t.intersection([t.type({ value: t.string }), t.partial({ type: t.string })])),
  /** Address type to use */
  addressType: optional(t.string),
  /** Change address type to use */
  changeAddressType: optional(t.string),
  /** If true, enables hop transaction */
  hop: optional(t.boolean),
  /** Unspent reservation details */
  reservation: optional(
    t.partial({
      expireTime: t.string,
      pendingApprovalId: t.string,
    })
  ),
  /** If true, performs offline verification */
  offlineVerification: optional(t.boolean),
  /** Wallet contract address */
  walletContractAddress: optional(t.string),
  /** IDF signed timestamp */
  idfSignedTimestamp: optional(t.string),
  /** IDF user ID */
  idfUserId: optional(t.string),
  /** IDF version */
  idfVersion: optional(t.number),
  /** Comment to attach to the transaction */
  comment: optional(t.string),
  /** Token name for token operations */
  tokenName: optional(t.string),
  /** NFT collection ID */
  nftCollectionId: optional(t.string),
  /** NFT ID */
  nftId: optional(t.string),
  /** Tokens to enable */
  enableTokens: optional(t.array(t.intersection([t.type({ name: t.string }), t.partial({ address: t.string })]))),
  /** Nonce for account-based coins */
  nonce: optional(t.string),
  /** If true, previews the transaction without sending */
  preview: optional(t.boolean),
  /** EIP-1559 fee parameters for Ethereum */
  eip1559: optional(
    t.type({
      maxFeePerGas: t.string,
      maxPriorityFeePerGas: t.string,
    })
  ),
  /** Gas limit for Ethereum-like chains */
  gasLimit: optional(t.number),
  /** Low fee transaction ID for RBF */
  lowFeeTxid: optional(t.string),
  /** Receive address for specific operations */
  receiveAddress: optional(t.string),
  /** If true, indicates TSS transaction */
  isTss: optional(t.boolean),
  /** Custodian transaction ID */
  custodianTransactionId: optional(t.string),
  /** The Trasaction Request API version to use for MPC EdDSA Hot Wallets. Defaults based on the wallet type and asset curve */
  apiVersion: optional(t.union([t.literal('lite'), t.literal('full')])),
  /** If false, sweep all funds including minimums */
  keepAlive: optional(t.boolean),
  /** Transaction format type */
  txFormat: optional(t.union([t.literal('legacy'), t.literal('psbt'), t.literal('psbt-lite')])),
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
  /** Solana versioned transaction data for Address Lookup Tables */
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
  /** Aptos custom transaction parameters for entry function calls */
  aptosCustomTransactionParams: optional(
    t.intersection([
      t.type({
        moduleName: t.string,
        functionName: t.string,
      }),
      t.partial({
        typeArguments: t.array(t.string),
        functionArguments: t.array(t.any),
        abi: t.any,
      }),
    ])
  ),
  /** Transaction request ID */
  txRequestId: optional(t.string),
  /** If true, marks as test transaction */
  isTestTransaction: optional(t.boolean),

  /** The un-encrypted user private key in string form. If the key is a JSON object it must be stringified. Required if `walletPassphrase` is not available or encrypted private key is not stored by BitGo */
  prv: optional(t.string),
  /** Array of public keys */
  pubs: optional(t.array(t.string)),
  /** Cosigner public key */
  cosignerPub: optional(t.string),
  /** If true, this is the last signature */
  isLastSignature: optional(t.boolean),

  /** Transaction prebuild object (from WalletSignTransactionOptions) */
  txPrebuild: optional(t.any),
  /** Multisig type version */
  multisigTypeVersion: optional(t.literal('MPCv2')),
  /** Transaction verification parameters */
  verifyTxParams: optional(t.any),
} as const;

/**
 * Response for consolidate account operation
 * Returns arrays of successful and failed consolidation transactions
 */
export const ConsolidateAccountResponse = t.type({
  /** Array of successfully sent consolidation transactions */
  success: t.array(t.unknown),
  /** Array of errors from failed consolidation transactions */
  failure: t.array(t.unknown),
});

/**
 * Response for partial success or failure cases (202/400)
 * Includes both the transaction results and error metadata
 */
export const ConsolidateAccountErrorResponse = t.intersection([ConsolidateAccountResponse, BitgoExpressError]);

/**
 * Build, sign, and send a consolidation transaction for an account-based asset all in 1 call. For account-based assets, consolidating the balances in the receive addresses to the base address maximizes the spendable balance of a wallet.
 *
 * @operationId express.wallet.consolidateaccount
 * @tag Express
 */
export const PostConsolidateAccount = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/consolidateAccount',
  method: 'POST',
  request: httpRequest({
    params: ConsolidateAccountParams,
    body: ConsolidateAccountRequestBody,
  }),
  response: {
    /** Successfully consolidated accounts */
    200: ConsolidateAccountResponse,
    /** Partial success - some succeeded, others failed (includes error metadata) */
    202: ConsolidateAccountErrorResponse,
    /** All consolidations failed (includes error metadata) */
    400: ConsolidateAccountErrorResponse,
  },
});
