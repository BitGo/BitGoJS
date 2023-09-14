import { Key, SerializedKeyPair } from 'openpgp';
import { IRequestTracer } from '../../../api';
import { KeychainsTriplet, ParsedTransaction } from '../../baseCoin';
import { ApiKeyShare, Keychain } from '../../keychain';
import { ApiVersion, Memo, WalletType } from '../../wallet';
import { EDDSA, GShare, SignShare, Signature } from '../../../account-lib/mpc/tss';
import { KeyShare } from './ecdsa';
import { Hash } from 'crypto';
import { EcdsaTypes } from '@bitgo/sdk-lib-mpc';
import { TssEcdsaStep1ReturnMessage, TssEcdsaStep2ReturnMessage, TxRequestChallengeResponse } from '../../tss/types';
import { AShare, DShare, SShare } from '../../tss/ecdsa/types';

export type TxRequestVersion = 'full' | 'lite';
export interface HopParams {
  paymentId?: string;
  userReqSig?: string;
  gasPriceMax?: number;
}

export interface EIP1559FeeOptions {
  gasLimit?: number;
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
}

export interface FeeOption {
  unit?: 'baseUnit' | 'cpu' | 'ram';
  formula?: 'fixed' | 'feeRate' | 'perKB' | 'custom' | 'perVKB';
  feeType?: 'base' | 'max' | 'tip';
  gasLimit?: number;
  gasPrice?: number;
}

export interface TokenEnablement {
  name: string;
  address?: string; // Some chains like Solana require tokens to be enabled for specific address. If absent, we will enable it for the wallet's root address
}

export enum ShareType {
  R = 'R',
  Commitment = 'commitment',
  G = 'G',
  S = 'S',
  K = 'K',
  MuDelta = 'MuDelta',
  PaillierModulus = 'PaillierModulus',
}

export enum MPCType {
  EDDSA = 'eddsa',
  ECDSA = 'ecdsa',
}

export interface CustomPaillierModulusGetterFunction {
  (params: { txRequest: TxRequest }): Promise<{
    userPaillierModulus: string;
  }>;
}

export interface CustomKShareGeneratingFunction {
  (params: {
    tssParams: TSSParams | TSSParamsForMessage;
    challenges: {
      enterpriseChallenge: EcdsaTypes.SerializedEcdsaChallenges;
      bitgoChallenge: TxRequestChallengeResponse;
    };
    requestType: RequestType;
  }): Promise<TssEcdsaStep1ReturnMessage>;
}

export interface CustomMuDeltaShareGeneratingFunction {
  (params: {
    txRequest: TxRequest;
    aShareFromBitgo: Omit<AShare, 'ntilde' | 'h1' | 'h2'>;
    bitgoChallenge: TxRequestChallengeResponse;
    encryptedWShare: string;
  }): Promise<TssEcdsaStep2ReturnMessage>;
}

export interface CustomSShareGeneratingFunction {
  (params: {
    tssParams: TSSParams | TSSParamsForMessage;
    dShareFromBitgo: DShare;
    requestType: RequestType;
    encryptedOShare: string;
  }): Promise<SShare>;
}

export interface CustomCommitmentGeneratingFunction {
  (params: { txRequest: TxRequest }): Promise<{
    userToBitgoCommitment: CommitmentShareRecord;
    encryptedSignerShare: EncryptedSignerShareRecord;
    encryptedUserToBitgoRShare: EncryptedSignerShareRecord;
  }>;
}

export interface CustomRShareGeneratingFunction {
  (params: { txRequest: TxRequest; encryptedUserToBitgoRShare: EncryptedSignerShareRecord }): Promise<{
    rShare: SignShare;
  }>;
}

export interface CustomGShareGeneratingFunction {
  (params: {
    txRequest: TxRequest;
    userToBitgoRShare: SignShare;
    bitgoToUserRShare: SignatureShareRecord;
    bitgoToUserCommitment: CommitmentShareRecord;
  }): Promise<GShare>;
}
export enum TokenType {
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  ERC20 = 'ERC20',
}
export interface TokenTransferRecipientParams {
  tokenType: TokenType;
  tokenQuantity: string;
  tokenContractAddress?: string;
  tokenName?: string;
  tokenId?: string;
  decimalPlaces?: number;
}
interface IntentOptionsBase {
  reqId: IRequestTracer;
  intentType: string;
  sequenceId?: string;
  isTss?: boolean;
  comment?: string;
  memo?: Memo;
  custodianTransactionId?: string;
  custodianMessageId?: string;
}

export interface IntentOptionsForMessage extends IntentOptionsBase {
  messageRaw: string;
  messageEncoded?: string;
}

export interface IntentOptionsForTypedData extends IntentOptionsBase {
  typedDataRaw: string;
  typedDataEncoded?: string;
}

export interface PrebuildTransactionWithIntentOptions extends IntentOptionsBase {
  recipients?: {
    address: string;
    amount: string | number;
    data?: string;
    tokenName?: string;
    tokenData?: TokenTransferRecipientParams;
  }[];
  tokenName?: string;
  enableTokens?: TokenEnablement[];
  nonce?: string;
  selfSend?: boolean;
  feeOptions?: FeeOption | EIP1559FeeOptions;
  hopParams?: HopParams;
  lowFeeTxid?: string;
  custodianTransactionId?: string;
  receiveAddress?: string;
}
export interface IntentRecipient {
  address: {
    address: string;
  };
  amount: {
    value: string | number;
    symbol: string;
  };
  data?: string;
  tokenData?: TokenTransferRecipientParams;
}
interface PopulatedIntentBase {
  intentType: string;
  sequenceId?: string;
  comment?: string;
  memo?: string;
  isTss?: boolean;
}

export interface PopulatedIntentForMessageSigning extends PopulatedIntentBase {
  messageRaw: string;
  messageEncoded: string;
  custodianMessageId?: string;
}

export interface PopulatedIntentForTypedDataSigning extends PopulatedIntentBase {
  messageRaw: string;
  messageEncoded: string;
  custodianMessageId?: string;
}

export interface PopulatedIntent extends PopulatedIntentBase {
  recipients?: IntentRecipient[];
  nonce?: string;
  token?: string;
  enableTokens?: TokenEnablement[];
  // ETH & ETH-like params
  selfSend?: boolean;
  feeOptions?: FeeOption | EIP1559FeeOptions;
  hopParams?: HopParams;
  txid?: string;
  receiveAddress?: string;
  custodianTransactionId?: string;
  custodianMessageId?: string;
}

export type TxRequestState =
  | 'pendingCommitment'
  | 'pendingApproval'
  | 'canceled'
  | 'rejected'
  | 'initialized'
  | 'pendingDelivery'
  | 'delivered'
  | 'pendingUserSignature'
  | 'signed';

export type TransactionState =
  | 'initialized'
  | 'pendingCommitment'
  | 'pendingSignature'
  | 'signed'
  | 'held'
  | 'delivered'
  | 'invalidSignature'
  | 'rejected';

// Type used to sign a TSS transaction
export type SignableTransaction = {
  // unsigned transaction in broadcast format
  serializedTxHex: string;
  // portion of a transaction used to generate a signature
  signableHex: string;
};

export type UnsignedTransactionTss = SignableTransaction & {
  // derivation path of the signer
  derivationPath: string;
  // transaction fees
  feeInfo?: {
    fee: number;
    feeString: string;
  };
  coinSpecific?: Record<string, unknown>;
  parsedTx?: unknown;
};

export type UnsignedMessageTss = {
  derivationPath: string;
  message: string;
};

export enum RequestType {
  tx,
  message,
}

export type TxRequest = {
  txRequestId: string;
  walletId: string;
  walletType: WalletType;
  version: number;
  enterpriseId?: string;
  state: TxRequestState;
  date: string;
  userId: string;
  intent: unknown; // Should override with sig scheme specific intent
  pendingApprovalId?: string;
  policiesChecked: boolean;
  signatureShares?: SignatureShareRecord[];
  commitmentShares?: CommitmentShareRecord[];
  pendingTxHashes?: string[];
  txHashes?: string[];
  unsignedMessages?: UnsignedMessageTss[];
  // Only available in 'lite' version
  unsignedTxs: UnsignedTransactionTss[]; // Should override with blockchain / sig scheme specific unsigned tx
  // Only available in 'full' version
  transactions?: {
    state: TransactionState;
    unsignedTx: UnsignedTransactionTss; // Should override with blockchain / sig specific unsigned tx
    signatureShares: SignatureShareRecord[];
    commitmentShares?: CommitmentShareRecord[];
  }[];
  messages?: {
    state: TransactionState;
    signatureShares: SignatureShareRecord[];
    combineSigShare?: string;
    txHash?: string;
  }[];
  apiVersion?: TxRequestVersion;
  latest: boolean;
};

export type CreateKeychainParamsBase = {
  userGpgKey: SerializedKeyPair<string>;
  bitgoKeychain: Keychain;
  passphrase?: string;
  enterprise?: string;
  originalPasscodeEncryptionCode?: string;
};

export type CreateBitGoKeychainParamsBase = Omit<CreateKeychainParamsBase, 'bitgoKeychain'>;

export enum SignatureShareType {
  USER = 'user',
  BACKUP = 'backup',
  BITGO = 'bitgo',
}

interface ShareBaseRecord {
  from: SignatureShareType;
  to: SignatureShareType;
  share: string;
}

export interface SignatureShareRecord extends ShareBaseRecord {
  vssProof?: string;
  privateShareProof?: string;
  publicShare?: string;
}

export enum CommitmentType {
  COMMITMENT = 'commitment',
  DECOMMITMENT = 'decommitment',
}
export interface CommitmentShareRecord extends ShareBaseRecord {
  type: CommitmentType;
}

export interface ExchangeCommitmentResponse {
  commitmentShare: CommitmentShareRecord;
}

export enum EncryptedSignerShareType {
  ENCRYPTED_SIGNER_SHARE = 'encryptedSignerShare',
  ENCRYPTED_R_SHARE = 'encryptedRShare',
}
export interface EncryptedSignerShareRecord extends ShareBaseRecord {
  type: EncryptedSignerShareType;
}

export type TSSParams = {
  txRequest: string | TxRequest; // can be either a string or TxRequest
  prv: string;
  reqId: IRequestTracer;
  apiVersion?: ApiVersion;
  hash?: Hash;
};

export type TSSParamsForMessage = TSSParams & {
  messageRaw: string;
  messageEncoded?: string;
  bufferToSign: Buffer;
};

export interface BitgoHeldBackupKeyShare {
  commonKeychain?: string;
  id: string;
  keyShares: ApiKeyShare[];
}

export interface BackupKeyShare {
  bitGoHeldKeyShares?: BitgoHeldBackupKeyShare;
  userHeldKeyShare?: KeyShare;
}

export interface BitgoGPGPublicKey {
  name: string;
  publicKey: string;
  enterpriseId: string;
}

export interface MPCTx {
  serializedTx: string;
  scanIndex: number;
  coin?: string;
  signableHex?: string;
  derivationPath?: string;
  parsedTx?: ParsedTransaction;
  feeInfo?: {
    fee: number;
    feeString: string;
  };
  coinSpecific?: {
    firstValid?: number;
    maxDuration?: number;
    commonKeychain?: string;
    lastScanIndex?: number;
  };
}

export interface MPCRecoveryOptions {
  userKey?: string; // Box A
  backupKey?: string; // Box B
  bitgoKey: string; // Box C - this is bitgo's xpub and will be used to derive their root address
  recoveryDestination: string;
  walletPassphrase?: string;
  seed?: string;
  index?: number;
}

export interface MPCConsolidationRecoveryOptions {
  userKey?: string; // Box A
  backupKey?: string; // Box B
  bitgoKey: string; // Box C
  walletPassphrase?: string;
  startingScanIndex?: number; // default to 1 (inclusive)
  endingScanIndex?: number; // default to startingScanIndex + 20 (exclusive)
  seed?: string;
}

export interface MPCSweepTxs {
  txRequests: RecoveryTxRequest[];
}

export interface RecoveryTxRequest {
  walletCoin: string;
  transactions: MPCUnsignedTx[] | OvcTransaction[];
}

export interface MPCUnsignedTx {
  unsignedTx: MPCTx;
  signatureShares: [];
}

export interface MPCSweepRecoveryOptions {
  signatureShares: SignatureShares[];
}

interface SignatureShares {
  txRequest: RecoveryTxRequest;
  tssVersion: string;
  ovc: Ovc[];
}

interface OvcTransaction {
  unsignedTx: MPCTx;
  signatureShares: SignatureShareRecord[];
  signatureShare: SignatureShare;
}

interface SignatureShare {
  from: string;
  to: string;
  share: string;
  publicShare: string;
}

interface Ovc {
  eddsaSignature: Signature;
}

export interface MPCTxs {
  transactions: MPCTx[];
  lastScanIndex: number;
}

export type BackupGpgKey = SerializedKeyPair<string> | Key;

/**
 * Common Interface for implementing signature scheme specific
 * util functions
 */
export interface ITssUtils<KeyShare = EDDSA.KeyShare> {
  createBitgoHeldBackupKeyShare(
    userGpgKey: SerializedKeyPair<string>,
    enterprise: string | undefined
  ): Promise<BitgoHeldBackupKeyShare>;
  finalizeBitgoHeldBackupKeyShare(
    keyId: string,
    commonKeychain: string,
    userKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    gpgKey: SerializedKeyPair<string>,
    bitgoPublicGpgKey?: Key
  ): Promise<BitgoHeldBackupKeyShare>;
  createUserKeychain(params: CreateKeychainParamsBase): Promise<Keychain>;
  createBackupKeychain(params: CreateKeychainParamsBase): Promise<Keychain>;
  createBitgoKeychain(params: CreateBitGoKeychainParamsBase): Promise<Keychain>;
  createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
    isThirdPartyBackup?: boolean;
  }): Promise<KeychainsTriplet>;
  signTxRequest(params: { txRequest: string | TxRequest; prv: string; reqId: IRequestTracer }): Promise<TxRequest>;
  signTxRequestForMessage(params: TSSParams): Promise<TxRequest>;
  signEddsaTssUsingExternalSigner(
    txRequest: string | TxRequest,
    externalSignerCommitmentGenerator: CustomCommitmentGeneratingFunction,
    externalSignerRShareGenerator: CustomRShareGeneratingFunction,
    externalSignerGShareGenerator: CustomGShareGeneratingFunction
  ): Promise<TxRequest>;
  signEcdsaTssUsingExternalSigner(
    params: TSSParams | TSSParamsForMessage,
    requestType: RequestType,
    externalSignerPaillierModulusGetter: CustomPaillierModulusGetterFunction,
    externalSignerKShareGenerator: CustomKShareGeneratingFunction,
    externalSignerMuDeltaShareGenerator: CustomMuDeltaShareGeneratingFunction,
    externalSignerSShareGenerator: CustomSShareGeneratingFunction
  ): Promise<TxRequest>;
  createCommitmentShareFromTxRequest(params: { txRequest: TxRequest; prv: string; walletPassphrase: string }): Promise<{
    userToBitgoCommitment: CommitmentShareRecord;
    encryptedSignerShare: EncryptedSignerShareRecord;
    encryptedUserToBitgoRShare: EncryptedSignerShareRecord;
  }>;
  createRShareFromTxRequest(params: {
    txRequest: TxRequest;
    walletPassphrase: string;
    encryptedUserToBitgoRShare: EncryptedSignerShareRecord;
  }): Promise<{ rShare: SignShare }>;
  createGShareFromTxRequest(params: {
    txRequest: TxRequest;
    prv: string;
    bitgoToUserRShare: SignatureShareRecord;
    userToBitgoRShare: SignShare;
    bitgoToUserCommitment: CommitmentShareRecord;
  }): Promise<GShare>;
  prebuildTxWithIntent(
    params: PrebuildTransactionWithIntentOptions,
    apiVersion?: TxRequestVersion,
    preview?: boolean
  ): Promise<TxRequest>;
  deleteSignatureShares(txRequestId: string): Promise<SignatureShareRecord[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendTxRequest(txRequestId: string): Promise<any>;
  recreateTxRequest(txRequestId: string, decryptedPrv: string, reqId: IRequestTracer): Promise<TxRequest>;
  getTxRequest(txRequestId: string): Promise<TxRequest>;
  supportedTxRequestVersions(): TxRequestVersion[];
}
