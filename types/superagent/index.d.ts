import 'superagent';

declare module 'superagent' {
  interface Request {
    proxy: (proxyUrl: string) => this;
    forceV1Auth: boolean;
    authenticationToken?: string;
    isV2Authenticated?: boolean;
  }
}
