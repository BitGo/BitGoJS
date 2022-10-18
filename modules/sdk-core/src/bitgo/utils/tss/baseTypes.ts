import { SerializedKeyPair } from 'openpgp';
import { IRequestTracer } from '../../../api';
import { KeychainsTriplet } from '../../baseCoin';
import { ApiKeyShare, Keychain } from '../../keychain';
import { Memo, WalletType } from '../../wallet';
import { EDDSA, GShare, SignShare, YShare } from '../../../account-lib/mpc/tss';

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
export interface PrebuildTransactionWithIntentOptions {
  reqId: IRequestTracer;
  intentType: string;
  sequenceId?: string;
  recipients?: {
    address: string;
    amount: string | number;
    tokenName?: string;
    tokenData?: TokenTransferRecipientParams;
  }[];
  comment?: string;
  memo?: Memo;
  tokenName?: string;
  enableTokens?: TokenEnablement[];
  nonce?: string;
  selfSend?: boolean;
  feeOptions?: FeeOption | EIP1559FeeOptions;
  hopParams?: HopParams;
  isTss?: boolean;
  lowFeeTxid?: string;
}
export interface IntentRecipient {
  address: {
    address: string;
  };
  amount: {
    value: string | number;
    symbol: string;
  };
  tokenData?: TokenTransferRecipientParams;
}
export interface PopulatedIntent {
  intentType: string;
  recipients?: IntentRecipient[];
  sequenceId?: string;
  comment?: string;
  nonce?: string;
  memo?: string;
  token?: string;
  enableTokens?: TokenEnablement[];
  // ETH & ETH-like params
  selfSend?: boolean;
  feeOptions?: FeeOption | EIP1559FeeOptions;
  hopParams?: HopParams;
  isTss?: boolean;
  txid?: string;
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
  transactions: {
    state: TransactionState;
    unsignedTx: UnsignedTransactionTss; // Should override with blockchain / sig specific unsigned tx
    signatureShares: SignatureShareRecord[];
  }[];
  apiVersion?: TxRequestVersion;
  latest: boolean;
};

export enum SignatureShareType {
  USER = 'user',
  BACKUP = 'backup',
  BITGO = 'bitgo',
}

export interface SignatureShareRecord {
  from: SignatureShareType;
  to: SignatureShareType;
  share: string;
}

export type TSSParams = {
  txRequest: string | TxRequest; // can be either a string or TxRequest
  prv: string;
  reqId: IRequestTracer;
};

export interface BitgoHeldBackupKeyShare {
  commonKeychain?: string;
  id: string;
  keyShares: ApiKeyShare[];
}

/**
 * Common Interface for implementing signature scheme specific
 * util functions
 */
export interface ITssUtils<KeyShare = EDDSA.KeyShare> {
  createBitgoHeldBackupKeyShare(userGpgKey: SerializedKeyPair<string>): Promise<BitgoHeldBackupKeyShare>;
  finalizeBitgoHeldBackupKeyShare(
    keyId: string,
    commonKeychain: string,
    userKeyShare: KeyShare,
    bitgoKeychain: Keychain
  ): Promise<BitgoHeldBackupKeyShare>;
  createUserKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string,
    originalPasscodeEncryptionCode: string,
    recipientIndex?: number
  ): Promise<Keychain>;
  createBackupKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    bitgoKeychain: Keychain,
    passphrase: string
  ): Promise<Keychain>;
  createBitgoKeychain(
    userGpgKey: SerializedKeyPair<string>,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    enterprise: string
  ): Promise<Keychain>;
  createKeychains(params: {
    passphrase: string;
    enterprise?: string;
    originalPasscodeEncryptionCode?: string;
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
