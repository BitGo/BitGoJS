import { secp256k1 } from '@noble/curves/secp256k1';

const n = BigInt(secp256k1.CURVE.n);
const nDiv2 = n / BigInt(2);

function bytesToBigInt(bytes: Uint8Array): bigint {
  return BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
}

export function isHighS(s: Uint8Array): boolean {
  return bytesToBigInt(s) > nDiv2;
}
