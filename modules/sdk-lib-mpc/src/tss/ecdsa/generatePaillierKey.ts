import * as bcu from 'bigint-crypto-utils';
import { PublicKey, PrivateKey, KeyPair } from 'paillier-bigint';
import { prove } from './paillierBlumProof';
import { DeserializedKeyPairWithPaillierBlumProof, RawPaillierKey } from './types';

// Implementation based on paillier-bigint's generateRandomKeys
export async function generatePaillierKey(bitlength = 3072): Promise<RawPaillierKey> {
  let [p, q, n] = [BigInt(0), BigInt(0), BigInt(0)];
  do {
    p = await bcu.prime(Math.floor(bitlength / 2) + 1);
    q = await bcu.prime(Math.floor(bitlength / 2));
    n = p * q;
  } while (q === p || q % BigInt(4) !== BigInt(3) || p % BigInt(4) !== BigInt(3) || bcu.bitLength(n) !== bitlength);
  const lambda = (p - BigInt(1)) * (q - BigInt(1));
  const mu = bcu.modInv(lambda, n);
  return { n, lambda, mu, p, q };
}

export async function generatePaillierKeyWithProof(
  bitlength = 3072
): Promise<DeserializedKeyPairWithPaillierBlumProof> {
  const key = await generatePaillierKey(bitlength);
  const proof = await prove(key.p, key.q);
  return { ...key, ...proof };
}

export function rawPaillierKeyToPaillierKey(n: bigint, lambda: bigint, mu: bigint, p: bigint, q: bigint): KeyPair {
  const g = n + BigInt(1);
  const publicKey = new PublicKey(n, g);
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
  return { publicKey, privateKey };
}
