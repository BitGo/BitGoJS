export const supportedRequestMethods = ['get', 'post', 'put', 'del', 'patch', 'options'] as const;

export type AuthVersion = 2 | 3;

export interface CalculateHmacSubjectOptions {
  urlPath: string;
  text: string;
  timestamp: number;
  method: (typeof supportedRequestMethods)[number];
  statusCode?: number;
  authVersion: AuthVersion;
}

export interface CalculateRequestHmacOptions {
  url: string;
  text: string;
  timestamp: number;
  token: string;
  method: (typeof supportedRequestMethods)[number];
  authVersion: AuthVersion;
}

export interface CalculateRequestHeadersOptions {
  url: string;
  text: string;
  token: string;
  method: (typeof supportedRequestMethods)[number];
  authVersion: AuthVersion;
}

export interface RequestHeaders {
  hmac: string;
  timestamp: number;
  tokenHash: string;
}

export interface VerifyResponseOptions extends CalculateRequestHeadersOptions {
  hmac: string;
  url: string;
  text: string;
  timestamp: number;
  method: (typeof supportedRequestMethods)[number];
  statusCode?: number;
  authVersion: AuthVersion;
}

export interface VerifyResponseInfo {
  isValid: boolean;
  expectedHmac: string;
  signatureSubject: string;
  isInResponseValidityWindow: boolean;
  verificationTime: number;
}
