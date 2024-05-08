import crypto from 'crypto';
import { computeKey } from './utils';

/**
 * Encrypts a string using AES-GCM
 * @param {string | Buffer} secret The secret to use for encryption
 * @param {string} text The text to encrypt
 * @returns {string} The encrypted text
 */
export async function _encryptAesGcm(secret: string | Buffer, text: string): Promise<string> {
  const version = Buffer.alloc(1, 1);

  const salt = crypto.randomBytes(16);

  const iv = crypto.randomBytes(12);
  const key = await computeKey(secret, salt);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([version, salt, iv, encrypted, authTag]).toString('base64');
}
