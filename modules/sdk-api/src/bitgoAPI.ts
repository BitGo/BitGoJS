import { BitGoRequest } from './types';
import debugLib from 'debug';
import * as superagent from 'superagent';
import { EnvironmentName } from '@bitgo/sdk-core';

const debug = debugLib('bitgo:api');

if (!(process as any).browser) {
  debug('enabling superagent-proxy wrapper');
  require('superagent-proxy')(superagent);
}

export abstract class BitGoAPI {
  public readonly env: EnvironmentName;
  protected readonly _baseUrl: string;
  protected readonly _baseApiUrl: string;
  protected readonly _baseApiUrlV2: string;
  protected readonly _env: EnvironmentName;

  constructor(env: EnvironmentName | undefined) {
    this._env = this.env = env || 'test';
    this._baseUrl = '';
    this._baseApiUrl = '';
    this._baseApiUrlV2 = '';
  }

  get(url: string): BitGoRequest {
    return {} as any;
  }
  post(url: string): BitGoRequest {
    return {} as any;
  }
  put(url: string): BitGoRequest {
    return {} as any;
  }
  del(url: string): BitGoRequest {
    return {} as any;
  }
  patch(url: string): BitGoRequest {
    return {} as any;
  }
}
