import assert from 'assert';

import { generateP, m } from '../../../../src/tss/ecdsa/pallierProof';
import { minModulusBitLength, randomBigInt } from '../../../../src';

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
      assert.strictEqual((await generateP(BigInt(n))).length, 128);
    });
  });

  // describe('prove', function () {});
  //
  // describe('verify', function () {});
});
