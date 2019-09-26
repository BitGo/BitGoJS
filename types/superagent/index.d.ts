import * as superagent from 'superagent';
import * as bluebird from 'bluebird';

declare module 'superagent' {
  interface Request {
    result: (optionalField?: string) => bluebird<any>;
    proxy: (proxyUrl: string) => this;
    verifyResponse: (response: superagent.Response) => superagent.Response;
    forceV1Auth: boolean;
    authenticationToken?: string;
    isV2Authenticated?: boolean;
  }
}
