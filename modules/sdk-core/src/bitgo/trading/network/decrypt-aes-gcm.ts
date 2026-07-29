import crypto from 'crypto';
import { computeKey } from './utils';

/**
 * Decrypts a string using AES-GCM
 * @param {string | Buffer} secret The secret to use for decryption
 * @param {string} encryptedText The text to decrypt
 * @returns {string} The decrypted text
 */
export async function _decryptAesGcm(secret: string | Buffer, encryptedText: string): Promise<string> {
  const data = Buffer.from(encryptedText, 'base64');

  const version = data.slice(0, 1);
  if (version.readInt8() !== 1) {
    throw new Error('Unknown encryption version');
  }

  const salt = data.slice(1, 17);
  const iv = data.slice(17, 29);
  const authTag = data.slice(-16);
  const encrypted = data.slice(29, -16);

  const key = await computeKey(secret, salt);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}
