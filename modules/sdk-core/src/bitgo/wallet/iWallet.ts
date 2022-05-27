import { IRequestTracer } from '../../api';
import { VerificationOptions, TransactionPrebuild, IBaseCoin, SignedTransaction } from '../baseCoin';
import { Keychain } from '../keychain';
import { PendingApprovalData, IPendingApproval } from '../pendingApproval';
import { ITradingAccount } from '../trading';

export interface MaximumSpendableOptions {
  minValue?: number | string;
  maxValue?: number | string;
  minHeight?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  feeRate?: number;
  maxFeeRate?: number;
  recipientAddress?: string;
  limit?: number;
  target?: number;
  plainTarget?: number;
}

export interface MaximumSpendable {
  maximumSpendable: number;
  coin: string;
}

export interface Memo {
  value: string;
  type: string;
}

export interface BuildConsolidationTransactionOptions extends PrebuildTransactionOptions {
  consolidateAddresses?: string[];
}

export interface PrebuildTransactionOptions {
  reqId?: IRequestTracer;
  recipients?: {
    address: string;
    amount: string | number;
  }[];
  numBlocks?: number;
  maxFeeRate?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  targetWalletUnspents?: number;
  minValue?: number;
  maxValue?: number;
  sequenceId?: string;
  lastLedgerSequence?: number;
  ledgerSequenceDelta?: number;
  gasPrice?: number;
  noSplitChange?: boolean;
  unspents?: any[];
  changeAddress?: string;
  type?: string;
  closeRemainderTo?: string;
  nonParticipation?: boolean;
  validFromBlock?: number;
  validToBlock?: number;
  instant?: boolean;
  memo?: Memo;
  addressType?: string;
  hop?: boolean;
  walletPassphrase?: string;
  reservation?: {
    expireTime?: string;
    pendingApprovalId?: string;
  };
  offlineVerification?: boolean;
  walletContractAddress?: string;
  idfSignedTimestamp?: string;
  idfUserId?: string;
  idfVersion?: number;
  comment?: string;
  [index: string]: unknown;
  tokenName?: string;
  nonce?: string;
}

export interface PrebuildAndSignTransactionOptions extends PrebuildTransactionOptions, WalletSignTransactionOptions {
  prebuildTx?: string | PrebuildTransactionResult;
  verification?: VerificationOptions;
}

export interface PrebuildTransactionResult extends TransactionPrebuild {
  walletId: string;
  // Consolidate ID is used for consolidate account transactions and indicates if this is
  // a consolidation and what consolidate group it should be referenced by.
  consolidateId?: string;
  consolidationDetails?: {
    senderAddressIndex: number;
  };
  feeInfo?: {
    fee?: number;
    feeString?: string;
  };
}

export interface CustomSigningFunction {
  (params: { coin: IBaseCoin; txPrebuild: TransactionPrebuild; pubs?: string[] }): Promise<SignedTransaction>;
}

export interface WalletSignTransactionOptions {
  reqId?: IRequestTracer;
  txPrebuild?: TransactionPrebuild;
  prv?: string;
  pubs?: string[];
  cosignerPub?: string;
  isLastSignature?: boolean;
  customSigningFunction?: CustomSigningFunction;
  [index: string]: unknown;
}

export interface GetUserPrvOptions {
  keychain?: Keychain;
  key?: Keychain;
  prv?: string;
  coldDerivationSeed?: string;
  walletPassphrase?: string;
}

export interface WalletCoinSpecific {
  tokenFlushThresholds?: any;
  addressVersion?: number;
  baseAddress?: string;
  rootAddress?: string;
  customChangeWalletId: string;
}

export interface PaginationOptions {
  prevId?: string;
  limit?: number;
}

export interface GetTransactionOptions extends PaginationOptions {
  txHash?: string;
}

export interface TransfersOptions extends PaginationOptions {
  txHash?: string;
  allTokens?: boolean;
  searchLabel?: string;
  address?: string[] | string;
  dateGte?: string;
  dateLt?: string;
  valueGte?: number;
  valueLt?: number;
  includeHex?: boolean;
  state?: string[] | string;
  type?: string;
}

export interface GetTransferOptions {
  id?: string;
}

export interface TransferBySequenceIdOptions {
  sequenceId?: string;
}

export interface UnspentsOptions extends PaginationOptions {
  minValue?: number;
  maxValue?: number;
  minHeight?: number;
  minConfirms?: number;
  target?: number;
  segwit?: boolean;
  chains?: number[];
}

export interface ConsolidateUnspentsOptions extends WalletSignTransactionOptions {
  walletPassphrase?: string;
  xprv?: string;
  minValue?: number;
  maxValue?: number;
  minHeight?: number;
  numUnspentsToMake?: number;
  feeTxConfirmTarget?: number;
  limit?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  feeRate?: number;
  maxFeeRate?: number;
  maxFeePercentage?: number;
  comment?: string;
  otp?: string;
  targetAddress?: string;
  [index: string]: unknown;
}

export interface FanoutUnspentsOptions extends WalletSignTransactionOptions {
  walletPassphrase?: string;
  xprv?: string;
  minValue?: number;
  maxValue?: number;
  minHeight?: number;
  maxNumInputsToUse?: number;
  numUnspentsToMake?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  feeRate?: number;
  maxFeeRate?: number;
  maxFeePercentage?: number;
  feeTxConfirmTarget?: number;
  comment?: string;
  otp?: string;
  targetAddress?: string;
  [index: string]: unknown;
}

export interface SweepOptions {
  address?: string;
  walletPassphrase?: string;
  xprv?: string;
  otp?: string;
  feeRate?: number;
  maxFeeRate?: number;
  feeTxConfirmTarget?: number;
  allowPartialSweep?: boolean;
  [index: string]: unknown;
}

export interface FreezeOptions {
  duration?: number;
}

export interface TransferCommentOptions {
  id?: string;
  comment?: string;
}

export interface AddressesOptions extends PaginationOptions {
  mine?: boolean;
  sort?: number;
  labelContains?: string;
  segwit?: boolean;
  chains?: number[];
  includeBalances?: boolean;
  includeTotalAddressCount?: boolean;
  returnBalancesForToken?: string;
  pendingDeployment?: boolean;
}

export interface GetAddressOptions {
  address?: string;
  id?: string;
  reqId?: IRequestTracer;
}

export interface DeployForwardersOptions {
  address?: string;
  id?: string;
}

export interface FlushForwarderTokenOptions {
  address?: string;
  id?: string;
  tokenName: string;
  gasPrice?: number;
  eip1559?: {
    maxPriorityFeePerGas: number;
    maxFeePerGas: number;
  };
}

export interface CreateAddressOptions {
  chain?: number;
  gasPrice?: number | string;
  count?: number;
  label?: string;
  lowPriority?: boolean;
  forwarderVersion?: number;
  format?: 'base58' | 'cashaddr';
  baseAddress?: string;
  allowSkipVerifyAddress?: boolean;
  derivedAddress?: string;
  index?: number;
}

export interface UpdateAddressOptions {
  label?: string;
  address?: string;
}

export interface SimulateWebhookOptions {
  webhookId?: string;
  transferId?: string;
  pendingApprovalId?: string;
}

export interface ModifyWebhookOptions {
  url?: string;
  type?: string;
}

export interface GetPrvOptions {
  prv?: string;
  walletPassphrase?: string;
}

export interface CreateShareOptions {
  user?: string;
  permissions?: string;
  keychain?: {
    // In the context of wallet sharing, pub can represent one of:
    // pub (independant multi sig), commonPub (bls), or commonPub portion of commonKeychain (TSS)
    pub?: string;
    encryptedPrv?: string;
    fromPubKey?: string;
    toPubKey?: string;
    path?: string;
  };
  reshare?: boolean;
  message?: string;
  disableEmail?: boolean;
}

export interface ShareWalletOptions {
  email?: string;
  permissions?: string;
  walletPassphrase?: string;
  message?: string;
  reshare?: boolean;
  skipKeychain?: boolean;
  disableEmail?: boolean;
}

export interface RemoveUserOptions {
  userId?: string;
}

export interface AccelerateTransactionOptions {
  cpfpTxIds?: string[];
  cpfpFeeRate?: number;
  noCpfpFeeRate?: boolean;
  maxFee?: number;
  noMaxFee?: boolean;
  recipients?: {
    address: string;
    amount: string;
  }[];
  [index: string]: unknown;
}

export interface SubmitTransactionOptions {
  otp?: string;
  txHex?: string;
  halfSigned?: {
    txHex?: string; // Transaction in any format required by each coin, i.e. in Tron it is a stringifyed JSON
    payload?: string;
    txBase64?: string;
  };
  comment?: string;
  txRequestId?: string;
}

export interface SendOptions {
  address?: string;
  amount?: number | string;
  data?: string;
  feeLimit?: string;
  message?: string;
  walletPassphrase?: string;
  prv?: string;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  custodianTransactionId?: string;
  [index: string]: unknown;
  tokenName?: string;
}

export interface SendManyOptions extends PrebuildAndSignTransactionOptions {
  reqId?: IRequestTracer;
  recipients?: {
    address: string;
    amount: string | number;
    feeLimit?: string;
    data?: string;
    tokenName?: string;
  }[];
  numBlocks?: number;
  feeRate?: number;
  maxFeeRate?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  targetWalletUnspents?: number;
  message?: string;
  minValue?: number;
  maxValue?: number;
  sequenceId?: string;
  lastLedgerSequence?: number;
  ledgerSequenceDelta?: number;
  gasPrice?: number;
  noSplitChange?: boolean;
  unspents?: string[];
  comment?: string;
  otp?: string;
  changeAddress?: string;
  instant?: boolean;
  memo?: Memo;
  transferId?: number;
  [index: string]: unknown;
}

type WalletType = 'backing' | 'cold' | 'custodial' | 'custodialPaired' | 'hot' | 'trading';

export interface WalletData {
  id: string;
  approvalsRequired: number;
  balance: number;
  confirmedBalance: number;
  spendableBalance: number;
  balanceString: string;
  confirmedBalanceString: string;
  spendableBalanceString: string;
  coin: string;
  label: string;
  keys: string[];
  receiveAddress: {
    address: string;
  };
  migratedFrom?: string;
  coinSpecific: WalletCoinSpecific;
  pendingApprovals: PendingApprovalData[];
  enterprise: string;
  customChangeKeySignatures?: {
    user?: string;
    backup?: string;
    bitgo?: string;
  };
  multisigType: 'onchain' | 'tss';
  type?: WalletType;
}

export interface RecoverTokenOptions {
  tokenContractAddress?: string;
  recipient?: string;
  broadcast?: boolean;
  walletPassphrase?: string;
  prv?: string;
}

export interface ChangeFeeOptions {
  txid?: string;
  fee?: string;
}

export interface CreatePolicyRuleOptions {
  id?: string;
  type?: string;
  message?: string;
  condition?: unknown;
  action?: unknown;
}

export interface RemovePolicyRuleOptions {
  id?: string;
  message?: string;
}

export interface DownloadKeycardOptions {
  jsPDF?: any;
  QRCode?: any;
  userKeychain?: Keychain;
  backupKeychain?: Keychain;
  bitgoKeychain?: Keychain;
  passphrase?: string;
  passcodeEncryptionCode?: string;
  activationCode?: string;
  walletKeyID?: string;
  backupKeyID?: string;
}

export interface IWallet {
  baseCoin: IBaseCoin;
  url(extra: string): string;
  id(): string;
  approvalsRequired(): number;
  balance(): number;
  prebuildWhitelistedParams(): string[];
  prebuildConsolidateAccountParams(): string[];
  confirmedBalance(): number;
  spendableBalance(): number;
  balanceString(): string;
  confirmedBalanceString(): string;
  spendableBalanceString(): string;
  coin(): string;
  label(): string;
  keyIds(): string[];
  receiveAddress(): string;
  migratedFrom(): string | undefined;
  tokenFlushThresholds(): any;
  coinSpecific(): WalletCoinSpecific | undefined;
  pendingApprovals(): IPendingApproval[];
  refresh(params: Record<string, never>): Promise<IWallet>;
  transactions(params: PaginationOptions): Promise<any>;
  getTransaction(params: GetTransactionOptions): Promise<any>;
  transfers(params: TransfersOptions): Promise<any>;
  getTransfer(params: GetTransferOptions): Promise<any>;
  transferBySequenceId(params: TransferBySequenceIdOptions): Promise<any>;
  maximumSpendable(params: MaximumSpendableOptions): Promise<MaximumSpendable>;
  unspents(params: UnspentsOptions): Promise<any>;
  consolidateUnspents(params: ConsolidateUnspentsOptions): Promise<any>;
  fanoutUnspents(params: FanoutUnspentsOptions): Promise<any>;
  updateTokenFlushThresholds(thresholds: any): Promise<any>;
  updateForwarders(forwarderFlags: any): Promise<any>;
  deployForwarders(params: DeployForwardersOptions): Promise<any>;
  flushForwarderToken(params: FlushForwarderTokenOptions): Promise<any>;
  sweep(params: SweepOptions): Promise<any>;
  freeze(params: FreezeOptions): Promise<any>;
  transferComment(params: TransferCommentOptions): Promise<any>;
  addresses(params: AddressesOptions): Promise<any>;
  getAddress(params: GetAddressOptions): Promise<any>;
  createAddress(params: CreateAddressOptions): Promise<any>;
  updateAddress(params: UpdateAddressOptions): Promise<any>;
  listWebhooks(params: PaginationOptions): Promise<any>;
  simulateWebhook(params: SimulateWebhookOptions): Promise<any>;
  addWebhook(params: ModifyWebhookOptions): Promise<any>;
  removeWebhook(params: ModifyWebhookOptions): Promise<any>;
  getEncryptedUserKeychain(params: Record<string, never>): Promise<{ encryptedPrv: string }>;
  getPrv(params: GetPrvOptions): Promise<any>;
  createShare(params: CreateShareOptions): Promise<any>;
  shareWallet(params: ShareWalletOptions): Promise<any>;
  removeUser(params: RemoveUserOptions): Promise<any>;
  prebuildTransaction(params: PrebuildTransactionOptions): Promise<PrebuildTransactionResult>;
  signTransaction(params: WalletSignTransactionOptions): Promise<SignedTransaction>;
  getUserPrv(params: GetUserPrvOptions): string;
  prebuildAndSignTransaction(params: PrebuildAndSignTransactionOptions): Promise<SignedTransaction>;
  accelerateTransaction(params: AccelerateTransactionOptions): Promise<any>;
  submitTransaction(params: SubmitTransactionOptions): Promise<any>;
  send(params: SendOptions): Promise<any>;
  sendMany(params: SendManyOptions): Promise<any>;
  recoverToken(params: RecoverTokenOptions): Promise<any>;
  getFirstPendingTransaction(params: Record<string, never>): Promise<any>;
  changeFee(params: ChangeFeeOptions): Promise<any>;
  getPaymentInfo(params: { url?: string }): Promise<any>;
  sendPaymentResponse(params: any): Promise<any>;
  createPolicyRule(params: CreatePolicyRuleOptions): Promise<any>;
  setPolicyRule(params: any): any;
  removePolicyRule(params: RemovePolicyRuleOptions): Promise<any>;
  remove(params: Record<string, never>): Promise<any>;
  toJSON(): WalletData;
  toTradingAccount(): ITradingAccount;
  downloadKeycard(params: DownloadKeycardOptions): void;
  buildAccountConsolidations(params: BuildConsolidationTransactionOptions): Promise<PrebuildTransactionResult[]>;
  sendAccountConsolidation(params: PrebuildAndSignTransactionOptions): Promise<any>;
  sendAccountConsolidations(params: BuildConsolidationTransactionOptions): Promise<any>;
}
