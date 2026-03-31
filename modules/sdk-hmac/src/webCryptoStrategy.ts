/**
 * Browser-native HMAC auth strategy using the Web Crypto API.
 *
 * All browser API usage (crypto.subtle) is inside method bodies,
 * so the module can be safely imported in any environment -- it only requires
 * browser globals when methods are actually called.
 */
import type {
  AuthVersion,
  IHmacAuthStrategy,
  ITokenStore,
  CalculateRequestHeadersWebCryptoOptions,
  RequestHeaders,
  VerifyResponseOptions,
  VerifyResponseInfo,
} from './types';
import { calculateHMACSubject } from './hmac';
import { IndexedDbTokenStore } from './indexedDbTokenStore';

function arrayBufToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const hexParts: string[] = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    hexParts[i] = bytes[i].toString(16).padStart(2, '0');
  }
  return hexParts.join('');
}

async function webCryptoHmacSign(key: CryptoKey, data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const sig = await crypto.subtle.sign('HMAC', key, encoded);
  return arrayBufToHex(sig);
}

async function webCryptoImportHmacKey(rawKey: string): Promise<CryptoKey> {
  const encoded = new TextEncoder().encode(rawKey);
  return crypto.subtle.importKey('raw', encoded, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 * Browser-compatible polyfill for Node's `crypto.timingSafeEqual`.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

async function webCryptoSha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return arrayBufToHex(hash);
}

// ---------------------------------------------------------------------------
// WebCrypto HMAC Strategy
// ---------------------------------------------------------------------------

export interface WebCryptoHmacStrategyOptions {
  tokenStore?: ITokenStore;
  authVersion?: AuthVersion;
}

/**
 * HMAC auth strategy using the browser's Web Crypto API (crypto.subtle).
 *
 * Usable both as an `IHmacAuthStrategy` for BitGoAPI and as a standalone
 * utility for signing/verifying requests made with the browser `fetch()` API.
 *
 * Token lifecycle:
 *  - Call `setToken(rawToken)` after authentication to import the token as a
 *    non-extractable CryptoKey and persist it to the configured ITokenStore.
 *  - Call `restoreToken()` on page load to recover a previously stored token.
 *  - Call `clearToken()` on logout.
 */
export class WebCryptoHmacStrategy implements IHmacAuthStrategy {
  private cryptoKey: CryptoKey | null = null;
  private tokenHashHex: string | null = null;
  private tokenStore: ITokenStore;
  private authVersion: AuthVersion;

  constructor(options?: WebCryptoHmacStrategyOptions) {
    this.tokenStore = options?.tokenStore ?? new IndexedDbTokenStore();
    this.authVersion = options?.authVersion ?? 2;
  }

  // --- Token lifecycle ---------------------------------------------------

  /**
   * Import a raw bearer token: derives a non-extractable CryptoKey for HMAC
   * signing, computes the SHA-256 token hash, and persists the
   * {@link CryptoSigning} material (NOT the raw token) to the token store.
   */
  async setToken(rawToken: string): Promise<void> {
    this.cryptoKey = await webCryptoImportHmacKey(rawToken);
    this.tokenHashHex = await webCryptoSha256Hex(rawToken);
    await this.tokenStore.save({ cryptoKey: this.cryptoKey, tokenHash: this.tokenHashHex });
  }

  async clearToken(): Promise<void> {
    this.cryptoKey = null;
    this.tokenHashHex = null;
    await this.tokenStore.remove();
  }

  /**
   * Attempt to restore signing material from the token store (e.g. IndexedDB).
   * The stored {@link CryptoSigning} already contains the non-extractable
   * CryptoKey and token hash — no raw token is involved.
   * Returns true if signing material was successfully restored.
   */
  async restoreToken(): Promise<boolean> {
    const signing = await this.tokenStore.load();
    if (signing) {
      this.cryptoKey = signing.cryptoKey;
      this.tokenHashHex = signing.tokenHash;
      return true;
    }
    return false;
  }

  hasToken(): boolean {
    return this.cryptoKey !== null && this.tokenHashHex !== null;
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  // --- IHmacAuthStrategy implementation -----------------------------------

  async calculateRequestHeaders(params: CalculateRequestHeadersWebCryptoOptions): Promise<RequestHeaders> {
    if (!this.cryptoKey || !this.tokenHashHex) {
      throw new Error('No token available. Call setToken() or restoreToken() first.');
    }
    const timestamp = Date.now();
    const subject = calculateHMACSubject({
      urlPath: params.url,
      text: params.text,
      timestamp,
      method: params.method,
      authVersion: params.authVersion,
    });
    const hmac = await webCryptoHmacSign(this.cryptoKey, subject);
    return { hmac, timestamp, tokenHash: this.tokenHashHex };
  }

  async verifyResponse(params: VerifyResponseOptions): Promise<VerifyResponseInfo> {
    if (!this.cryptoKey) {
      throw new Error('No token available. Call setToken() or restoreToken() first.');
    }
    const subject = calculateHMACSubject({
      urlPath: params.url,
      text: params.text,
      timestamp: params.timestamp,
      method: params.method,
      statusCode: params.statusCode,
      authVersion: params.authVersion,
    });

    const expectedHmac = await webCryptoHmacSign(this.cryptoKey, subject);

    const now = Date.now();
    const backwardValidityWindow = 1000 * 60 * 5;
    const forwardValidityWindow = 1000 * 60;
    const isInResponseValidityWindow =
      params.timestamp >= now - backwardValidityWindow && params.timestamp <= now + forwardValidityWindow;

    return {
      isValid: timingSafeStringEqual(expectedHmac, params.hmac),
      expectedHmac,
      signatureSubject: subject as VerifyResponseInfo['signatureSubject'],
      isInResponseValidityWindow,
      verificationTime: now,
    };
  }

  async calculateHMAC(key: string, message: string): Promise<string> {
    const cryptoKey = await webCryptoImportHmacKey(key);
    return webCryptoHmacSign(cryptoKey, message);
  }

  // --- Convenience methods for standalone fetch() usage -------------------

  /**
   * Returns a flat headers dict ready to spread into a `fetch()` init object.
   *
   * Example:
   * ```
   * const headers = await strategy.getAuthHeaders({ url, method: 'GET' });
   * const response = await fetch(url, { headers });
   * ```
   */
  async getAuthHeaders(params: { url: string; method: string; body?: string }): Promise<Record<string, string>> {
    const requestHeaders = await this.calculateRequestHeaders({
      url: params.url,
      method: params.method as CalculateRequestHeadersWebCryptoOptions['method'],
      text: params.body ?? '',
      authVersion: this.authVersion,
    });
    return {
      'Auth-Timestamp': requestHeaders.timestamp.toString(),
      Authorization: 'Bearer ' + requestHeaders.tokenHash,
      HMAC: requestHeaders.hmac,
      'BitGo-Auth-Version': this.authVersion === 3 ? '3.0' : '2.0',
    };
  }

  /**
   * Verify a browser Fetch `Response` object's HMAC.
   *
   * Clones the response to read the body text without consuming it.
   */
  async verifyFetchResponse(params: { url: string; method: string; response: Response }): Promise<VerifyResponseInfo> {
    const cloned = params.response.clone();
    const text = await cloned.text();
    return this.verifyResponse({
      url: params.url,
      token: '',
      method: params.method as VerifyResponseOptions['method'],
      text,
      hmac: params.response.headers.get('hmac') ?? '',
      statusCode: params.response.status,
      timestamp: parseInt(params.response.headers.get('timestamp') ?? '0', 10),
      authVersion: this.authVersion,
    });
  }
}
