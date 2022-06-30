import { PublicKey } from 'paillier-bigint';
export function bigIntFromBufferLE(buf: Buffer): bigint {
  return BigInt('0x' + Buffer.from(buf).reverse().toString('hex'));
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

export function bigIntFromBufferBE(buf: Buffer): bigint {
  return BigInt('0x' + buf.toString('hex'));
}

export function bigIntFromU8ABE(buf: Uint8Array): bigint {
  return bigIntFromBufferBE(Buffer.from(buf));
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
