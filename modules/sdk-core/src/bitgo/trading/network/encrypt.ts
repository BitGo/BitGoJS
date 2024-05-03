import crypto from 'crypto';
import { _encryptAesGcm } from './encrypt-aes-gcm';
import { _encryptRsa } from './encrypt-rsa';
import { _encryptBrowserRsa } from './encrypt-rsa-browser';

/**
 * Provided an X.509/ OpenSSL PEM public key, and a string of text to encrypt,
 * This function will
 * 1. Generate a random 256-bit key
 * 2. Encrypt the text using AES-GCM with the generated key
 * 3. Encrypt the generated key using RSA-OAEP with the provided public key
 * 4. Return the encrypted key and the encrypted text in the format `${encryptedKey}\n${encryptedText}`
 *
 * @param {string} publicKey - RSA Public Key
 * @param {string} text - text to encrypt
 * @returns {string} The encrypted text
 *
 * @example
 * const publicKey = '-----BEGIN PUBLIC KEY-----\n.....\n-----END PUBLIC KEY-----';
 * const text = 'This text contains sensitive information';
 * const encrypted = await encryptRsaWithAesGcm(publicKey, text);
 */
export async function encryptRsaWithAesGcm(publicKey: string, text: string): Promise<string> {
  const gcmKey = crypto.randomBytes(32).toString('base64');

  const encrypted = await _encryptAesGcm(gcmKey, text);
  const encryptedRsa = await _encryptRsa(publicKey, Buffer.from(gcmKey).toString('base64'));

  return `${encryptedRsa}\n${encrypted}`;
}

/**
 * Provided an X.509/ OpenSSL PEM public key, and a string of text to encrypt,
 * This function will
 * 1. Generate a random 256-bit key
 * 2. Encrypt the text using AES-GCM with the generated key
 * 3. Encrypt the generated key using RSA-OAEP with the provided public key
 * 4. Return the encrypted key and the encrypted text in the format `${encryptedKey}\n${encryptedText}`
 *
 * @param {string} publicKey - RSA Public Key
 * @param {string} text - text to encrypt
 * @returns {string} The encrypted text
 *
 * @example
 * const publicKey = '-----BEGIN PUBLIC KEY-----\n.....\n-----END PUBLIC KEY-----';
 * const text = 'This text contains sensitive information';
 * const encrypted = await encryptBrowserRsaWithAesGcm(publicKey, text);
 */
export async function encryptBrowserRsaWithAesGcm(publicKey: string, text: string): Promise<string> {
  const gcmKey = crypto.randomBytes(32).toString('base64');

  const encrypted = await _encryptAesGcm(gcmKey, text);
  const encryptedRsa = await _encryptBrowserRsa(publicKey, Buffer.from(gcmKey).toString('base64'));

  return `${encryptedRsa}\n${encrypted}`;
}
