import should from 'should';

import { alpha, m, generateP, prove, verify } from '../../../../src/tss/ecdsa/paillierproof';
import { hexToBigInt, minModulusBitLength, randomBigInt } from '../../../../src';
import { deserializePaillierChallenge, deserializePaillierChallengeProofs } from '../../../../src/tss/ecdsa/types';
import { mockedPaillierProofs } from '../../../paillierproof.util';
import { primesSmallerThan319567 } from '../../../../src/tss/ecdsa/primes';

describe('EcdsaPaillierProof', function () {
  it('m should equal 7', async function () {
    should(m).equal(7);
  });

  it('alpha should equal 319567', async function () {
    // If you need to change this alpha and update this test,
    // then regenerate the primes.ts file using something like
    // https://www.geeksforgeeks.org/print-all-prime-numbers-less-than-or-equal-to-n/
    should(alpha).equal(319567);
    should(primesSmallerThan319567.length).equal(27572);
  });

  describe('generateP', async function () {
    it('should fail if n has a bitlength less than 3072', async function () {
      const n = await randomBigInt(3070);
      await should(generateP(BigInt(n))).rejectedWith('modulus n must have a bit length larger than or equal to 3072');
    });

    it('should generate 7 challenges', async function () {
      const n = await randomBigInt(minModulusBitLength);
      should((await generateP(BigInt(n))).length).equal(7);
    });
  });

  describe('prove', function () {
    const mockedPaillierProof = mockedPaillierProofs[0];

    it(`should throw an error for invalid n and lambda`, async function () {
      const n = BigInt(123);
      const lambda = BigInt(456);
      const p = deserializePaillierChallenge({ p: mockedPaillierProof.p }).p;
      should(() => prove(n, lambda, p)).throw('123 does not have inverse modulo 456');
    });

    it(`should throw an error for negative challenge value`, async function () {
      const n = hexToBigInt(mockedPaillierProof.paillierKey.n);
      const lambda = hexToBigInt(mockedPaillierProof.paillierKey.lambda);
      const p = deserializePaillierChallenge({ p: mockedPaillierProof.p }).p;
      p[p.length - 1] = BigInt(-99);
      should(() => prove(n, lambda, p)).throw('All paillier challenge values must be positive.');
    });
  });

  describe('verify', function () {
    const mockedPaillierProof = mockedPaillierProofs[0];

    it(`should throw an error for negative challenge value`, function () {
      const n = hexToBigInt(mockedPaillierProof.paillierKey.n);
      const p = deserializePaillierChallenge({ p: mockedPaillierProof.p }).p;
      p[p.length - 1] = BigInt(-99);
      const sigma = deserializePaillierChallengeProofs({ sigma: mockedPaillierProof.sigma }).sigma;
      should(() => verify(n, p, sigma)).throw('All paillier challenge values must be positive.');
    });

    it(`should throw an error for negative challenge proof value`, function () {
      const n = hexToBigInt(mockedPaillierProof.paillierKey.n);
      const p = deserializePaillierChallenge({ p: mockedPaillierProof.p }).p;
      const sigma = deserializePaillierChallengeProofs({ sigma: mockedPaillierProof.sigma }).sigma;
      sigma[sigma.length - 1] = BigInt(-99);
      should(() => verify(n, p, sigma)).throw('All paillier challenge proof values must be positive.');
    });
  });

  describe('prove and verify', function () {
    mockedPaillierProofs.forEach((mockedPaillierProof, i) => {
      it(`should create a challenge, prove it, and verify the proofs ${i} of ${mockedPaillierProofs.length}`, async function () {
        const n = hexToBigInt(mockedPaillierProof.paillierKey.n);
        const lambda = hexToBigInt(mockedPaillierProof.paillierKey.lambda);
        const p = await generateP(n);
        const sigma = await prove(n, lambda, p);
        const res = await verify(hexToBigInt(mockedPaillierProof.paillierKey.n), p, sigma);
        should(res).be.true();
      });
    });
  });
});
