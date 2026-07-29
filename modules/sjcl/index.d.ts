export = sjcl;
export as namespace sjcl;

declare namespace sjcl {
  export var bitArray: BitArrayStatic;
  export var codec: SjclCodecs;
  export var hash: SjclHashes;
  export var exception: SjclExceptions;
  export var cipher: SjclCiphers;
  export var mode: SjclModes;
  export var misc: SjclMisc;
  export var random: SjclRandom;
  export var prng: SjclRandomStatic;
  export var keyexchange: Record<string, unknown>;
  export var json: SjclJson;
  export var encrypt: SjclConvenienceEncryptor;
  export var decrypt: SjclConvenienceDecryptor;

  // ________________________________________________________________________

  interface BitArray extends Array<number> {}

  interface BitArrayStatic {
    /** Array slices in units of bits. */
    bitSlice(a: BitArray, bstart: number, bend: number): BitArray;

    /** Extract a number packed into a bit array. */
    extract(a: BitArray, bstart: number, blength: number): number;

    /** Concatenate two bit arrays. */
    concat(a1: BitArray, a2: BitArray): BitArray;

    /** Find the length of an array of bits. */
    bitLength(a: BitArray): number;

    /** Truncate an array. */
    clamp(a: BitArray, len: number): BitArray;

    /** Make a partial word for a bit array. */
    partial(len: number, x: number, _end?: number): number;

    /** Get the number of bits used by a partial word. */
    getPartial(x: number): number;

    /** Compare two arrays for equality in a predictable amount of time. */
    equal(a: BitArray, b: BitArray): boolean;
  }

  // ________________________________________________________________________

  interface SjclCodec<T> {
    fromBits(bits: BitArray): T;
    toBits(value: T): BitArray;
  }

  interface SjclCodecs {
    utf8String: SjclCodec<string>;
    hex: SjclCodec<string>;
    bytes: SjclCodec<number[]>;
    base64: SjclCodec<string>;
    base64url: SjclCodec<string>;
  }

  // ________________________________________________________________________

  interface SjclHash {
    blockSize: number;
    reset(): SjclHash;
    update(data: BitArray | string): SjclHash;
    finalize(): BitArray;
  }

  interface SjclHashStatic {
    new (hash?: SjclHash): SjclHash;
    hash(data: BitArray | string): BitArray;
  }

  interface SjclHashes {
    sha1: SjclHashStatic;
    sha256: SjclHashStatic;
    sha512: SjclHashStatic;
  }

  // ________________________________________________________________________

  interface SjclExceptions {
    corrupt: SjclExceptionFactory;
    invalid: SjclExceptionFactory;
    bug: SjclExceptionFactory;
    notReady: SjclExceptionFactory;
  }

  interface SjclExceptionFactory {
    new (message: string): Error;
  }

  // ________________________________________________________________________

  interface SjclCiphers {
    aes: SjclCipherStatic;
  }

  interface SjclCipher {
    encrypt(data: number[]): number[];
    decrypt(data: number[]): number[];
  }

  interface SjclCipherStatic {
    new (key: number[]): SjclCipher;
  }

  // ________________________________________________________________________

  interface SjclModes {
    gcm: SjclGCMMode;
    ccm: SjclCCMMode;
    ocb2: SjclOCB2Mode;
  }

  interface SjclGCMMode {
    encrypt(prf: SjclCipher, plaintext: BitArray, iv: BitArray, adata?: BitArray, tlen?: number): BitArray;
    decrypt(prf: SjclCipher, ciphertext: BitArray, iv: BitArray, adata?: BitArray, tlen?: number): BitArray;
  }

  interface SjclCCMMode {
    encrypt(prf: SjclCipher, plaintext: BitArray, iv: BitArray, adata?: BitArray, tlen?: number): BitArray;
    decrypt(prf: SjclCipher, ciphertext: BitArray, iv: BitArray, adata?: BitArray, tlen?: number): BitArray;
  }

  interface SjclOCB2Mode {
    encrypt(
      prf: SjclCipher,
      plaintext: BitArray,
      iv: BitArray,
      adata?: BitArray,
      tlen?: number,
      premac?: boolean
    ): BitArray;
    decrypt(
      prf: SjclCipher,
      ciphertext: BitArray,
      iv: BitArray,
      adata?: BitArray,
      tlen?: number,
      premac?: boolean
    ): BitArray;
    pmac(prf: SjclCipher, adata: BitArray): number[];
  }

  // ________________________________________________________________________

  interface PBKDF2Params {
    iter?: number | undefined;
    salt?: BitArray | undefined;
  }

  interface SjclMisc {
    pbkdf2(
      password: BitArray | string,
      salt: BitArray | string,
      count?: number,
      length?: number,
      Prff?: SjclPRFFamilyStatic
    ): BitArray;
    hmac: SjclHMACStatic;
    cachedPbkdf2(
      password: string,
      obj?: PBKDF2Params
    ): {
      key: BitArray;
      salt: BitArray;
    };
  }

  class SjclPRFFamily {
    encrypt(data: BitArray | string): BitArray;
  }

  interface SjclHMAC extends SjclPRFFamily {
    mac(data: BitArray | string): BitArray;
    reset(): void;
    update(data: BitArray | string): void;
    digest(): BitArray;
  }

  interface SjclPRFFamilyStatic {
    new (key: BitArray): SjclPRFFamily;
  }

  interface SjclHMACStatic {
    new (key: BitArray, Hash?: SjclHashStatic): SjclHMAC;
  }

  // ________________________________________________________________________

  interface SjclRandom {
    randomWords(nwords: number, paranoia?: number): BitArray;
    setDefaultParanoia(paranoia: number, allowZeroParanoia: string): void;
    addEntropy(data: number | number[] | string, estimatedEntropy: number, source: string): void;
    isReady(paranoia?: number): number;
    getProgress(paranoia?: number): number;
    startCollectors(): void;
    stopCollectors(): void;
    addEventListener(name: string, cb: () => void): void;
    removeEventListener(name: string, cb: () => void): void;
  }

  interface SjclRandomStatic {
    new (defaultParanoia: number): SjclRandom;
  }

  // ________________________________________________________________________

  interface SjclCipherParams {
    v?: number | undefined;
    iter?: number | undefined;
    ks?: number | undefined;
    ts?: number | undefined;
    mode?: string | undefined;
    adata?: string | undefined;
    cipher?: string | undefined;
  }

  interface SjclCipherEncryptParams extends SjclCipherParams {
    salt: BitArray;
    iv: BitArray;
  }

  interface SjclCipherDecryptParams extends SjclCipherParams {
    salt?: BitArray | undefined;
    iv?: BitArray | undefined;
  }

  interface SjclCipherEncrypted extends SjclCipherEncryptParams {
    kemtag?: BitArray | undefined;
    ct: BitArray;
  }

  interface SjclCipherDecrypted extends SjclCipherEncrypted {
    key: BitArray;
  }

  interface SjclConvenienceEncryptor {
    (
      password: BitArray | string | undefined,
      plaintext: string | undefined,
      params?: SjclCipherEncryptParams,
      rp?: SjclCipherEncrypted
    ): string;
  }

  interface SjclConvenienceDecryptor {
    (
      password: BitArray | string | undefined,
      ciphertext: SjclCipherEncrypted | string | undefined,
      params?: SjclCipherDecryptParams,
      rp?: SjclCipherDecrypted
    ): string;
  }

  interface SjclJson {
    defaults: Required<SjclCipherParams>;
    encrypt: SjclConvenienceEncryptor;
    decrypt: SjclConvenienceDecryptor;
    encode(obj: object): string;
    decode(obj: string): object;
  }
}
