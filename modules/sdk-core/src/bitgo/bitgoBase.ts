import { BitGoRequest, DecryptOptions, EncryptOptions, GetSharingKeyOptions, IRequestTracer } from '../api';
import { EnvironmentName } from './environments';

export interface BitGoBase {
  coin(coinName: string): any; // need to change it to BaseCoin once it's moved to @bitgo/sdk-core
  decrypt(params: DecryptOptions): string;
  del(url: string): BitGoRequest;
  encrypt(params: EncryptOptions): string;
  readonly env: EnvironmentName;
  fetchConstants(): Promise<any>;
  get(url: string): BitGoRequest;
  getECDHSharingKeychain(): Promise<any>;
  getEnv(): EnvironmentName;
  getSharingKey({ email }: GetSharingKeyOptions): Promise<any>;
  microservicesUrl(path: string): string;
  post(url: string): BitGoRequest;
  put(url: string): BitGoRequest;
  setRequestTracer(reqTracer: IRequestTracer): void;
  url(path: string, version?: number): string;
}
