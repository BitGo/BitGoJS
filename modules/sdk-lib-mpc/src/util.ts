import { PublicKey } from 'paillier-bigint';
import { bitLength, randBits } from 'bigint-crypto-utils';
import { gcd } from 'bigint-mod-arith';
import crypto from 'crypto';

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
 * @param hexLength - length to pad each big int number too
 */
export function convertBigIntArrToHexArr(values: bigint[], hexLength?: number): string[] {
  return values.map((value) => {
    return bigIntToHex(value, hexLength);
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

export function bigIntToBufferLE(n: bigint, minBytes?: number): Buffer {
  let v = n.toString(16);
  v = '0'.slice(0, v.length % 2) + v;
  const buf = Buffer.from(v, 'hex').reverse();
  if (minBytes && buf.length < minBytes) {
    return Buffer.concat([buf, Buffer.alloc(minBytes - buf.length)]);
  }
  return buf;
}

export function bigIntFromBufferLE(buf: Buffer): bigint {
  return BigInt('0x' + Buffer.from(buf).reverse().toString('hex'));
}

export function bigIntToBufferBE(n: bigint, minBytes?: number): Buffer {
  let v = n.toString(16);
  v = '0'.slice(0, v.length % 2) + v;
  const buf = Buffer.from(v, 'hex');
  if (minBytes && buf.length < minBytes) {
    return Buffer.concat([Buffer.alloc(minBytes - buf.length), buf]);
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
 * Function get paillier public key simple varient
 * @param {bigint} n
 * @returns {bigint}
 */
export function getPaillierPublicKey(n: bigint): PublicKey {
  return new PublicKey(n, n + BigInt(1));
}

/**
 * Generate a random positive integer co-prime to x
 * @param x
 * @returns {Promise<bigint>}
 */
export async function randomPositiveCoPrimeTo(x: bigint): Promise<bigint> {
  while (true) {
    const y = await randomBigInt(bitLength(x));
    if (y > BigInt(0) && gcd(x, y) === BigInt(1)) {
      return y;
    }
  }
}

/**
 * Generate a random positive integer coprime less than x with the same bit depth.
 * @param x
 * @returns {Promise<bigint>}
 */
export async function randomPositiveCoPrimeLessThan(x: bigint): Promise<bigint> {
  if (x <= BigInt(2)) {
    throw new Error('x must be larger than 2');
  }
  while (true) {
    const y = await randomBigInt(bitLength(x));
    if (y > BigInt(0) && y < x && gcd(x, y) === BigInt(1)) {
      return y;
    }
  }
}

/**
 * Generate a random number of a given bitlength
 * @param bitlength
 * @returns {Promise<bigint>}
 */
export async function randomBigInt(bitlength: number): Promise<bigint> {
  return bigIntFromBufferBE(Buffer.from(await randBits(bitlength, true)));
}

/**
 * @param seed - used to construct derivation path deterministically
 * @param isMaster - if set, path starts with prefix `m/`
 * @return path `(m/)/999999/a/b` where `a` and `b` are 7-byte pseudorandom numbers based on seed
 */
export function getDerivationPath(seed: string, isMaster = true): string {
  const derivationPathInput = sha256(sha256(`${seed}`)).toString('hex');
  const derivationPathParts = [
    parseInt(derivationPathInput.slice(0, 7), 16),
    parseInt(derivationPathInput.slice(7, 14), 16),
  ];
  const prefix = isMaster ? 'm/' : '';
  return prefix + '999999/' + derivationPathParts.join('/');
}

function sha256(input: crypto.BinaryLike): Buffer {
  return crypto.createHash('sha256').update(input).digest();
}
