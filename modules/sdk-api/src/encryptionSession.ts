import { randomBytes } from 'crypto';

import { decrypt, encrypt } from './encrypt';
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  ARGON2_DEFAULTS,
  argon2ToHkdfKey,
  GCM_IV_LENGTH,
  hkdfDeriveAesKey,
  HKDF_SALT_LENGTH,
  parseV2Envelope,
  V2Envelope,
} from './encryptV2';

/**
 * Runs Argon2id once on creation, then derives per-call AES-256-GCM keys via HKDF.
 * Use when encrypting or decrypting multiple values with the same password.
 *
 * Session envelopes are self-describing and can be decrypted standalone via decryptV2.
 * Call destroy() when done to clear the cached key from memory.
 */
export class EncryptionSession {
  private hkdfKey: CryptoKey | null;
  private argon2SaltB64: string | null;
  private readonly memorySize: number;
  private readonly iterations: number;
  private readonly parallelism: number;
  /** Use createEncryptionSession() instead of calling this directly. */
  constructor(
    hkdfKey: CryptoKey,
    argon2SaltB64: string,
    params: { memorySize: number; iterations: number; parallelism: number }
  ) {
    this.hkdfKey = hkdfKey;
    this.argon2SaltB64 = argon2SaltB64;
    this.memorySize = params.memorySize;
    this.iterations = params.iterations;
    this.parallelism = params.parallelism;
  }

  async encrypt(plaintext: string, adata?: string): Promise<string> {
    const key = this.getKeyOrThrow();
    const hkdfSalt = new Uint8Array(randomBytes(HKDF_SALT_LENGTH));
    const iv = new Uint8Array(randomBytes(GCM_IV_LENGTH));
    const adataBytes = adata ? new TextEncoder().encode(adata) : undefined;
    const aesKey = await hkdfDeriveAesKey(key, hkdfSalt, 'encrypt');
    const ct = await aesGcmEncrypt(aesKey, iv, plaintext, adataBytes);
    const envelope = this.buildEnvelope(hkdfSalt, iv, ct);
    if (adata) envelope.adata = adata;
    return JSON.stringify(envelope);
  }

  async decrypt(ciphertext: string): Promise<string> {
    const key = this.getKeyOrThrow();
    const envelope = parseV2Envelope(ciphertext);
    if (!envelope.hkdfSalt) {
      throw new Error('envelope was not encrypted with a session; use decryptV2 instead');
    }
    if (envelope.salt !== this.getSaltOrThrow()) {
      throw new Error('envelope was not encrypted with this session');
    }
    const iv = new Uint8Array(Buffer.from(envelope.iv, 'base64'));
    const ct = new Uint8Array(Buffer.from(envelope.ct, 'base64'));
    const hkdfSalt = new Uint8Array(Buffer.from(envelope.hkdfSalt, 'base64'));
    const adataBytes = envelope.adata ? new TextEncoder().encode(envelope.adata) : undefined;
    const aesKey = await hkdfDeriveAesKey(key, hkdfSalt, 'decrypt');
    return aesGcmDecrypt(aesKey, iv, ct, adataBytes);
  }

  destroy(): void {
    this.hkdfKey = null;
    this.argon2SaltB64 = null;
  }

  private getKeyOrThrow(): CryptoKey {
    if (this.hkdfKey === null || this.argon2SaltB64 === null) {
      throw new Error('EncryptionSession has been destroyed');
    }
    return this.hkdfKey;
  }

  private getSaltOrThrow(): string {
    if (this.argon2SaltB64 === null) {
      throw new Error('EncryptionSession has been destroyed');
    }
    return this.argon2SaltB64;
  }

  private buildEnvelope(hkdfSalt: Uint8Array, iv: Uint8Array, ct: Uint8Array): V2Envelope {
    return {
      v: 2,
      m: this.memorySize,
      t: this.iterations,
      p: this.parallelism,
      salt: this.getSaltOrThrow(),
      hkdfSalt: Buffer.from(hkdfSalt).toString('base64'),
      iv: Buffer.from(iv).toString('base64'),
      ct: Buffer.from(ct).toString('base64'),
    };
  }
}

/**
 * v1 (SJCL) shim that satisfies the same contract as EncryptionSession but does not open a
 * real session. Every encrypt/decrypt call runs its own SJCL PBKDF2 derivation via encrypt() /
 * decrypt(). Exists so callers that pin `encryptionVersion: 1` can use the same
 * `createEncryptionSession(pw, ver)` factory as v2 callers — no per-site useV2 branching.
 * Once the sjcl-replacement rollout removes v1 encrypt, this collapses to nothing.
 */
export class V1EncryptionSession {
  private password: string | null;

  constructor(password: string) {
    this.password = password;
  }

  async encrypt(input: string, adata?: string): Promise<string> {
    return encrypt(this.getPasswordOrThrow(), input, { adata, encryptionVersion: 1 });
  }

  async decrypt(ciphertext: string): Promise<string> {
    return decrypt(this.getPasswordOrThrow(), ciphertext);
  }

  destroy(): void {
    this.password = null;
  }

  private getPasswordOrThrow(): string {
    if (this.password === null) {
      throw new Error('V1EncryptionSession has been destroyed');
    }
    return this.password;
  }
}

/**
 * Create an EncryptionSession.
 *
 * When encryptionVersion is undefined or 2 (the default), runs Argon2id once so every
 * subsequent encrypt/decrypt derives a per-call AES key via HKDF (<1ms, native WebCrypto).
 *
 * When encryptionVersion is 1, returns a V1EncryptionSession shim that runs SJCL PBKDF2 on
 * every call. The shim satisfies the same interface so callers that must produce v1 (SJCL)
 * envelopes for legacy consumers use one factory regardless of version. No useV2 branching
 * needed at the call site.
 *
 * Callers MUST call destroy() to clear the HKDF root (or retained password in v1 mode) from
 * memory. Use-after-destroy throws.
 */
export async function createEncryptionSession(
  password: string,
  options?: {
    memorySize?: number;
    iterations?: number;
    parallelism?: number;
    salt?: Uint8Array;
    encryptionVersion?: 1 | 2;
  }
): Promise<EncryptionSession | V1EncryptionSession> {
  if (options?.encryptionVersion === 1) {
    return new V1EncryptionSession(password);
  }

  const memorySize = options?.memorySize ?? ARGON2_DEFAULTS.memorySize;
  const iterations = options?.iterations ?? ARGON2_DEFAULTS.iterations;
  const parallelism = options?.parallelism ?? ARGON2_DEFAULTS.parallelism;
  const params = { memorySize, iterations, parallelism };

  const argon2Salt = options?.salt ?? new Uint8Array(randomBytes(ARGON2_DEFAULTS.saltLength));
  if (argon2Salt.length !== ARGON2_DEFAULTS.saltLength) {
    throw new Error(`salt must be ${ARGON2_DEFAULTS.saltLength} bytes`);
  }

  const hkdfKey = await argon2ToHkdfKey(password, argon2Salt, params);
  const argon2SaltB64 = Buffer.from(argon2Salt).toString('base64');

  return new EncryptionSession(hkdfKey, argon2SaltB64, params);
}
