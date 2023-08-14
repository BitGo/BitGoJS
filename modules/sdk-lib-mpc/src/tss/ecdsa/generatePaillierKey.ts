import * as bcu from 'bigint-crypto-utils';
import { PublicKey, PrivateKey, KeyPair } from 'paillier-bigint';
import { prove } from './paillierBlumProof';
import { KeyPairWithDeserializedPaillierBlumProof } from './types';

// Implementation based on paillier-bigint's generateRandomKeys
export async function generatePaillierKey(bitlength = 3072): Promise<KeyPairWithDeserializedPaillierBlumProof> {
  let p, q, n;
  do {
    p = await bcu.prime(Math.floor(bitlength / 2) + 1);
    q = await bcu.prime(Math.floor(bitlength / 2));
    n = p * q;
  } while (q === p || q % BigInt(4) !== BigInt(3) || p % BigInt(4) !== BigInt(3) || bcu.bitLength(n) !== bitlength);
  const { w, x, z } = await prove(p, q);
  const g = n + BigInt(1);
  const lambda = (p - BigInt(1)) * (q - BigInt(1));
  const mu = bcu.modInv(lambda, n);
  const publicKey = new PublicKey(n, g);
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
  const keyPair: KeyPair = { publicKey, privateKey };
  return { keyPair, w, x, z };
}
