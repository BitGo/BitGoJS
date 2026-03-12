/**
 * Browser-native HMAC auth strategy using the Web Crypto API.
 *
 * This file has ZERO Node.js imports (no `crypto`, `url`, or `Buffer`).
 * All browser API usage (crypto.subtle, indexedDB) is inside method bodies,
 * so the module can be safely imported in any environment -- it only requires
 * browser globals when methods are actually called.
 */
import type {
  AuthVersion,
  CryptoSigning,
  IHmacAuthStrategy,
  ITokenStore,
  CalculateRequestHeadersOptions,
  RequestHeaders,
  VerifyResponseOptions,
  VerifyResponseInfo,
} from './types';

function arrayBufToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const hexParts: string[] = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    hexParts[i] = bytes[i].toString(16).padStart(2, '0');
  }
  return hexParts.join('');
}

/**
 * Extract the pathname + search from a URL string, using the browser-native URL API.
 * Equivalent to what `url.parse(urlPath)` does in Node.js for HMAC subject construction.
 */
function extractQueryPath(urlPath: string): string {
  try {
    const url = new URL(urlPath);
    return url.search.length > 0 ? url.pathname + url.search : url.pathname;
  } catch {
    try {
      const url = new URL(urlPath, 'http://localhost');
      return url.search.length > 0 ? url.pathname + url.search : url.pathname;
    } catch {
      return urlPath;
    }
  }
}

/**
 * Build the HMAC subject string for v2/v3 request or response signing.
 * Browser-compatible equivalent of `calculateHMACSubject` from hmac.ts,
 * producing identical output for string inputs.
 */
function buildHmacSubject(params: {
  urlPath: string;
  text: string;
  timestamp: number;
  method: string;
  statusCode?: number;
  authVersion: AuthVersion;
}): string {
  let method = params.method;
  if (method === 'del') {
    method = 'delete';
  }

  const queryPath = extractQueryPath(params.urlPath);

  let prefixedText: string;
  if (params.statusCode !== undefined && Number.isFinite(params.statusCode) && Number.isInteger(params.statusCode)) {
    prefixedText =
      params.authVersion === 3
        ? [method.toUpperCase(), params.timestamp, queryPath, params.statusCode].join('|')
        : [params.timestamp, queryPath, params.statusCode].join('|');
  } else {
    prefixedText =
      params.authVersion === 3
        ? [method.toUpperCase(), params.timestamp, '3.0', queryPath].join('|')
        : [params.timestamp, queryPath].join('|');
  }

  return [prefixedText, params.text].join('|');
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
// IndexedDB Token Store
// ---------------------------------------------------------------------------

const CRYPTO_DB_NAME = 'bitgo-auth';
const CRYPTO_STORE_NAME = 'crypto-signing';
const CRYPTO_RECORD_KEY = 'current';

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openCryptoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CRYPTO_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CRYPTO_STORE_NAME)) {
        db.createObjectStore(CRYPTO_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function persistCryptoSigning(signing: CryptoSigning): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openCryptoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CRYPTO_STORE_NAME, 'readwrite');
      tx.objectStore(CRYPTO_STORE_NAME).put(signing, CRYPTO_RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function loadCryptoSigning(): Promise<CryptoSigning | null> {
  if (!hasIndexedDB()) return null;
  const db = await openCryptoDb();
  try {
    return await new Promise<CryptoSigning | null>((resolve, reject) => {
      const tx = db.transaction(CRYPTO_STORE_NAME, 'readonly');
      const request = tx.objectStore(CRYPTO_STORE_NAME).get(CRYPTO_RECORD_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function removeCryptoSigning(): Promise<void> {
  if (!hasIndexedDB()) return;
  const db = await openCryptoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CRYPTO_STORE_NAME, 'readwrite');
      tx.objectStore(CRYPTO_STORE_NAME).delete(CRYPTO_RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Persists {@link CryptoSigning} material in the browser's IndexedDB.
 * The raw bearer token is never stored — only the non-extractable CryptoKey
 * and the SHA-256 token hash are persisted via the structured clone algorithm.
 */
export class IndexedDbTokenStore implements ITokenStore {
  async save(signing: CryptoSigning): Promise<void> {
    await persistCryptoSigning(signing);
  }

  async load(): Promise<CryptoSigning | null> {
    return loadCryptoSigning();
  }

  async remove(): Promise<void> {
    await removeCryptoSigning();
  }
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

  async calculateRequestHeaders(params: CalculateRequestHeadersOptions): Promise<RequestHeaders> {
    if (!this.cryptoKey || !this.tokenHashHex) {
      throw new Error('No token available. Call setToken() or restoreToken() first.');
    }
    const timestamp = Date.now();
    const subject = buildHmacSubject({
      urlPath: params.url,
      text: params.text as string,
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
    const subject = buildHmacSubject({
      urlPath: params.url,
      text: params.text as string,
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
      token: '',
      method: params.method as CalculateRequestHeadersOptions['method'],
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
