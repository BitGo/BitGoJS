import 'superagent';

declare module 'superagent' {
  interface Request {
    proxy: (proxyUrl: string) => this;
    forceV1Auth: boolean;
    authenticationToken?: string;
    isV2Authenticated?: boolean;
    /** v4 auth: the auth request ID (UUID) used in the request preimage */
    v4AuthRequestId?: string;
    /** v4 auth: the HTTP method used in the request preimage */
    v4Method?: string;
    /** v4 auth: the path with query string used in the request preimage */
    v4PathWithQuery?: string;
  }
}
