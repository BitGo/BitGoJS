import * as t from 'io-ts';

import { IRequestTracer } from '../../api';
import { KeychainsTriplet, LightningKeychainsTriplet } from '../baseCoin';
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

export interface GetWalletOptions {
  allTokens?: boolean;
  reqId?: IRequestTracer;
  id?: string;
}

export interface GenerateBaseMpcWalletOptions {
  multisigType: 'tss' | 'blsdkg';
  label: string;
  enterprise: string;
  walletVersion?: number;
}

export interface GenerateMpcWalletOptions extends GenerateBaseMpcWalletOptions {
  passphrase: string;
  originalPasscodeEncryptionCode?: string;
  backupProvider?: BackupProvider;
}
export interface GenerateSMCMpcWalletOptions extends GenerateBaseMpcWalletOptions {
  bitgoKeyId: string;
  commonKeychain: string;
  coldDerivationSeed?: string;
}

export const backupProviders = ['BitGoTrustAsKrs'] as const;
export type BackupProvider = (typeof backupProviders)[number];
export interface GenerateWalletOptions {
  label?: string;
  passphrase?: string;
  userKey?: string;
  backupXpub?: string;
  backupXpubProvider?: string;
  backupProvider?: BackupProvider;
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
  type?: 'hot' | 'cold' | 'custodial';
}

export const GenerateLightningWalletOptionsCodec = t.strict(
  {
    label: t.string,
    passphrase: t.string,
    enterprise: t.string,
    passcodeEncryptionCode: t.string,
  },
  'GenerateLightningWalletOptions'
);

export type GenerateLightningWalletOptions = t.TypeOf<typeof GenerateLightningWalletOptionsCodec>;

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
  /**
   * Optional property for receiving an address.
   * If skipReceiveAddress is set to true, the receiveAddress property will not be returned in the wallet object.
   */
  skipReceiveAddress?: boolean;
}

export interface WalletShares {
  incoming: WalletShare[]; // WalletShares that the user has to accept
  outgoing: WalletShare[]; // WalletShares that the user has created
}

export interface AcceptShareResponse {
  walletShareId: string;
}

export interface IWallets {
  get(params?: GetWalletOptions): Promise<Wallet>;
  list(params?: ListWalletOptions): Promise<{ wallets: IWallet[] }>;
  add(params?: AddWalletOptions): Promise<any>;
  generateWallet(params?: GenerateWalletOptions): Promise<WalletWithKeychains | LightningWalletWithKeychains>;
  listShares(params?: Record<string, unknown>): Promise<any>;
  getShare(params?: { walletShareId?: string }): Promise<any>;
  updateShare(params?: UpdateShareOptions): Promise<any>;
  resendShareInvite(params?: { walletShareId?: string }): Promise<any>;
  cancelShare(params?: { walletShareId?: string }): Promise<any>;
  acceptShare(params?: AcceptShareOptions): Promise<any>;
  getWallet(params?: GetWalletOptions): Promise<IWallet>;
  getWalletByAddress(params?: GetWalletByAddressOptions): Promise<IWallet>;
  getTotalBalances(params?: Record<string, never>): Promise<any>;
  bulkAcceptShare(params: BulkAcceptShareOptions): Promise<AcceptShareResponse[]>;
  listSharesV2(): Promise<WalletShares>;
}
