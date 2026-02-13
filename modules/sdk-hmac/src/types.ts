export const supportedRequestMethods = ['get', 'post', 'put', 'del', 'patch', 'options', 'delete'] as const;

export type AuthVersion = 2 | 3 | 4;

export interface CalculateHmacSubjectOptions<T> {
  urlPath: string;
  text: T;
  timestamp: number;
  method: (typeof supportedRequestMethods)[number];
  statusCode?: number;
  authVersion: AuthVersion;
}

export interface CalculateRequestHmacOptions<T extends string | Buffer = string> {
  url: string;
  text: T;
  timestamp: number;
  token: string;
  method: (typeof supportedRequestMethods)[number];
  authVersion: AuthVersion;
}

export interface CalculateRequestHeadersOptions<T extends string | Buffer = string> {
  url: string;
  text: T;
  token: string;
  method: (typeof supportedRequestMethods)[number];
  authVersion: AuthVersion;
}

export interface RequestHeaders {
  hmac: string;
  timestamp: number;
  tokenHash: string;
}

export interface VerifyResponseOptions<T extends string | Buffer = string> extends CalculateRequestHeadersOptions<T> {
  hmac: string;
  url: string;
  text: T;
  timestamp: number;
  method: (typeof supportedRequestMethods)[number];
  statusCode?: number;
  authVersion: AuthVersion;
}

export interface VerifyResponseInfo<T extends string | Buffer = string> {
  isValid: boolean;
  expectedHmac: string;
  signatureSubject: T;
  isInResponseValidityWindow: boolean;
  verificationTime: number;
}
