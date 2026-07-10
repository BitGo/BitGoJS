import {
  BitGoRequest,
  DecryptKeysOptions,
  DecryptOptions,
  EncryptOptions,
  GetSharingKeyOptions,
  IEncryptionSession,
  IRequestTracer,
} from '../api';
import { IBaseCoin } from './baseCoin';
import { CoinConstructor } from './coinFactory';
import { EnvironmentName } from './environments';
import { EcdhDerivedKeypair, GetSigningKeyApi } from './keychain';
import type { BitGoApiV1Wallets } from './v1Wallets';

export type {
  BitGoApiV1AddWalletParams,
  BitGoApiV1BitGo,
  BitGoApiV1Callback,
  BitGoApiV1CreateForwardWalletParams,
  BitGoApiV1CreateWalletWithKeychainsParams,
  BitGoApiV1GetWalletParams,
  BitGoApiV1Keychains,
  BitGoApiV1ListWalletsParams,
  BitGoApiV1RemoveWalletParams,
  BitGoApiV1Wallet,
  BitGoApiV1WalletInviteParams,
  BitGoApiV1WalletShareParams,
  BitGoApiV1Wallets,
} from './v1Wallets';

export interface BitGoBase {
  /**
   * Deprecated **v1** wallets accessor (`bitgo.wallets()` → {@link BitGoApiV1Wallets}).
   *
   * Do **not** confuse with v2 coin wallets: `bitgo.coin(name).wallets()` → {@link IWallets}.
   *
   * @deprecated Prefer `coin(coinName).wallets()`.
   */
  wallets(): BitGoApiV1Wallets;
  coin(coinName: string): IBaseCoin; // need to change it to BaseCoin once it's moved to @bitgo/sdk-core
  decrypt(params: DecryptOptions): Promise<string>;
  decryptKeys(params: DecryptKeysOptions): Promise<string[]>;
  del(url: string): BitGoRequest;
  encrypt(params: EncryptOptions): Promise<string>;
  createEncryptionSession(password: string): Promise<IEncryptionSession>;
  readonly env: EnvironmentName;
  fetchConstants(): Promise<any>;
  get(url: string): BitGoRequest;
  getECDHKeychain(ecdhKeychainPub?: string): Promise<any>;
  getEcdhKeypairPrivate(password: string, entId?: string): Promise<EcdhDerivedKeypair>;
  getEnv(): EnvironmentName;
  getSharingKey({ email }: GetSharingKeyOptions): Promise<any>;
  getSigningKeyForUser(enterpriseId: string, userId?: string): Promise<GetSigningKeyApi>;
  microservicesUrl(path: string): string;
  post(url: string): BitGoRequest;
  put(url: string): BitGoRequest;
  patch(url: string): BitGoRequest;
  options(url: string): BitGoRequest;
  setRequestTracer(reqTracer: IRequestTracer): void;
  url(path: string, version?: number): string;
  register(name: string, coin: CoinConstructor): void;
}
