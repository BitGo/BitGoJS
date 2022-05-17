import * as superagent from 'superagent';
import { EnvironmentName } from './environments';

export interface BitGoRequest<ResultType = any> extends superagent.SuperAgentRequest {
  result: (optionalField?: string) => Promise<ResultType>;
}

export interface DecryptOptions {
  input: string;
  password?: string;
}

export interface EncryptOptions {
  input: string;
  password?: string;
}

export interface GetSharingKeyOptions {
  email: string;
}

export interface IRequestTracer {
  inc(): void;
  toString(): string;
}

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
