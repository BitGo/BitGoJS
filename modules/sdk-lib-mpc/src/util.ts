import { PublicKey } from 'paillier-bigint';
import { bitLength, randBitsSync } from 'bigint-crypto-utils';
import { gcd } from 'bigint-mod-arith';

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
 * Generates a random number less than x that is also co-prime to x
 * @param x
 */
export function randomCoPrimeLessThan(x: bigint): bigint {
  while (true) {
    const y = randomBigInt(bitLength(x));
    if (y > BigInt(0) && y < x && gcd(x, y) === BigInt(1)) {
      return y;
    }
  }
}

/**
 * Generates a random number co-prime to x
 * @param x
 */
export function randomCoPrimeTo(x: bigint): bigint {
  while (true) {
    const y = randomBigInt(bitLength(x));
    if (y > BigInt(0) && gcd(x, y) === BigInt(1)) {
      return y;
    }
  }
}

/**
 * Generate a random number of a given bitlength
 * @param bitlength
 */
export function randomBigInt(bitlength: number): bigint {
  return bigIntFromBufferBE(Buffer.from(randBitsSync(bitlength, true)));
}
