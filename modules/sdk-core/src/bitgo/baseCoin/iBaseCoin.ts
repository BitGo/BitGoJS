import { IRequestTracer } from '../../api';
import { IEnterprises } from '../enterprise';
import { Keychain, IKeychains } from '../keychain';
import { IMarkets } from '../market';
import { IPendingApprovals } from '../pendingApproval';
import { InitiateRecoveryOptions } from '../recovery';
import { ITssUtils } from '../utils';
import { IWallet, IWallets, WalletData } from '../wallet';

import { IWebhooks } from '../webhook/iWebhooks';

export interface ITransactionRecipient {
  address: string;
  amount: string | number;
  memo?: string;
}

export interface ITransactionFee<TAmount = string> {
  fee: TAmount;
  feeRate?: number;
  size?: number;
}

export interface ITransactionExplanation<TFee = any, TAmount = any> {
  displayOrder: string[];
  id: string;
  outputs: ITransactionRecipient[];
  outputAmount: TAmount;
  changeOutputs: ITransactionRecipient[];
  changeAmount: TAmount;
  fee: TFee;
  proxy?: string;
  producers?: string[];
}

export interface KeyPair {
  pub?: string;
  prv: string;
}

export interface IBlsKeyPair extends KeyPair {
  secretShares?: string[];
}

export interface VerifyAddressOptions {
  address: string;
  addressType?: string;
  keychains?: {
    pub: string;
  }[];
  error?: string;
  coinSpecific?: AddressCoinSpecific;
  impliedForwarderVersion?: number;
}

export interface TransactionParams {
  recipients?: ITransactionRecipient[];
  walletPassphrase?: string;
  type?: string;
}

export interface AddressVerificationData {
  coinSpecific?: AddressCoinSpecific;
  chain?: number;
  index?: number;
}

export interface VerificationOptions {
  disableNetworking?: boolean;
  keychains?: {
    user?: Keychain;
    backup?: Keychain;
    bitgo?: Keychain;
  };
  addresses?: { [address: string]: AddressVerificationData };
  allowPaygoOutput?: boolean;
  considerMigratedFromAddressInternal?: boolean;
}

export interface VerifyTransactionOptions {
  txPrebuild: TransactionPrebuild;
  txParams: TransactionParams;
  wallet: IWallet;
  verification?: VerificationOptions;
  reqId?: IRequestTracer;
}

export interface SupplementGenerateWalletOptions {
  label: string;
  m: number;
  n: number;
  enterprise?: string;
  disableTransactionNotifications?: boolean;
  gasPrice?: number | string;
  eip1559?: {
    maxFeePerGas: number | string;
    maxPriorityFeePerGas?: number | string;
  };
  walletVersion?: number;
  keys: string[];
  isCold: boolean;
  keySignatures?: {
    backup: string;
    bitgo: string;
  };
  rootPrivateKey?: string;
  disableKRSEmail?: boolean;
  multisigType?: 'tss' | 'onchain' | 'blsdkg';
}

export interface FeeEstimateOptions {
  numBlocks?: number;
  hop?: boolean;
  recipient?: string;
  data?: string;
  amount?: string;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ExtraPrebuildParamsOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface PresignTransactionOptions {
  txPrebuild?: TransactionPrebuild;
  walletData: WalletData;
  tssUtils: ITssUtils;
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface PrecreateBitGoOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface VerifyRecoveryTransactionOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ParseTransactionOptions {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface ParsedTransaction {
  [index: string]: unknown;
}

// TODO (SDKT-9): reverse engineer and add options
export interface SignTransactionOptions {
  [index: string]: unknown;
}

export interface KeychainsTriplet {
  userKeychain: Keychain;
  backupKeychain: Keychain;
  bitgoKeychain: Keychain;
}

export interface TransactionPrebuild {
  txBase64?: string;
  txHex?: string;
  txInfo?: unknown;
  wallet?: IWallet;
  buildParams?: any;
  consolidateId?: string;
  txRequestId?: string;
}

export interface AddressCoinSpecific {
  outputScript?: string;
  redeemScript?: string;
  witnessScript?: string;
  baseAddress?: string;
  pendingChainInitialization?: boolean;
  forwarderVersion?: number;
}

export interface FullySignedTransaction {
  txHex: string; // Transaction in any format required by each coin, i.e. in Tron it is a stringifyed JSON
}

export interface HalfSignedUtxoTransaction {
  txHex: string;
}

export interface HalfSignedAccountTransaction {
  halfSigned?: {
    txHex?: string; // Transaction in any format required by each coin, i.e. in Tron it is a stringifyed JSON
    payload?: string;
    txBase64?: string;
  };
}

export interface SignedTransactionRequest {
  txRequestId: string;
}

export type SignedTransaction =
  | HalfSignedAccountTransaction
  | HalfSignedUtxoTransaction
  | FullySignedTransaction
  | SignedTransactionRequest;

export interface IBaseCoin {
  url(suffix: string): string;
  wallets(): IWallets;
  enterprises(): IEnterprises;
  keychains(): IKeychains;
  webhooks(): IWebhooks;
  pendingApprovals(): IPendingApprovals;
  markets(): IMarkets;
  getChain(): string;
  getFamily(): string;
  getFullName(): string;
  valuelessTransferAllowed(): boolean;
  sweepWithSendMany(): boolean;
  transactionDataAllowed(): boolean;
  allowsAccountConsolidations(): boolean;
  supportsTss(): boolean;
  supportsBlsDkg(): boolean;
  getBaseFactor(): number | string;
  baseUnitsToBigUnits(baseUnits: string | number): string;
  bigUnitsToBaseUnits(bigUnits: string | number): string;
  signMessage(key: { prv: string }, message: string): Promise<Buffer>;
  explainTransaction(options: Record<string, any>): Promise<ITransactionExplanation<any, string | number> | undefined>;
  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean>;
  verifyAddress(params: VerifyAddressOptions): boolean;
  isWalletAddress(params: VerifyAddressOptions): boolean;
  canonicalAddress(address: string, format: unknown): string;
  supportsBlockTarget(): boolean;
  supplementGenerateWallet(walletParams: SupplementGenerateWalletOptions, keychains: KeychainsTriplet): Promise<any>;
  getExtraPrebuildParams(buildParams: ExtraPrebuildParamsOptions): Promise<Record<string, unknown>>;
  postProcessPrebuild(prebuildResponse: TransactionPrebuild): Promise<TransactionPrebuild>;
  presignTransaction(params: PresignTransactionOptions): Promise<PresignTransactionOptions>;
  newWalletObject(walletParams: any): IWallet;
  feeEstimate(params: FeeEstimateOptions): Promise<any>;
  deriveKeyWithSeed(key: undefined, seed: undefined): { key: string; derivationPath: string };
  keyIdsForSigning(): number[];
  preCreateBitGo(params: PrecreateBitGoOptions): void;
  initiateRecovery(params: InitiateRecoveryOptions): never;
  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction>;
  generateKeyPair(seed: Buffer): KeyPair;
  isValidPub(pub: string): boolean;
  isValidMofNSetup(m: undefined, n: undefined): boolean;
  isValidAddress(address: string): boolean;
  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction>;
  getSignablePayload(serializedTx: string): Promise<Buffer>;
}
