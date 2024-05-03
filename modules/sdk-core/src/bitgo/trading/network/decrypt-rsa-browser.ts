import crypto from 'crypto';
import { str2ab } from './utils';

/**
 * Import a private RSA key and decrypt a ciphertext
 * @param {string} privateKey PEM-formatted private RSA key
 * @param {string} text The text to decrypt
 * @returns {string} The decrypted text
 */
export async function _decryptBrowserRsa(privateKey: string, text: string): Promise<string> {
  const priv = await importPrivateKey(privateKey);
  return decryptRSA(priv, str2ab(atob(text)));
}

/**
 * Import a private RSA key from a PEM string
 * @param {string} pkcs8Pem The private key in PEM format
 * @returns {CryptoKey} The imported private key
 */
async function importPrivateKey(pkcs8Pem) {
  return await crypto.subtle.importKey(
    'pkcs8',
    getPkcs8Der(pkcs8Pem),
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

/**
 * Decrypt a ciphertext using RSA-OAEP
 * @param {CryptoKey} key The private key to use for decryption
 * @param {ArrayBuffer} ciphertext The ciphertext to decrypt
 * @returns {string} The decrypted text
 */
async function decryptRSA(key, ciphertext) {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Convert a PEM-formatted PKCS#8 key to a DER-formatted ArrayBuffer
 * @param {string} pkcs8Pem PEM-formatted PKCS#8 key
 * @returns {ArrayBuffer} DER-formatted private key
 */
function getPkcs8Der(pkcs8Pem) {
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = pkcs8Pem.substring(pemHeader.length, pkcs8Pem.length - pemFooter.length);
  const binaryDerString = atob(pemContents);
  return str2ab(binaryDerString);
}
