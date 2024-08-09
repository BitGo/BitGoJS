import { IRequestTracer } from '../../api';
import {
  IBaseCoin,
  Message,
  SignedMessage,
  SignedTransaction,
  TransactionPrebuild,
  VerificationOptions,
  TypedData,
  NFTTransferOptions,
} from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { Keychain, KeychainWithEncryptedPrv } from '../keychain';
import { IPendingApproval, PendingApprovalData } from '../pendingApproval';
import { IStakingWallet } from '../staking';
import { ITradingAccount } from '../trading';
import {
  CustomCommitmentGeneratingFunction,
  CustomGShareGeneratingFunction,
  CustomKShareGeneratingFunction,
  CustomMPCv2SigningRound1GeneratingFunction,
  CustomMPCv2SigningRound2GeneratingFunction,
  CustomMPCv2SigningRound3GeneratingFunction,
  CustomMuDeltaShareGeneratingFunction,
  CustomPaillierModulusGetterFunction,
  CustomRShareGeneratingFunction,
  CustomSShareGeneratingFunction,
  TokenEnablement,
  TokenTransferRecipientParams,
} from '../utils';
import { ILightning } from '../lightning/custodial';
import { SerializedNtilde } from '../../account-lib/mpc/tss/ecdsa/types';
import { IAddressBook } from '../address-book';
import { WalletUser } from '@bitgo/public-types';

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
  target?: number | string;
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

export interface BuildConsolidationTransactionOptions extends PrebuildTransactionOptions, WalletSignTransactionOptions {
  consolidateAddresses?: string[];
}

export interface BuildTokenEnablementOptions extends PrebuildTransactionOptions {
  enableTokens: TokenEnablement[];
}

type BaseBalance = {
  balanceString: string;
  confirmedBalanceString: string;
  spendableBalanceString: string;
};

export type NftBalance = BaseBalance & {
  type: string;
  metadata: {
    name: string;
    tokenContractAddress: string;
  };
  collections: {
    // map tokenId to balance of token
    [tokenId: string]: number;
  };
};

export type ApiVersion = 'lite' | 'full';

export interface PrebuildTransactionOptions {
  reqId?: IRequestTracer;
  recipients?: {
    address: string;
    amount: string | number;
    tokenName?: string;
    tokenData?: TokenTransferRecipientParams;
  }[];
  numBlocks?: number;
  maxFeeRate?: number;
  minConfirms?: number;
  enforceMinConfirmsForChange?: boolean;
  targetWalletUnspents?: number;
  minValue?: number | string;
  maxValue?: number | string;
  sequenceId?: string;
  lastLedgerSequence?: number;
  ledgerSequenceDelta?: number;
  gasPrice?: number;
  noSplitChange?: boolean;
  unspents?: any[];
  changeAddress?: string;
  allowExternalChangeAddress?: boolean;
  type?: string;
  closeRemainderTo?: string;
  nonParticipation?: boolean;
  validFromBlock?: number;
  validToBlock?: number;
  instant?: boolean;
  memo?: Memo;
  addressType?: string;
  changeAddressType?: string;
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
  enableTokens?: TokenEnablement[];
  nonce?: string;
  preview?: boolean;
  eip1559?: EIP1559;
  gasLimit?: number;
  lowFeeTxid?: string;
  receiveAddress?: string;
  isTss?: boolean;
  custodianTransactionId?: string;
  apiVersion?: ApiVersion;
  /**
   * If set to false, sweep all funds including the required minimums for address(es). E.g. Polkadot (DOT) requires 1 DOT minimum.
   */
  keepAlive?: boolean;
  /**
   * This comment applies to UTXO coins. It's asking which transaction format to use:
   * the legacy format defined by bitcoinjs-lib, or the 'psbt' format, which follows the BIP-174.
   */
  txFormat?: 'legacy' | 'psbt';
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
  pendingApprovalId?: string;
  reqId?: IRequestTracer;
}

export interface CustomSigningFunction {
  (params: {
    coin: IBaseCoin;
    txPrebuild: TransactionPrebuild;
    pubs?: string[];
    derivationSeed?: string;
  }): Promise<SignedTransaction>;
}

export interface WalletSignBaseOptions {
  reqId?: IRequestTracer;
  prv?: string;
  pubs?: string[];
  txRequestId?: string;
  cosignerPub?: string;
  isLastSignature?: boolean;
  customSigningFunction?: CustomSigningFunction;
}

export interface WalletSignTransactionOptions extends WalletSignBaseOptions {
  txPrebuild?: TransactionPrebuild;
  customCommitmentGeneratingFunction?: CustomCommitmentGeneratingFunction;
  customRShareGeneratingFunction?: CustomRShareGeneratingFunction;
  customGShareGeneratingFunction?: CustomGShareGeneratingFunction;
  customPaillierModulusGeneratingFunction?: CustomPaillierModulusGetterFunction;
  customKShareGeneratingFunction?: CustomKShareGeneratingFunction;
  customMuDeltaShareGeneratingFunction?: CustomMuDeltaShareGeneratingFunction;
  customSShareGeneratingFunction?: CustomSShareGeneratingFunction;
  customMPCv2SigningRound1GenerationFunction?: CustomMPCv2SigningRound1GeneratingFunction;
  customMPCv2SigningRound2GenerationFunction?: CustomMPCv2SigningRound2GeneratingFunction;
  customMPCv2SigningRound3GenerationFunction?: CustomMPCv2SigningRound3GeneratingFunction;
  apiVersion?: ApiVersion;
  multisigTypeVersion?: 'MPCv2';
  [index: string]: unknown;
}

interface WalletSignMessageBase extends WalletSignBaseOptions {
  walletPassphrase?: string;
  custodianMessageId?: string;
  customPaillierModulusGeneratingFunction?: CustomPaillierModulusGetterFunction;
  customKShareGeneratingFunction?: CustomKShareGeneratingFunction;
  customMuDeltaShareGeneratingFunction?: CustomMuDeltaShareGeneratingFunction;
  customSShareGeneratingFunction?: CustomSShareGeneratingFunction;
}

export interface WalletSignMessageOptions extends WalletSignMessageBase {
  message?: Message;
}

export interface WalletSignTypedDataOptions extends WalletSignMessageBase {
  typedData: TypedData;
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
  walletVersion?: number;
  hashAlgorithm?: string;
  pendingEcdsaTssInitialization?: boolean;
  keys?: string[];
}

export interface PaginationOptions {
  prevId?: string;
  limit?: number;
}

export interface GetTransactionOptions extends PaginationOptions {
  txHash?: string;
  includeRbf?: boolean;
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
  minValue?: number | string;
  maxValue?: number | string;
  minHeight?: number;
  minConfirms?: number;
  target?: number | string;
  segwit?: boolean;
  chains?: number[];
}

export interface ConsolidateUnspentsOptions extends WalletSignTransactionOptions {
  walletPassphrase?: string;
  xprv?: string;
  minValue?: number | string;
  maxValue?: number | string;
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
  bulk?: boolean;
  [index: string]: unknown;
}

export interface FanoutUnspentsOptions extends WalletSignTransactionOptions {
  walletPassphrase?: string;
  xprv?: string;
  minValue?: number | string;
  maxValue?: number | string;
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
  includeTokens?: boolean;
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

export interface FundForwardersOptions {
  forwarderAddress: string;
  amount?: string;
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

export interface ForwarderBalance {
  address: string;
  balance: string;
}

export interface ForwarderBalanceOptions {
  minimumBalance?: number;
  maximumBalance?: number;
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
  onToken?: string;
}

export interface UpdateAddressOptions {
  label?: string;
  address?: string;
}

export interface UpdateBuildDefaultOptions {
  minFeeRate?: number;
  changeAddressType?: string;
  txFormat?: 'legacy' | 'psbt';
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
  /**
   * If true, allows sharing without a keychain.
   * A falsy value is expected to throw an API error if an empty or undefined `keychain` is provided.
   */
  skipKeychain?: boolean;
}

export interface ShareWalletOptions {
  email?: string;
  permissions?: string;
  walletPassphrase?: string;
  message?: string;
  reshare?: boolean;
  /**
   * If true, skips sharing the wallet keychain with the recipient.
   */
  skipKeychain?: boolean;
  disableEmail?: boolean;
}

export interface RemoveUserOptions {
  userId?: string;
}

export interface AccelerateTransactionOptions {
  cpfpTxIds?: string[];
  rbfTxIds?: string[];
  cpfpFeeRate?: number;
  noCpfpFeeRate?: boolean;
  maxFee?: number;
  noMaxFee?: boolean;
  feeMultiplier?: number;
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
    signedChildPsbt?: string; // PSBT that has the output of txHex as input with a signature
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
  minValue?: number | string;
  maxValue?: number | string;
  sequenceId?: string;
  lastLedgerSequence?: number;
  ledgerSequenceDelta?: number;
  gasPrice?: number;
  noSplitChange?: boolean;
  unspents?: string[];
  comment?: string;
  otp?: string;
  changeAddress?: string;
  allowExternalChangeAddress?: boolean;
  instant?: boolean;
  memo?: Memo;
  transferId?: number;
  [index: string]: unknown;
  eip1559?: EIP1559;
  gasLimit?: number;
  custodianTransactionId?: string;
}

export interface FetchCrossChainUTXOsOptions {
  sourceChain?: 'P' | 'C';
}

export type Unspent = {
  outputID: number;
  amount: string; // BigNumber encoded in cb58
  txid: string; // Transaction ID encoded in cb58
  threshold: number; // Threshold for number of addresses
  addresses: string[]; // Addresses used for unlocking utxo
  outputidx: string; // Output index encoded in cb58
  locktime: string; // Time when unlocked. BigNumber encoded in cb58
};

export interface CrossChainUTXO {
  unspent: Unspent;
  fromWallet: string;
  toWallet: string;
  toAddress: string;
}

export type WalletType = 'backing' | 'cold' | 'custodial' | 'custodialPaired' | 'hot' | 'trading';
export type SubWalletType = 'distributedCustody';

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
  walletFlags?: {
    name: string;
    value: string;
  }[];
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
  multisigTypeVersion?: 'MPCv2';
  type?: WalletType;
  subType?: SubWalletType;
  tokens?: Record<string, any>[];
  nfts?: { [contractAddressOrToken: string]: NftBalance };
  unsupportedNfts?: { [contractAddress: string]: NftBalance };
  users?: WalletUser[];
}

export interface RecoverTokenOptions {
  tokenContractAddress?: string;
  recipient?: string;
  broadcast?: boolean;
  walletPassphrase?: string;
  prv?: string;
}

interface EIP1559 {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
}

export interface ChangeFeeOptions {
  txid?: string;
  fee?: string;
  eip1559?: EIP1559;
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

export interface ChallengeVerifiers {
  verifiers: {
    adminSignature: string;
  };
}
export interface WalletEcdsaChallenges {
  enterpriseChallenge: SerializedNtilde & ChallengeVerifiers;
  bitgoChallenge: SerializedNtilde & ChallengeVerifiers;
  createdBy: string;
}

export type SendNFTOptions = Omit<
  SendManyOptions,
  'recipients' | 'enableTokens' | 'tokenName' | 'txFormat' | 'receiveAddress'
>;

export type SendNFTResult = {
  pendingApproval: PendingApprovalData;
};

export interface IWallet {
  bitgo: BitGoBase;
  baseCoin: IBaseCoin;
  url(extra?: string): string;
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
  nftBalances(): NftBalance[] | undefined;
  unsupportedNftBalances(): NftBalance[] | undefined;
  coin(): string;
  type(): WalletType | undefined;
  multisigType(): 'onchain' | 'tss';
  multisigTypeVersion(): 'MPCv2' | undefined;
  label(): string;
  keyIds(): string[];
  receiveAddress(): string;
  migratedFrom(): string | undefined;
  tokenFlushThresholds(): any;
  coinSpecific(): WalletCoinSpecific | undefined;
  pendingApprovals(): IPendingApproval[];
  refresh(params?: Record<string, never>): Promise<IWallet>;
  transactions(params?: PaginationOptions): Promise<any>;
  getTransaction(params?: GetTransactionOptions): Promise<any>;
  transfers(params?: TransfersOptions): Promise<any>;
  getTransfer(params?: GetTransferOptions): Promise<any>;
  transferBySequenceId(params?: TransferBySequenceIdOptions): Promise<any>;
  maximumSpendable(params?: MaximumSpendableOptions): Promise<MaximumSpendable>;
  unspents(params?: UnspentsOptions): Promise<any>;
  consolidateUnspents(params?: ConsolidateUnspentsOptions): Promise<unknown>;
  fanoutUnspents(params?: FanoutUnspentsOptions): Promise<unknown>;
  updateTokenFlushThresholds(thresholds?: any): Promise<any>;
  updateForwarders(forwarderFlags?: any): Promise<any>;
  deployForwarders(params: DeployForwardersOptions): Promise<any>;
  flushForwarderToken(params: FlushForwarderTokenOptions): Promise<any>;
  getForwarderBalance(params?: ForwarderBalanceOptions): Promise<ForwarderBalance[]>;
  sweep(params?: SweepOptions): Promise<any>;
  freeze(params?: FreezeOptions): Promise<any>;
  transferComment(params?: TransferCommentOptions): Promise<any>;
  addresses(params?: AddressesOptions): Promise<any>;
  getAddress(params?: GetAddressOptions): Promise<any>;
  createAddress(params?: CreateAddressOptions): Promise<any>;
  updateAddress(params?: UpdateAddressOptions): Promise<any>;
  listWebhooks(params?: PaginationOptions): Promise<any>;
  simulateWebhook(params?: SimulateWebhookOptions): Promise<any>;
  addWebhook(params?: ModifyWebhookOptions): Promise<any>;
  removeWebhook(params?: ModifyWebhookOptions): Promise<any>;
  getEncryptedUserKeychain(): Promise<KeychainWithEncryptedPrv>;
  getPrv(params?: GetPrvOptions): Promise<any>;
  createShare(params?: CreateShareOptions): Promise<any>;
  shareWallet(params?: ShareWalletOptions): Promise<any>;
  removeUser(params?: RemoveUserOptions): Promise<any>;
  prebuildTransaction(params?: PrebuildTransactionOptions): Promise<PrebuildTransactionResult>;
  signTransaction(params?: WalletSignTransactionOptions): Promise<SignedTransaction>;
  getUserPrv(params?: GetUserPrvOptions): string;
  prebuildAndSignTransaction(params?: PrebuildAndSignTransactionOptions): Promise<SignedTransaction>;
  accelerateTransaction(params?: AccelerateTransactionOptions): Promise<any>;
  submitTransaction(params?: SubmitTransactionOptions): Promise<any>;
  send(params?: SendOptions): Promise<any>;
  sendMany(params?: SendManyOptions): Promise<any>;
  sendNft(sendOptions: SendNFTOptions, sendNftOptions: Omit<NFTTransferOptions, 'fromAddress'>): Promise<SendNFTResult>;
  recoverToken(params?: RecoverTokenOptions): Promise<any>;
  getFirstPendingTransaction(params?: Record<string, never>): Promise<any>;
  changeFee(params?: ChangeFeeOptions): Promise<any>;
  getPaymentInfo(params?: { url?: string }): Promise<any>;
  sendPaymentResponse(params?: any): Promise<any>;
  createPolicyRule(params?: CreatePolicyRuleOptions): Promise<any>;
  setPolicyRule(params?: any): any;
  removePolicyRule(params?: RemovePolicyRuleOptions): Promise<any>;
  remove(params?: Record<string, never>): Promise<any>;
  toJSON(): WalletData;
  toTradingAccount(): ITradingAccount;
  toStakingWallet(): IStakingWallet;
  toAddressBook(): IAddressBook;
  downloadKeycard(params?: DownloadKeycardOptions): void;
  buildAccountConsolidations(params?: BuildConsolidationTransactionOptions): Promise<PrebuildTransactionResult[]>;
  sendAccountConsolidation(params?: PrebuildAndSignTransactionOptions): Promise<any>;
  sendAccountConsolidations(params?: BuildConsolidationTransactionOptions): Promise<any>;
  buildTokenEnablements(params?: BuildTokenEnablementOptions): Promise<PrebuildTransactionResult[]>;
  sendTokenEnablement(params?: PrebuildAndSignTransactionOptions): Promise<any>;
  sendTokenEnablements(params?: BuildTokenEnablementOptions): Promise<any>;
  lightning(): ILightning;
  signMessage(params: WalletSignMessageOptions): Promise<SignedMessage>;
  signTypedData(params: WalletSignTypedDataOptions): Promise<SignedMessage>;
  fetchCrossChainUTXOs(params: FetchCrossChainUTXOsOptions): Promise<CrossChainUTXO[]>;
  getChallengesForEcdsaSigning(): Promise<WalletEcdsaChallenges>;
  getNftBalances(): Promise<NftBalance[]>;
}
