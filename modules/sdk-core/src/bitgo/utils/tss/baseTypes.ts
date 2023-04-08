import { Key, SerializedKeyPair } from 'openpgp';
import { IRequestTracer } from '../../../api';
import { KeychainsTriplet } from '../../baseCoin';
import { ApiKeyShare, Keychain } from '../../keychain';
import { ApiVersion, Memo, WalletType } from '../../wallet';
import { EDDSA, GShare, SignShare, YShare } from '../../../account-lib/mpc/tss';
import { KeyShare } from './ecdsa';

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

export interface CustomRShareGeneratingFunction {
  (params: { txRequest: TxRequest }): Promise<{ rShare: SignShare; signingKeyYShare: YShare }>;
}

export interface CustomGShareGeneratingFunction {
  (params: {
    txRequest: TxRequest;
    userToBitgoRShare: SignShare;
    bitgoToUserRShare: SignatureShareRecord;
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

export interface SignatureShareRecord {
  from: SignatureShareType;
  to: SignatureShareType;
  share: string;
  vssProof?: string;
  privateShareProof?: string;
  publicShare?: string;
}

export type TSSParams = {
  txRequest: string | TxRequest; // can be either a string or TxRequest
  prv: string;
  reqId: IRequestTracer;
  apiVersion?: ApiVersion;
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

export type ApiChallenge = {
  ntilde: string;
  h1: string;
  h2: string;
};

export type ApiChallenges = {
  enterpriseChallenge: ApiChallenge;
  bitGoChallenge: ApiChallenge;
};

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
  signUsingExternalSigner(
    txRequest: string | TxRequest,
    externalSignerRShareGenerator: CustomRShareGeneratingFunction,
    externalSignerGShareGenerator: CustomGShareGeneratingFunction
  ): Promise<TxRequest>;
  createRShareFromTxRequest(params: {
    txRequest: TxRequest;
    prv: string;
  }): Promise<{ rShare: SignShare; signingKeyYShare: YShare }>;
  createGShareFromTxRequest(params: {
    txRequest: TxRequest;
    prv: string;
    bitgoToUserRShare: SignatureShareRecord;
    userToBitgoRShare: SignShare;
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
}
