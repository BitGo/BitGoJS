export const supportedRequestMethods = ['get', 'post', 'put', 'del', 'patch', 'options', 'delete'] as const;

export type AuthVersion = 2 | 3;

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

export interface CalculateV4PreimageOptions {
  timestampSec: number;
  method: string;
  pathWithQuery: string;
  bodyHashHex: string;
  authRequestId: string;
}

export interface CalculateV4RequestHmacOptions extends CalculateV4PreimageOptions {
  rawToken: string;
}

import type { HashableData } from './util';

export interface CalculateV4RequestHeadersOptions {
  method: string;
  pathWithQuery: string;
  rawBody: HashableData;
  rawToken: string;
  authRequestId: string;
}

/**
 * Headers generated for V4 authenticated requests.
 */
export interface V4RequestHeaders {
  hmac: string;
  timestampSec: number;
  bodyHashHex: string;
  authRequestId: string;
}

/**
 * Options for verifying V4 response HMAC.
 */
export interface VerifyV4ResponseOptions {
  hmac: string;
  timestampSec: number;
  method: string;
  pathWithQuery: string;
  bodyHashHex: string;
  authRequestId: string;
  statusCode: number;
  rawToken: string;
}

/**
 * Result of V4 response HMAC verification.
 */
export interface VerifyV4ResponseInfo {
  isValid: boolean;
  expectedHmac: string;
  preimage: string;
  isInResponseValidityWindow: boolean;
  verificationTime: number;
}
