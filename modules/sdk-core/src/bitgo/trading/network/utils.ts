import crypto from 'crypto';

/**
 * str2ab - Convert a string to an ArrayBuffer
 * @param {string} str The string to convert
 * @returns {ArrayBuffer} The ArrayBuffer
 */
export function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * ab2str - Convert a buffer to a string
 * @param {ArrayBuffer} buf The buffer to convert
 * @returns {string} The string
 */
export function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
}

/**
 * computeKey - Compute a key from a password and salt
 * @param {string | Buffer} pass The password to use
 * @param {Buffer} salt The salt to use
 * @returns {Promise<Buffer>} The computed key
 */
export async function computeKey(pass: string | Buffer, salt: Buffer): Promise<Buffer> {
  let resolvePromise: (result: Buffer) => void;
  let rejectPromise: (reject: unknown) => void;

  const promise: Promise<Buffer> = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  crypto.pbkdf2(pass, salt, 200000, 32, 'sha256', (err, derivedKey) => {
    if (err !== null) {
      rejectPromise(err);
    } else {
      resolvePromise(derivedKey);
    }
  });

  return promise;
}
