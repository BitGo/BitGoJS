import 'superagent';

declare module 'superagent' {
  interface Request<ResultType = any> {
    result: (optionalField?: string) => Promise<ResultType>;
    proxy: (proxyUrl: string) => this;
    forceV1Auth: boolean;
    authenticationToken?: string;
    isV2Authenticated?: boolean;
  }
}
