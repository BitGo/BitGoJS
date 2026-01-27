/**
 * @prettier
 */

/**
 * List of sensitive keywords to detect and remove from logs
 * Uses case-insensitive substring matching
 */
const SENSITIVE_KEYWORDS = [
  // Authentication & Authorization Tokens
  'token', // Catches: token, _token, accessToken, refreshToken, authToken, bearer_token, authtoken, etc.
  'bearer', // Catches: bearer, Bearer, bearer_token
  'authorization', // Catches: authorization, Authorization
  'authkey', // Catches: authKey, _authKey, myAuthKey
  'oauth', // Catches: oauth, oAuth, oauth_token, oauth_client

  // Client Credentials
  'client', // Catches: client, client_id, client_secret, clientSecret, clientId, oauth_client

  // Private Keys & Cryptographic Material
  'prv', // Catches: prv, xprv, encryptedPrv
  'privatekey', // Catches: privateKey, userPrivateKey, backupPrivateKey, rootPrivateKey, encryptedPrivateKey
  'secret', // Catches: secret, _secret, clientSecret, secretKey, apiSecretKey

  // Keychains
  'keychain', // Catches: keychain, keychains, userKeychain

  // Passwords & Passphrases
  'password', // Catches: password, _password, userPassword, walletPassword
  'passwd', // Catches: passwd, _passwd
  'passphrase', // Catches: passphrase, walletPassphrase

  // Recovery & Seeds
  'mnemonic', // Catches: mnemonic, mnemonicPhrase
  'seed', // Catches: seed, seedPhrase, userSeed

  // Signatures & OTP
  'signature', // Catches: signature, txSignature, walletSignature
  'otp', // Catches: otp, otpCode, totpSecret

  // API Keys
  'apikey', // Catches: apiKey, apiKeyValue, myApiKey
];

/**
 * Recursively sanitize data by removing sensitive fields
 * @param data - The data to sanitize
 * @param seen - WeakSet to track circular references
 * @param depth - Current recursion depth
 * @returns Sanitized data with sensitive fields removed
 */
export function sanitize(data: any, seen: WeakSet<Record<string, unknown>> = new WeakSet(), depth = 0): any {
  const MAX_DEPTH = 50;

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Max depth protection to prevent stack overflow
  if (depth > MAX_DEPTH) {
    return '[Max Depth]';
  }

  // Handle primitives (string, number, boolean)
  if (typeof data !== 'object') {
    return data;
  }

  // Circular reference detection
  if (seen.has(data)) {
    return '[Circular]';
  }
  seen.add(data);

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item, seen, depth + 1));
  }

  // Handle objects
  const sanitized: any = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();

      // Check if key contains any sensitive keyword (substring matching)
      const isSensitive = SENSITIVE_KEYWORDS.some((keyword) => lowerKey.includes(keyword));

      if (!isSensitive) {
        // Safe field - recursively sanitize value
        sanitized[key] = sanitize(data[key], seen, depth + 1);
      }
      // Sensitive fields are skipped (removed from output)
    }
  }

  return sanitized;
}
