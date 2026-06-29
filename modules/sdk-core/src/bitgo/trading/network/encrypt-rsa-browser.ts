import crypto from 'crypto';
import { ab2str, str2ab } from './utils';

/**
 * Import a public RSA key and encrypt a plaintext
 * @param {string} publicKey PEM-formatted public RSA key
 * @param {string} text The text to encrypt
 * @returns {string} The encrypted text
 */
export async function _encryptBrowserRsa(publicKey: string, text: string): Promise<string> {
  const pub = await importPublicKey(publicKey);
  const encrypted = await encryptRSA(pub, new TextEncoder().encode(text));
  return btoa(ab2str(encrypted));
}

/**
 * Import a public RSA key from a PEM string
 * @param {string} spkiPem
 * @returns {CryptoKey}
 */
async function importPublicKey(spkiPem: string) {
  // Pull from window.crypto when running in the browser.
  // This is due to libraries like crypto-browserify overriding "crypto" while not supporting various crypto functions.
  let cryptoJS: any = crypto;
  if (typeof window !== 'undefined') {
    cryptoJS = window.crypto;
  }

  return await cryptoJS.subtle.importKey(
    'spki',
    getSpkiDer(spkiPem),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Encrypt a plaintext using RSA-OAEP
 * @param {CryptoKey} key The public key to use for encryption
 * @param {ArrayBuffer} plaintext The plaintext to encrypt
 * @returns {ArrayBuffer} The encrypted text
 */
async function encryptRSA(key: CryptoKey, plaintext: ArrayBuffer) {
  // Pull from window.crypto when running in the browser.
  // This is due to libraries like crypto-browserify overriding "crypto" while not supporting various crypto functions.
  let cryptoJS: any = crypto;
  if (typeof window !== 'undefined') {
    cryptoJS = window.crypto;
  }

  const encrypted = await cryptoJS.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    key,
    plaintext
  );
  return encrypted;
}

/**
 * Convert a PEM-formatted SPKI key to a DER-formatted ArrayBuffer
 * @param {string} spkiPem PEM-formatted SPKI key
 * @returns {ArrayBuffer} DER-formatted public key
 */
function getSpkiDer(spkiPem: string) {
  spkiPem = spkiPem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binaryDerString = atob(spkiPem);
  return str2ab(binaryDerString);
}
