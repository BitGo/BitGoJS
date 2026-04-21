/**
 * @prettier
 */
import * as t from 'io-ts';
import { EIP1559Params, MemoParams, TokenEnablement } from '../v2/sendmany';

/**
 * Recipient entry accepted by the sendMany / sendCoins / consolidateAccount
 * flows that feed `createTSSSendParams`.
 */
const Recipient = t.intersection([
  t.type({
    address: t.string,
    amount: t.union([t.number, t.string]),
  }),
  t.partial({
    feeLimit: t.string,
    tokenName: t.string,
    // `data` and `tokenData` are passed through to wallet.send*; their strict
    // shapes live in the route-level codecs. We accept `any` here to mirror
    // that precedent and preserve existing behaviour.
    data: t.any,
    tokenData: t.any,
    memo: t.union([t.string, MemoParams]),
  }),
]);

/**
 * Request body accepted by `createTSSSendParams` in clientRoutes.
 *
 * The helper is called from three route handlers, all of which already
 * validate their own request bodies at the route layer:
 *   - express.wallet.signtxtss     (walletTxSignTSS)
 *   - express.wallet.consolidateaccount (consolidateAccount)
 *   - express.wallet.sendmany / express.wallet.sendcoins (sendmany / sendCoins)
 *
 * This codec is the helper's own contract: the union of fields any of those
 * callers may place into `req.body` before it is spread into the TSS signing
 * params. Every field is optional because each caller only uses a subset.
 *
 * Unknown fields are preserved by io-ts `t.partial` decoding, so extra
 * coin-specific or forward-compatible fields flow through unchanged.
 */
export const CreateTSSSendParamsBody = t.partial({
  // Auth / signing material
  walletPassphrase: t.string,
  xprv: t.string,
  prv: t.string,
  pubs: t.array(t.string),
  cosignerPub: t.string,
  isLastSignature: t.boolean,
  otp: t.string,
  derivationSeed: t.string,

  // TSS / transaction request / prebuild
  txRequestId: t.string,
  // `txPrebuild` / `prebuildTx` / verification blobs are passed through to the
  // wallet SDK, which owns their strict shapes. Mirrors the route-level
  // codecs (see sendmany / consolidateAccount) which also use `t.any`.
  txPrebuild: t.any,
  prebuildTx: t.union([t.string, t.any]),
  apiVersion: t.string,
  multisigTypeVersion: t.literal('MPCv2'),
  signingStep: t.union([t.literal('signerNonce'), t.literal('signerSignature'), t.literal('cosignerNonce')]),

  // Recipients / addresses / amounts
  recipients: t.array(Recipient),
  address: t.string,
  amount: t.union([t.number, t.string]),
  messages: t.array(
    t.type({
      address: t.string,
      message: t.string,
    })
  ),
  senderAddress: t.string,
  senderWalletId: t.string,
  receiveAddress: t.string,
  changeAddress: t.string,
  closeRemainderTo: t.string,
  consolidateAddresses: t.array(t.string),

  // Fees / gas
  feeRate: t.union([t.number, t.string]),
  feeLimit: t.string,
  feeMultiplier: t.number,
  maxFeeRate: t.number,
  numBlocks: t.number,
  gasLimit: t.union([t.string, t.number]),
  gasPrice: t.union([t.string, t.number]),
  eip1559: EIP1559Params,

  // Unspents / confirmation policy
  minConfirms: t.number,
  enforceMinConfirmsForChange: t.boolean,
  targetWalletUnspents: t.number,
  minValue: t.union([t.number, t.string]),
  maxValue: t.union([t.number, t.string]),
  noSplitChange: t.boolean,
  unspents: t.array(t.string),
  allowExternalChangeAddress: t.boolean,
  allowNonSegwitSigningWithoutPrevTx: t.boolean,

  // Metadata / tracking
  sequenceId: t.union([t.string, t.number]),
  comment: t.string,
  message: t.string,
  memo: MemoParams,
  transferId: t.number,
  custodianTransactionId: t.string,
  tokenName: t.string,
  type: t.string,
  addressType: t.string,
  changeAddressType: t.string,
  txFormat: t.union([t.literal('legacy'), t.literal('psbt'), t.literal('psbt-lite')]),
  keepAlive: t.boolean,
  instant: t.boolean,
  hop: t.boolean,
  isTss: t.boolean,
  isTestTransaction: t.boolean,
  isEvmBasedCrossChainRecovery: t.boolean,
  preview: t.boolean,
  offlineVerification: t.boolean,
  data: t.string,
  expireTime: t.number,

  // Ledger / block validity windows
  lastLedgerSequence: t.number,
  ledgerSequenceDelta: t.number,
  validFromBlock: t.number,
  validToBlock: t.number,

  // Token / NFT / enablement
  nftCollectionId: t.string,
  nftId: t.string,
  enableTokens: t.array(TokenEnablement),

  // Misc account-based / enterprise fields
  nonce: t.string,
  nonParticipation: t.boolean,
  walletContractAddress: t.string,
  idfSignedTimestamp: t.string,
  idfUserId: t.string,
  idfVersion: t.number,
  lowFeeTxid: t.string,
  reservation: t.partial({
    expireTime: t.string,
    pendingApprovalId: t.string,
  }),

  // Verification
  verifyTxParams: t.any,
  verification: t.any,

  // Chain-specific opaque blobs (validated at the route layer when present)
  solInstructions: t.any,
  solVersionedTransactionData: t.any,
  aptosCustomTransactionParams: t.any,
});

export type CreateTSSSendParamsBody = t.TypeOf<typeof CreateTSSSendParamsBody>;
