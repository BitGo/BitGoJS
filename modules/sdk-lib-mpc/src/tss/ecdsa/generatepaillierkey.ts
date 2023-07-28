import * as bcu from 'bigint-crypto-utils';
import { PublicKey, PrivateKey, KeyPair } from 'paillier-bigint';
import { proveBlum } from './paillierproof';

export interface KeyPairWithProof {
  keyPair: KeyPair;
  w: bigint;
  x: Array<bigint>;
  z: Array<bigint>;
}

// Implementation based on paillier-bigint's generateRandomKeys
export async function generatePaillierKey(bitlength = 3072): Promise<KeyPairWithProof> {
  let p, q, n;
  do {
    p = await bcu.prime(Math.floor(bitlength / 2) + 1);
    q = await bcu.prime(Math.floor(bitlength / 2));
    n = p * q;
  } while (q === p || q % BigInt(4) !== BigInt(3) || p % BigInt(4) !== BigInt(3) || bcu.bitLength(n) !== bitlength);
  const { w, x, z } = await proveBlum(p, q);
  const g = n + BigInt(1);
  const lambda = (p - BigInt(1)) * (q - BigInt(1));
  const mu = bcu.modInv(lambda, n);
  const publicKey = new PublicKey(n, g);
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q);
  const keyPair: KeyPair = { publicKey, privateKey };
  return { keyPair, w, x, z };
}
