import { BitGoRequest } from './types';
import debugLib from 'debug';
import superagent from 'superagent';

const debug = debugLib('bitgo:api');

if (!(process as any).browser) {
  debug('enabling superagent-proxy wrapper');
  require('superagent-proxy')(superagent);
}

export abstract class BitGoAPI {
  constructor() {}

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
