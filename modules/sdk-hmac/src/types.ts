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

export type CalculateRequestHeadersWebCryptoOptions<T extends string | Buffer = string> = Omit<
  CalculateRequestHeadersOptions<T>,
  'token'
>;

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

/**
 * Strategy interface for pluggable HMAC authentication.
 *
 * Implementations handle request signing, response verification, and general HMAC
 * computation. All methods are async to support browser WebCrypto (crypto.subtle).
 *
 * The `token` field in params is provided for implementations that use it directly
 * (e.g. DefaultHmacAuthStrategy). Implementations that manage their own key material
 * (e.g. WebCryptoHmacStrategy with a CryptoKey) may ignore it.
 */
export interface IHmacAuthStrategy {
  calculateRequestHeaders(params: CalculateRequestHeadersOptions): Promise<RequestHeaders>;

  verifyResponse(params: VerifyResponseOptions): Promise<VerifyResponseInfo>;

  calculateHMAC(key: string, message: string): Promise<string>;

  /**
   * Optional. Returns true if the strategy has its own signing material
   * (e.g. a CryptoKey restored from IndexedDB) and can sign requests
   * independently of BitGoAPI._token.
   *
   * When this returns true, BitGoAPI.requestPatch will delegate signing
   * to the strategy even if no raw token string is available.
   */
  isAuthenticated?(): boolean;

  /**
   * Optional token initialization & destruction methods.
   *
   * Strategies that read the token directly from request params
   * (e.g. DefaultHmacAuthStrategy) may leave this unimplemented.
   *
   * Must be awaited — implementations may perform async key derivation.
   */
  setToken?(token: string): Promise<void>;
  clearToken?(): Promise<void>;
}

/**
 * Opaque signing material derived from a bearer token.
 * Stored in IndexedDB (CryptoKey is preserved via structured clone).
 * The raw token is never persisted — only the non-extractable key and the hash.
 */
export type CryptoSigning = {
  cryptoKey: CryptoKey;
  tokenHash: string;
};

/**
 * Pluggable persistence interface for {@link CryptoSigning} material.
 * Allows different storage backends (IndexedDB, in-memory for tests) for
 * persisting signing keys across page refreshes or app restarts.
 */
export interface ITokenStore {
  save(signing: CryptoSigning): Promise<void>;
  load(): Promise<CryptoSigning | null>;
  remove(): Promise<void>;
}
