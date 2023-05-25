import { PublicKey } from 'paillier-bigint';
import { bitLength, randBits } from 'bigint-crypto-utils';
import { gcd } from 'bigint-mod-arith';

/**
 * Returns a bigint array from a hex string array
 * @param values
 */
export function convertHexArrToBigIntArr(values: string[]): bigint[] {
  return values.map((value) => {
    return hexToBigInt(value);
  });
}

/**
 * Returns a hex string array from a bigint array
 * @param values
 */
export function convertBigIntArrToHexArr(values: bigint[]): string[] {
  return values.map((value) => {
    return bigIntToHex(value);
  });
}

export function hexToBigInt(hex: string): bigint {
  // Strangely bigint.toString(16) gives a hex string without 0x,
  // but it won't accept the same string without 0x to convert
  // to a bigint (BigInt(hex string)). So have to introduce this
  // check to convert to add 0x in case if hex string
  // doesn't have it.
  if (hex.slice(0, 2) === '0x') {
    return BigInt(hex);
  }
  return BigInt('0x' + hex);
}

/**
 * Returns an hex string of the given bigint
 *
 * @param {bigint} bigint - the bigint to be converted to hex
 * @param hexLength
 * @returns {string} - the hex value
 */
export function bigIntToHex(bigint: bigint, hexLength?: number): string {
  let hex = bigint.toString(16);
  hex = '0'.slice(0, hex.length % 2) + hex;
  if (hexLength) {
    hex = hex.padStart(hexLength, '0');
  }
  return hex;
}

export function bigIntToBufferLE(n: bigint, bytes?: number): Buffer {
  let v = n.toString(16);
  v = '0'.slice(0, v.length % 2) + v;
  const buf = Buffer.from(v, 'hex').reverse();
  if (bytes && buf.length < bytes) {
    return Buffer.concat([buf, Buffer.alloc(bytes - buf.length)]);
  }
  return buf;
}

export function bigIntFromBufferLE(buf: Buffer): bigint {
  return BigInt('0x' + Buffer.from(buf).reverse().toString('hex'));
}

export function bigIntToBufferBE(n: bigint, bytes?: number): Buffer {
  let v = n.toString(16);
  v = '0'.slice(0, v.length % 2) + v;
  const buf = Buffer.from(v, 'hex');
  if (bytes && buf.length < bytes) {
    return Buffer.concat([Buffer.alloc(bytes - buf.length), buf]);
  }
  return buf;
}

export function bigIntFromBufferBE(buf: Buffer): bigint {
  return BigInt('0x' + buf.toString('hex'));
}

export function bigIntFromU8ABE(buf: Uint8Array): bigint {
  return bigIntFromBufferBE(Buffer.from(buf));
}

export function clamp(u: bigint): bigint {
  u &= BigInt('0x7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8');
  u |= BigInt('0x4000000000000000000000000000000000000000000000000000000000000000');
  return u;
}

/**
 * Function get pallier public key simple varient
 * @param {bigint} n
 * @returns {bigint}
 */
export function getPaillierPublicKey(n: bigint): PublicKey {
  return new PublicKey(n, n + BigInt(1));
}

/**
 * Generate a random number co-prime to x
 * @param x
 */
export async function randomCoPrimeTo(x: bigint): Promise<bigint> {
  while (true) {
    const y = await randomBigInt(bitLength(x));
    if (y > BigInt(0) && gcd(x, y) === BigInt(1)) {
      return y;
    }
  }
}

/**
 * Generate a random number of a given bitlength
 * @param bitlength
 */
export async function randomBigInt(bitlength: number): Promise<bigint> {
  return bigIntFromBufferBE(Buffer.from(await randBits(bitlength, true)));
}
