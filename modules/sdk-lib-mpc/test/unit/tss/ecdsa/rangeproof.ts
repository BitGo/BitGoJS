import sinon from 'sinon';
import * as paillierBigint from 'paillier-bigint';
import { EcdsaRangeProof, EcdsaTypes } from '../../../../src/tss/ecdsa';
import {
  randomPositiveCoPrimeTo,
  Secp256k1Curve,
  OpenSSL,
  BaseCurve,
  bigIntToBufferBE,
  bigIntFromBufferBE,
} from '../../../../src';
import { DeserializedNtilde, RangeProof } from '../../../../src/tss/ecdsa/types';
import { modPow, randBetween } from 'bigint-crypto-utils';
import { createHash } from 'crypto';

describe('MtA range proof', function () {
  const curve = new Secp256k1Curve();
  let switchPrime = false;
  let safePrimeMock: sinon.SinonStub;

  let paillierKeyPair: paillierBigint.KeyPair;
  let ntilde: EcdsaTypes.DeserializedNtilde;

  before('set up paillier and ntile', async function () {
    safePrimeMock = sinon.stub(OpenSSL.prototype, 'generateSafePrime').callsFake(async (bitlength: number) => {
      // Both primes below were generated using 'openssl prime -bits 256 -generate -safe'.
      if (switchPrime) {
        switchPrime = false;
        return BigInt('105026459418240911050597781175405200114409463599422710187772697695413160518507');
      } else {
        switchPrime = true;
        return BigInt('97740038048923029272833872518628089389073263932043585221445032564807403246907');
      }
    });

    paillierKeyPair = await paillierBigint.generateRandomKeys(2048, true);
    ntilde = await EcdsaRangeProof.generateNtilde(512);
  });

  after(function () {
    safePrimeMock.reset();
    safePrimeMock.restore();
  });

  it('valid range proof', async function () {
    const k = curve.scalarRandom();
    const rk = await randomPositiveCoPrimeTo(paillierKeyPair.publicKey.n);
    const ck = paillierKeyPair.publicKey.encrypt(k, rk);

    const proof = await EcdsaRangeProof.prove(
      curve,
      2048,
      paillierKeyPair.publicKey,
      {
        ntilde: ntilde.ntilde,
        h1: ntilde.h1,
        h2: ntilde.h2,
      },
      ck,
      k,
      rk
    );

    EcdsaRangeProof.verify(
      curve,
      2048,
      paillierKeyPair.publicKey,
      {
        ntilde: ntilde.ntilde,
        h1: ntilde.h1,
        h2: ntilde.h2,
      },
      proof,
      ck
    ).should.be.true();
  });

  it('encrypted value too big', async function () {
    // Pick k based on attack described in https://eprint.iacr.org/2021/1621.pdf, where M = 2^29 is chosen.
    const k = (BigInt(2) * (BigInt(2) ^ BigInt(29)) * paillierKeyPair.publicKey.n) / curve.order();
    const rk = await randomPositiveCoPrimeTo(paillierKeyPair.publicKey.n);
    const ck = paillierKeyPair.publicKey.encrypt(k, rk);

    const proof = await EcdsaRangeProof.prove(
      curve,
      2048,
      paillierKeyPair.publicKey,
      {
        ntilde: ntilde.ntilde,
        h1: ntilde.h1,
        h2: ntilde.h2,
      },
      ck,
      k,
      rk
    );

    EcdsaRangeProof.verify(
      curve,
      2048,
      paillierKeyPair.publicKey,
      {
        ntilde: ntilde.ntilde,
        h1: ntilde.h1,
        h2: ntilde.h2,
      },
      proof,
      ck
    ).should.be.false();
  });

  it('invalid range proof with 0 u and s', async function () {
    const k = curve.scalarRandom();
    const rk = await randomPositiveCoPrimeTo(paillierKeyPair.publicKey.n);
    const ck = paillierKeyPair.publicKey.encrypt(k, rk);

    const proof = await malicious_prove(
      curve,
      2048,
      paillierKeyPair.publicKey,
      {
        ntilde: ntilde.ntilde,
        h1: ntilde.h1,
        h2: ntilde.h2,
      },
      ck,
      k
    );

    EcdsaRangeProof.verify(
      curve,
      2048,
      paillierKeyPair.publicKey,
      {
        ntilde: ntilde.ntilde,
        h1: ntilde.h1,
        h2: ntilde.h2,
      },
      proof,
      ck
    ).should.be.false();
  });
});

async function malicious_prove(
  curve: BaseCurve,
  modulusBits: number,
  pk: paillierBigint.PublicKey,
  ntilde: DeserializedNtilde,
  c: bigint,
  m: bigint
): Promise<RangeProof> {
  const modulusBytes = Math.floor((modulusBits + 7) / 8);
  const q = curve.order();
  const q3 = q ** BigInt(3);
  const qntilde = q * ntilde.ntilde;
  const q3ntilde = q3 * ntilde.ntilde;
  const alpha = randBetween(q3);
  const gamma = randBetween(q3ntilde);
  const rho = randBetween(qntilde);
  const z = (modPow(ntilde.h1, m, ntilde.ntilde) * modPow(ntilde.h2, rho, ntilde.ntilde)) % ntilde.ntilde;
  const u = BigInt(0);
  const w = (modPow(ntilde.h1, alpha, ntilde.ntilde) * modPow(ntilde.h2, gamma, ntilde.ntilde)) % ntilde.ntilde;
  const hash = createHash('sha256');
  hash.update('\x06\x00\x00\x00\x00\x00\x00\x00');
  hash.update(bigIntToBufferBE(pk.n, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(pk.g, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(c, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(z, modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(u, 2 * modulusBytes));
  hash.update('$');
  hash.update(bigIntToBufferBE(w, modulusBytes));
  hash.update('$');
  const e = bigIntFromBufferBE(hash.digest()) % q;
  const s = BigInt(0);
  const s1 = e * m + alpha;
  const s2 = e * rho + gamma;
  return { z, u, w, s, s1, s2 };
}
