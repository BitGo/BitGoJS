import { IRequestTracer } from '../../api';
import { KeyPair, KeychainsTriplet } from '../baseCoin';
import { IWallet } from '../wallet';

export type KeyType = 'tss' | 'independent' | 'blsdkg';

export interface Keychain {
  id: string;
  pub: string;
  prv?: string;
  provider?: string;
  encryptedPrv?: string;
  derivationPath?: string;
  derivedFromParentWithSeed?: string;
  commonPub?: string;
  commonKeychain?: string;
  keyShares?: ApiKeyShare[];
  walletHSMGPGPublicKeySigs?: string;
}

export interface ChangedKeychains {
  [pubkey: string]: string;
}

export interface ListKeychainsResult {
  keys: Keychain[];
  nextBatchPrevId?: string;
}

export interface GetKeychainOptions {
  id: string;
  xpub?: string;
  ethAddress?: string;
  reqId?: IRequestTracer;
}

export interface ListKeychainOptions {
  limit?: number;
  prevId?: string;
}

export interface UpdatePasswordOptions {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateSingleKeychainPasswordOptions {
  keychain?: Keychain;
  oldPassword?: string;
  newPassword?: string;
}

export interface AddKeychainOptions {
  pub?: string;
  commonPub?: string;
  commonKeychain?: string;
  encryptedPrv?: string;
  type?: string;
  keyType?: KeyType;
  source?: string;
  originalPasscodeEncryptionCode?: string;
  enterprise?: string;
  derivedFromParentWithSeed?: any;
  disableKRSEmail?: boolean;
  provider?: string;
  reqId?: IRequestTracer;
  krsSpecific?: any;
  keyShares?: ApiKeyShare[];
  userGPGPublicKey?: string;
  backupGPGPublicKey?: string;
}

export interface ApiKeyShare {
  from: 'user' | 'backup' | 'bitgo';
  to: 'user' | 'backup' | 'bitgo';
  publicShare: string;
  privateShare: string;
  privateShareProof?: string;
  n?: string;
  vssProof?: string;
}

export interface CreateBackupOptions {
  provider?: string;
  source?: string;
  disableKRSEmail?: boolean;
  krsSpecific?: any;
  type?: string;
  keyType?: KeyType;
  reqId?: IRequestTracer;
  commonPub?: string;
  commonKeychain?: string;
  prv?: string;
  encryptedPrv?: string;
}

export interface CreateBitGoOptions {
  source?: 'bitgo';
  enterprise?: string;
  reqId?: IRequestTracer;
  keyType?: KeyType;
}

export interface CreateMpcOptions {
  multisigType: 'onchain' | 'tss' | 'blsdkg';
  passphrase?: string;
  originalPasscodeEncryptionCode?: string;
  enterprise?: string;
  backupProvider?: string;
}

export interface GetKeysForSigningOptions {
  reqId?: IRequestTracer;
  wallet?: IWallet;
}

export enum KeyIndices {
  USER = 0,
  BACKUP = 1,
  BITGO = 2,
}

export interface IKeychains {
  get(params: GetKeychainOptions): Promise<Keychain>;
  list(params?: ListKeychainOptions): Promise<ListKeychainsResult>;
  updatePassword(params: UpdatePasswordOptions): Promise<ChangedKeychains>;
  updateSingleKeychainPassword(params?: UpdateSingleKeychainPasswordOptions): Keychain;
  create(params?: { seed?: Buffer }): KeyPair;
  add(params?: AddKeychainOptions): Promise<Keychain>;
  createBitGo(params?: CreateBitGoOptions): Promise<Keychain>;
  createBackup(params?: CreateBackupOptions): Promise<Keychain>;
  getKeysForSigning(params?: GetKeysForSigningOptions): Promise<Keychain[]>;
  createMpc(params: CreateMpcOptions): Promise<KeychainsTriplet>;
}
