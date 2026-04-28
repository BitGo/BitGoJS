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
  encrypt(plaintext: string): Promise<string>;
  decrypt(ciphertext: string): Promise<string>;
  destroy(): void;
}

export interface EncryptOptions {
  input: string;
  password?: string;
  /** Additional authenticated data. Only used with v1 (SJCL) encryption. Ignored when encryptionVersion is 2. */
  adata?: string;
  encryptionVersion?: EncryptionVersion;
}

export interface GetSharingKeyOptions {
  email: string;
}

export interface IRequestTracer {
  inc(): void;
  toString(): string;
}
