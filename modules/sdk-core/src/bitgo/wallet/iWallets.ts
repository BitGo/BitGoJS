import * as t from 'io-ts';

import { IRequestTracer } from '../../api';
import { KeychainsTriplet, LightningKeychainsTriplet } from '../baseCoin';
import { Keychain } from '../keychain';
import { IWallet, PaginationOptions, WalletShare } from './iWallet';
import { Wallet } from './wallet';

export interface WalletWithKeychains extends KeychainsTriplet {
  responseType: 'WalletWithKeychains';
  wallet: IWallet;
  warning?: string;
  encryptedWalletPassphrase?: string;
}

export interface LightningWalletWithKeychains extends LightningKeychainsTriplet {
  responseType: 'LightningWalletWithKeychains';
  wallet: IWallet;
  warning?: string;
  encryptedWalletPassphrase?: string;
}

export interface GoAccountWalletWithUserKeychain {
  responseType: 'GoAccountWalletWithUserKeychain';
  wallet: IWallet;
  userKeychain: Keychain;
  warning?: string;
  encryptedWalletPassphrase?: string;
}

export interface GetWalletOptions {
  allTokens?: boolean;
  reqId?: IRequestTracer;
  id?: string;
  includeBalance?: boolean;
}

export interface GenerateBaseMpcWalletOptions {
  multisigType: 'tss';
  label: string;
  enterprise: string;
  walletVersion?: number;
}

export interface GenerateMpcWalletOptions extends GenerateBaseMpcWalletOptions {
  passphrase: string;
  originalPasscodeEncryptionCode?: string;
}
export interface GenerateSMCMpcWalletOptions extends GenerateBaseMpcWalletOptions {
  bitgoKeyId: string;
  commonKeychain: string;
  coldDerivationSeed?: string;
}

export interface GenerateWalletOptions {
  label?: string;
  passphrase?: string;
  userKey?: string;
  backupXpub?: string;
  backupXpubProvider?: string;
  passcodeEncryptionCode?: string;
  enterprise?: string;
  disableTransactionNotifications?: string;
  gasPrice?: string;
  eip1559?: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
  walletVersion?: number;
  disableKRSEmail?: boolean;
  krsSpecific?: {
    [index: string]: boolean | string | number;
  };
  coldDerivationSeed?: string;
  rootPrivateKey?: string;
  multisigType?: 'onchain' | 'tss' | 'blsdkg';
  isDistributedCustody?: boolean;
  bitgoKeyId?: string;
  commonKeychain?: string;
  type?: 'hot' | 'cold' | 'custodial' | 'trading';
  subType?: 'lightningCustody' | 'lightningSelfCustody';
  evmKeyRingReferenceWalletId?: string;
}

export const GenerateLightningWalletOptionsCodec = t.strict(
  {
    label: t.string,
    passphrase: t.string,
    enterprise: t.string,
    passcodeEncryptionCode: t.string,
    subType: t.union([t.literal('lightningCustody'), t.literal('lightningSelfCustody')]),
  },
  'GenerateLightningWalletOptions'
);

export type GenerateLightningWalletOptions = t.TypeOf<typeof GenerateLightningWalletOptionsCodec>;

export const GenerateGoAccountWalletOptionsCodec = t.strict(
  {
    label: t.string,
    passphrase: t.string,
    enterprise: t.string,
    passcodeEncryptionCode: t.string,
    type: t.literal('trading'),
  },
  'GenerateGoAccountWalletOptions'
);

export type GenerateGoAccountWalletOptions = t.TypeOf<typeof GenerateGoAccountWalletOptionsCodec>;

export interface GetWalletByAddressOptions {
  address?: string;
  reqId?: IRequestTracer;
}

export interface UpdateShareOptions {
  walletShareId?: string;
  state?: string;
  encryptedPrv?: string;
  keyId?: string;
  signature?: string;
  payload?: string;
}

export interface AcceptShareOptions {
  overrideEncryptedPrv?: string;
  walletShareId?: string;
  userPassword?: string;
  newWalletPassphrase?: string;
}

export interface BulkAcceptShareOptions {
  walletShareIds: string[];
  userLoginPassword: string;
  newWalletPassphrase?: string;
}

export interface AcceptShareOptionsRequest {
  walletShareId: string;
  encryptedPrv: string;
}

export interface BulkUpdateWalletShareOptions {
  shares: {
    walletShareId: string;
    status: 'accept' | 'reject';
  }[];
  userLoginPassword?: string;
  newWalletPassphrase?: string;
}

export interface BulkUpdateWalletShareOptionsRequest {
  walletShareId: string;
  encryptedPrv?: string;
  status: 'accept' | 'reject';
  keyId?: string;
  signature?: string;
  payload?: string;
}

export interface BulkUpdateWalletShareResponse {
  acceptedWalletShares: string[];
  rejectedWalletShares: string[];
  walletShareUpdateErrors: {
    walletShareId: string;
    reason: string;
  }[];
}

export interface AddWalletOptions {
  coinSpecific?: any;
  enterprise?: string;
  isCold?: IsCold;
  isCustodial?: IsCustodial;
  keys?: string[];
  keySignatures?: KeySignatures;
  label: string;
  multisigType?: 'onchain' | 'tss' | 'blsdkg';
  address?: string;
  m?: number;
  n?: number;
  tags?: string[];
  type?: string;
  walletVersion?: number;
  eip1559?: Eip1559;
  clientFlags?: string[];
  // Additional params needed for xrp
  rootPub?: string;
  // In XRP, XLM and CSPR this private key is used only for wallet creation purposes,
  // once the wallet is initialized then we update its weight to 0 making it an invalid key.
  // https://www.stellar.org/developers/guides/concepts/multi-sig.html#additional-signing-keys
  rootPrivateKey?: string;
  initializationTxs?: any;
  disableTransactionNotifications?: boolean;
  gasPrice?: number;
  evmKeyRingReferenceWalletId?: string;
}

type KeySignatures = {
  backup?: string;
  bitgo?: string;
};

/** @deprecated */
type IsCold = boolean;

/** @deprecated */
type IsCustodial = boolean;

type Eip1559 = {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
};

export interface ListWalletOptions extends PaginationOptions {
  skip?: number;
  getbalances?: boolean;
  allTokens?: boolean;
  skipReceiveAddress?: boolean; // If skipReceiveAddress is set to true, the receiveAddress property will not be returned in the wallet object.
}

export interface WalletShares {
  incoming: WalletShare[]; // WalletShares that the user has to accept
  outgoing: WalletShare[]; // WalletShares that the user has created
}

export interface AcceptShareResponse {
  walletShareId: string;
}

export interface BulkAcceptShareResponse {
  acceptedWalletShares: AcceptShareResponse[];
}

export interface IWallets {
  get(params?: GetWalletOptions): Promise<Wallet>;
  list(params?: ListWalletOptions): Promise<{ wallets: IWallet[] }>;
  add(params?: AddWalletOptions): Promise<any>;
  generateWallet(
    params?: GenerateWalletOptions
  ): Promise<WalletWithKeychains | LightningWalletWithKeychains | GoAccountWalletWithUserKeychain>;
  listShares(params?: Record<string, unknown>): Promise<any>;
  getShare(params?: { walletShareId?: string }): Promise<any>;
  updateShare(params?: UpdateShareOptions): Promise<any>;
  resendShareInvite(params?: { walletShareId?: string }): Promise<any>;
  cancelShare(params?: { walletShareId?: string }): Promise<any>;
  acceptShare(params?: AcceptShareOptions): Promise<any>;
  getWallet(params?: GetWalletOptions): Promise<IWallet>;
  getWalletByAddress(params?: GetWalletByAddressOptions): Promise<IWallet>;
  getTotalBalances(params?: Record<string, never>): Promise<any>;
  bulkAcceptShare(params: BulkAcceptShareOptions): Promise<BulkAcceptShareResponse>;
  listSharesV2(): Promise<WalletShares>;
}
