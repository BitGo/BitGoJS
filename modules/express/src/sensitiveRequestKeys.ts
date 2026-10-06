/**
 * Request body keys whose values must never be logged or echoed back to a caller.
 * Compared lowercased against incoming keys.
 */
export const SENSITIVE_REQUEST_KEYS = new Set([
  'password',
  'passphrase',
  'walletpassphrase',
  'prv',
  'privatekey',
  'encryptedprv',
  'secret',
]);
