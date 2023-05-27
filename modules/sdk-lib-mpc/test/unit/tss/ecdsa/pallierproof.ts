import assert from 'assert';

import { m, generateP, prove, verify } from '../../../../src/tss/ecdsa/pallierProof';
import { hexToBigInt, minModulusBitLength, randomBigInt } from '../../../../src';
import { deserializePallierChallenge, deserializePallierChallengeProofs } from '../../../../src/tss/ecdsa/types';
import { mockedPallierProofs } from '../../../pallierproof.util';

describe('EcdsaPallierProof', function () {
  it('m should equal 128', async function () {
    assert.strictEqual(m, 128);
  });

  describe('generateP', async function () {
    it('should fail if n has a bitlength less than 3072', async function () {
      const n = await randomBigInt(3070);
      try {
        await generateP(BigInt(n));
        assert.fail('should throw');
      } catch (e) {
        assert.strictEqual(e.message, 'modulus n must have a bit length larger than or equal to 3072');
      }
    });

    it('should generate 128 challenges', async function () {
      const n = await randomBigInt(minModulusBitLength);
      // fs.writeFileSync('./testdata.json', JSON.stringify(blah));
      assert.strictEqual((await generateP(BigInt(n))).length, 128);
    });
  });

  describe('prove', function () {
    const mockedValues = mockedPallierProofs.slice(0, 5);
    mockedValues.forEach((mockedPallierProof, i) => {
      it(`should generate a proof for a given pallier key ${i} of ${mockedValues.length}`, async function () {
        const n = hexToBigInt(mockedPallierProof.pallierKey.n);
        const lambda = hexToBigInt(mockedPallierProof.pallierKey.lambda);
        const p = deserializePallierChallenge({ p: mockedPallierProof.p }).p;
        const sigma = prove(n, lambda, p);
        assert.strictEqual(sigma.length, p.length);
      });
    });

    it(`should throw an error for invalid n and lambda`, async function () {
      const n = BigInt(123);
      const lambda = BigInt(456);
      const p = deserializePallierChallenge({ p: mockedValues[0].p }).p;
      try {
        prove(n, lambda, p);
        assert.fail('should throw');
      } catch (e) {
        assert.strictEqual(e.message, '123 does not have inverse modulo 456');
      }
    });

    it(`should throw an error for negative challenge value`, async function () {
      const n = hexToBigInt(mockedValues[0].pallierKey.n);
      const lambda = hexToBigInt(mockedValues[0].pallierKey.lambda);
      const p = deserializePallierChallenge({ p: mockedValues[0].p }).p;
      p[p.length - 1] = BigInt(-99);
      try {
        prove(n, lambda, p);
        assert.fail('should throw');
      } catch (e) {
        assert.strictEqual(e.message, 'All pallier challenge values must be positive.');
      }
    });
  });

  describe('verify', function () {
    const mockedValues = mockedPallierProofs.slice(5, 10);
    mockedValues.forEach((mockedPallierProof, i) => {
      it(`should return true valid proofs ${i} of ${mockedValues.length}`, function () {
        const res = verify(
          hexToBigInt(mockedPallierProof.pallierKey.n),
          deserializePallierChallenge(mockedPallierProof).p,
          deserializePallierChallengeProofs(mockedPallierProof).sigma
        );
        assert.strictEqual(res, true);
      });
    });

    it(`should throw an error for negative challenge value`, function () {
      const n = hexToBigInt(mockedValues[0].pallierKey.n);
      const p = deserializePallierChallenge({ p: mockedValues[0].p }).p;
      p[p.length - 1] = BigInt(-99);
      const sigma = deserializePallierChallengeProofs({ sigma: mockedValues[0].sigma }).sigma;
      try {
        verify(n, p, sigma);
        assert.fail('should throw');
      } catch (e) {
        assert.strictEqual(e.message, 'All pallier challenge values must be positive.');
      }
    });

    it(`should throw an error for negative challenge proof value`, function () {
      const n = hexToBigInt(mockedValues[0].pallierKey.n);
      const p = deserializePallierChallenge({ p: mockedValues[0].p }).p;
      const sigma = deserializePallierChallengeProofs({ sigma: mockedValues[0].sigma }).sigma;
      sigma[sigma.length - 1] = BigInt(-99);
      try {
        verify(n, p, sigma);
        assert.fail('should throw');
      } catch (e) {
        assert.strictEqual(e.message, 'All pallier challenge proof values must be positive.');
      }
    });
  });

  describe('prove and verify', function () {
    it('should verify a newly generated proof', async function () {
      const n = hexToBigInt(mockedPallierProofs[0].pallierKey.n);
      const lambda = hexToBigInt(mockedPallierProofs[0].pallierKey.lambda);
      const p = await generateP(n);
      const sigma = prove(n, lambda, p);
      assert.strictEqual(verify(n, p, sigma), true);
    });
  });
});
