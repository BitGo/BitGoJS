import { IRequestTracer } from '../api';
import { KeychainsTriplet } from './iBaseCoin';
import { IWallet, PaginationOptions } from './iWallet';

export interface GetWalletOptions {
  allTokens?: boolean;
  reqId?: IRequestTracer;
  id?: string;
}

export interface ListWalletOptions extends PaginationOptions {
  skip?: number;
  getbalances?: boolean;
  allTokens?: boolean;
}

export interface AddWalletOptions {
  type?: string;
  keys?: string[];
  m?: number;
  n?: number;
  tags?: string[];
  clientFlags?: string[];
  isCold?: boolean;
  isCustodial?: boolean;
  address?: string;
  rootPub?: string;
  rootPrivateKey?: string;
  initializationTxs?: any;
  disableTransactionNotifications?: boolean;
  gasPrice?: number;
  walletVersion?: number;
  multisigType?: 'onchain' | 'tss' | 'blsdkg';
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
}

export interface WalletWithKeychains extends KeychainsTriplet {
  wallet: IWallet;
  warning?: string;
}

export interface UpdateShareOptions {
  walletShareId?: string;
  state?: string;
  encryptedPrv?: string;
}

export interface AcceptShareOptions {
  overrideEncryptedPrv?: string;
  walletShareId?: string;
  userPassword?: string;
  newWalletPassphrase?: string;
}

export interface GetWalletByAddressOptions {
  address?: string;
  reqId?: IRequestTracer;
}

export interface IWallets {
  get(params: GetWalletOptions): Promise<IWallet>;
  list(params: ListWalletOptions): Promise<{ wallets: IWallet[] }>;
  add(params: AddWalletOptions): Promise<any>;
  generateWallet(params: GenerateWalletOptions): Promise<WalletWithKeychains>;
  listShares(params: Record<string, unknown>): Promise<any>;
  getShare(params: { walletShareId?: string }): Promise<any>;
  updateShare(params: UpdateShareOptions): Promise<any>;
  resendShareInvite(params: { walletShareId?: string }): Promise<any>;
  cancelShare(params: { walletShareId?: string }): Promise<any>;
  acceptShare(params: AcceptShareOptions): Promise<any>;
  getWallet(params: GetWalletOptions): Promise<IWallet>;
  getWalletByAddress(params: GetWalletByAddressOptions): Promise<IWallet>;
  getTotalBalances(params: Record<string, never>): Promise<any>;
}
