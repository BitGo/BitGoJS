import { randomBytes } from 'crypto';

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

  async encrypt(plaintext: string): Promise<string> {
    const key = this.getKeyOrThrow();
    const hkdfSalt = new Uint8Array(randomBytes(HKDF_SALT_LENGTH));
    const iv = new Uint8Array(randomBytes(GCM_IV_LENGTH));
    const aesKey = await hkdfDeriveAesKey(key, hkdfSalt, 'encrypt');
    const ct = await aesGcmEncrypt(aesKey, iv, plaintext);
    return JSON.stringify(this.buildEnvelope(hkdfSalt, iv, ct));
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
    const aesKey = await hkdfDeriveAesKey(key, hkdfSalt, 'decrypt');
    return aesGcmDecrypt(aesKey, iv, ct);
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

/** Create an EncryptionSession. Runs Argon2id once; all subsequent calls derive keys via HKDF. */
export async function createEncryptionSession(
  password: string,
  options?: { memorySize?: number; iterations?: number; parallelism?: number; salt?: Uint8Array }
): Promise<EncryptionSession> {
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
