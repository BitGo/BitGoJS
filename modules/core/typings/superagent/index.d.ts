import * as superagent from 'superagent';
import * as Bluebird from 'bluebird';

declare module 'superagent' {
  interface Request {
    result: (optionalField?: string) => Bluebird<any>;
    proxy: (proxyUrl: string) => this;
    // can't redefine return type of end() ...  makes sense
    // end: (callback?: NodeCallback<superagent.Response>) => Bluebird<superagent.Response>;
    verifyResponse: (response: superagent.Response) => superagent.Response;
    forceV1Auth: boolean;
    authenticationToken?: string;
    isV2Authenticated?: boolean;
  }
}
