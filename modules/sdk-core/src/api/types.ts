import * as superagent from 'superagent';

export interface BitGoRequest<ResultType = any> extends superagent.SuperAgentRequest {
  result: (optionalField?: string) => Promise<ResultType>;
}

export interface DecryptOptions {
  input: string;
  password?: string;
}

export interface DecryptKeysOptions {
  walletIdEncryptedKeyPairs: Array<{
    walletId: string;
    encryptedPrv: string;
  }>;
  password: string;
}

export type EncryptionVersion = 1 | 2;

/**
 * Return type for encryption session operations.
 * Runs the expensive KDF once; all subsequent calls derive keys via HKDF.
 */
export interface IEncryptionSession {
  encrypt(plaintext: string, adata?: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
  destroy(): void;
}

export interface EncryptOptions {
  input: string;
  password?: string;
  /** Additional authenticated data for context binding. Used as CCM adata (v1) or GCM AAD (v2). */
  adata?: string;
  encryptionVersion?: EncryptionVersion;
}

/** Sync encrypt callback — used by v1 (SJCL) code paths. */
export type EncryptFn = (params: { input: string; password: string }) => string;
/** Async encrypt callback — used by v2 (Argon2id) code paths. */
export type EncryptFnAsync = (params: { input: string; password: string }) => Promise<string>;

export interface GetSharingKeyOptions {
  email: string;
}

export interface IRequestTracer {
  inc(): void;
  toString(): string;
}
