import bs58 from 'bs58';

/**
 * Encode a byte array to Base58 string.
 * Used for encoding addresses, anchors, and signatures for the Irys API.
 */
export function encodeBase58(bytes: Uint8Array): string {
  return bs58.encode(Buffer.from(bytes));
}

/**
 * Decode a Base58 string to a byte array.
 */
export function decodeBase58(str: string): Uint8Array {
  return Uint8Array.from(bs58.decode(str));
}

/**
 * Decode a Base58 string to a fixed-length byte array.
 * Throws if decoded length doesn't match expected length.
 */
export function decodeBase58ToFixed(str: string, expectedLength: number): Uint8Array {
  const decoded = bs58.decode(str);
  if (decoded.length !== expectedLength) {
    throw new Error(`Expected ${expectedLength} bytes, got ${decoded.length}`);
  }
  return Uint8Array.from(decoded);
}

/**
 * Convert a hex address (0x-prefixed or not) to a 20-byte Uint8Array.
 */
export function hexAddressToBytes(hexAddress: string): Uint8Array {
  const cleaned = hexAddress.startsWith('0x') ? hexAddress.slice(2) : hexAddress;
  if (cleaned.length !== 40) {
    throw new Error(`Invalid hex address length: ${cleaned.length}`);
  }
  return Uint8Array.from(Buffer.from(cleaned, 'hex'));
}

/**
 * Convert a hex address to Base58 (for Irys API calls).
 */
export function hexAddressToBase58(hexAddress: string): string {
  return encodeBase58(hexAddressToBytes(hexAddress));
}
