import crypto from 'crypto';

async function computeKey(pass: string | Buffer, salt: Buffer): Promise<Buffer> {
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

export function _encryptRsa(publicKey: string, text: string): string {
  const key = crypto.createPublicKey(publicKey);
  const encryptedData = crypto.publicEncrypt(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(text)
  );

  return encryptedData.toString('base64');
}

export function _decryptRsa(privateKey: string, encryptedText: string): string {
  const key = crypto.createPrivateKey(privateKey);
  const decryptedData = crypto.privateDecrypt(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedText, 'base64')
  );

  return decryptedData.toString();
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
 * const encrypted = await encryptRsaWithAesGcm(publicKey, text);
 */
export async function encryptRsaWithAesGcm(publicKey: string, text: string): Promise<string> {
  const gcmKey = crypto.randomBytes(32).toString('base64');

  const encrypted = await _encryptAesGcm(gcmKey, text);

  return `${_encryptRsa(publicKey, Buffer.from(gcmKey).toString('base64'))}\n${encrypted}`;
}

/**
 * Provided an X.509/ OpenSSL PEM private key, and a string of text to decrypt,
 * This function will
 * 1. Split the encrypted text into the encrypted key and the encrypted text
 * 2. Decrypt the key using RSA-OAEP with the provided private key
 * 3. Decrypt the text using AES-GCM with the decrypted key
 * 4. Return the decrypted text
 *
 * @param {string} privateKey - The private key corresponding to the public key used for encryption
 * @param {string} encryptedText - The encrypted text to decrypt
 * @returns {string} The decrypted text
 */
export async function decryptRsaWithAesGcm(privateKey: string, encryptedText: string): Promise<string> {
  const [encryptedKey, encrypted] = encryptedText.split('\n');

  const gcmKey = await _decryptRsa(privateKey, encryptedKey);

  return _decryptAesGcm(Buffer.from(gcmKey, 'base64').toString(), encrypted);
}
