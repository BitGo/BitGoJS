import {
  BitGoRequest,
  DecryptKeysOptions,
  DecryptOptions,
  EncryptOptions,
  GetSharingKeyOptions,
  IRequestTracer,
} from '../api';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { IBaseCoin } from './baseCoin';
import { CoinConstructor } from './coinFactory';
import { EnvironmentName } from './environments';
import { EcdhDerivedKeypair, GetSigningKeyApi } from './keychain';

export interface BitGoBase {
  wallets(): any; // TODO - define v1 wallets type
  coin(coinName: string): IBaseCoin; // need to change it to BaseCoin once it's moved to @bitgo/sdk-core
  decrypt(params: DecryptOptions): string;
  decryptAsync(params: DecryptOptions): Promise<string>;
  decryptKeys(params: DecryptKeysOptions): string[];
  del(url: string): BitGoRequest;
  encrypt(params: EncryptOptions): string;
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
  registerWithBaseCoin(coin: CoinConstructor, baseCoin: Readonly<StaticsBaseCoin>): void;
}
