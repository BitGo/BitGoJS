import assert from 'assert';
import { generateP, m } from '../../../../src/tss/ecdsa/pallierProof';
import { randomBigInt } from '../../../../src';

describe('EcdsaPallierProof', function () {
  it('m should equal 128', function () {
    assert.strictEqual(m, 128);
  });

  describe('generateP', function () {
    it('should fail if n is not a positive integer', function () {
      try {
        generateP(BigInt(-1));
        assert.fail('should throw');
      } catch (e) {
        assert.strictEqual(e.message, 'n must be a positive integer larger than 0');
      }
    });

    it('should fail if n has a bitlength less than 3072', function () {
      const n = randomBigInt(3070);
      try {
        generateP(BigInt(n));
        assert.fail('should throw');
      } catch (e) {
        assert.strictEqual(e.message, 'n must have a bitlength of 3072 or larger');
      }
    });

    it('should generate 128 challenges', function () {
      const n = randomBigInt(3072);
      assert.strictEqual(generateP(BigInt(n)).length, 128);
    });
  });

  // describe('prove', function () {});
  //
  // describe('verify', function () {});
});
