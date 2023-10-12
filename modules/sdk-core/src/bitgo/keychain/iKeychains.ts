import { IRequestTracer } from '../../api';
import { KeyPair, KeychainsTriplet } from '../baseCoin';
import { BackupProvider, IWallet } from '../wallet';
import { BitGoKeyFromOvcShares, OvcToBitGoJSON } from './ovcJsonCodec';

export type KeyType = 'tss' | 'independent' | 'blsdkg';

export interface Keychain {
  id: string;
  pub?: string;
  prv?: string;
  provider?: string;
  encryptedPrv?: string;
  derivationPath?: string;
  derivedFromParentWithSeed?: string;
  commonPub?: string;
  commonKeychain?: string;
  keyShares?: ApiKeyShare[];
  walletHSMGPGPublicKeySigs?: string;
  type: KeyType;
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
  algoUsed?: string;
  isDistributedCustody?: boolean;
}

export interface ApiKeyShare {
  from: 'user' | 'backup' | 'bitgo';
  to: 'user' | 'backup' | 'bitgo';
  publicShare: string;
  privateShare: string;
  privateShareProof?: string;
  paillierPublicKey?: string;
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
  isDistributedCustody?: boolean;
}

export interface CreateMpcOptions {
  multisigType: 'onchain' | 'tss' | 'blsdkg';
  passphrase?: string;
  originalPasscodeEncryptionCode?: string;
  enterprise?: string;
  backupProvider?: BackupProvider;
}

export interface GetKeysForSigningOptions {
  reqId?: IRequestTracer;
  wallet?: IWallet;
}

export interface GetSigningKeyApi {
  userId: string;
  userEmail: string;
  derivedPubkey: string;
  // These are present when user fetches their own ecdh keychain for signing.
  derivationPath?: string;
  ecdhKeychain?: string;
}

export interface EcdhDerivedKeypair {
  derivedPubKey: string; // Hex string
  derivationPath: string; // Derivation path of the keypair
  xprv: string;
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
  createTssBitGoKeyFromOvcShares(ovcOutput: OvcToBitGoJSON): Promise<BitGoKeyFromOvcShares>;
}
