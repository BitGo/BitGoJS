import should from 'should';

import { m, generateP, prove, verify } from '../../../../src/tss/ecdsa/paillierProof';
import { hexToBigInt, minModulusBitLength, randomBigInt } from '../../../../src';
import { deserializePallierChallenge, deserializePallierChallengeProofs } from '../../../../src/tss/ecdsa/types';
import { mockedPallierProofs } from '../../../paillierproof.util';

describe('EcdsaPallierProof', function () {
  it('m should equal 7', async function () {
    should(m).equal(7);
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
    const mockedPallierProof = mockedPallierProofs[0];

    it(`should throw an error for invalid n and lambda`, async function () {
      const n = BigInt(123);
      const lambda = BigInt(456);
      const p = deserializePallierChallenge({ p: mockedPallierProof.p }).p;
      should(() => prove(n, lambda, p)).throw('123 does not have inverse modulo 456');
    });

    it(`should throw an error for negative challenge value`, async function () {
      const n = hexToBigInt(mockedPallierProof.paillierKey.n);
      const lambda = hexToBigInt(mockedPallierProof.paillierKey.lambda);
      const p = deserializePallierChallenge({ p: mockedPallierProof.p }).p;
      p[p.length - 1] = BigInt(-99);
      should(() => prove(n, lambda, p)).throw('All paillier challenge values must be positive.');
    });
  });

  describe('verify', function () {
    const mockedPallierProof = mockedPallierProofs[0];

    it(`should throw an error for negative challenge value`, function () {
      const n = hexToBigInt(mockedPallierProof.paillierKey.n);
      const p = deserializePallierChallenge({ p: mockedPallierProof.p }).p;
      p[p.length - 1] = BigInt(-99);
      const sigma = deserializePallierChallengeProofs({ sigma: mockedPallierProof.sigma }).sigma;
      should(() => verify(n, p, sigma)).throw('All paillier challenge values must be positive.');
    });

    it(`should throw an error for negative challenge proof value`, function () {
      const n = hexToBigInt(mockedPallierProof.paillierKey.n);
      const p = deserializePallierChallenge({ p: mockedPallierProof.p }).p;
      const sigma = deserializePallierChallengeProofs({ sigma: mockedPallierProof.sigma }).sigma;
      sigma[sigma.length - 1] = BigInt(-99);
      should(() => verify(n, p, sigma)).throw('All paillier challenge proof values must be positive.');
    });
  });

  describe('prove and verify', function () {
    mockedPallierProofs.forEach((mockedPallierProof, i) => {
      it(`should create a challenge, prove it, and verify the proofs ${i} of ${mockedPallierProofs.length}`, async function () {
        const n = hexToBigInt(mockedPallierProof.paillierKey.n);
        const lambda = hexToBigInt(mockedPallierProof.paillierKey.lambda);
        const p = await generateP(n);
        const sigma = await prove(n, lambda, p);
        const res = await verify(hexToBigInt(mockedPallierProof.paillierKey.n), p, sigma);
        should(res).be.true();
      });
    });
  });
});
