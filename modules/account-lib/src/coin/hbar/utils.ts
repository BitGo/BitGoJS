/**
 * Returns whether or not the string is a valid Hedera account
 *
 * @param {string} account - the  account to be validated
 * @returns {boolean} - the validation result
 */
export function isValidAccount(account: string): boolean {
  return /(^[0-9]+\.[0-9]+\.[0-9]+$)|(^[0-9]+$)/.test(account);
}

/**
 * Returns whether or not the string is a valid Hedera public key
 *
 * @param {string} key - the  public key to be validated
 * @returns {boolean} - the validation result
 */
export function isValidPublicKey(key: string): boolean {
  return /^([0-9a-f]|[0-9A-F]){1,}$/.test(key) && key.length === 64;
}

export function toHex(buffer: Buffer | Uint8Array): string {
  return buffer.toString('hex');
}

export function toUint8Array(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}
