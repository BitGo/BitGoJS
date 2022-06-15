import * as should from 'should';
import * as nacl from 'tweetnacl';
import { SeedEncoding } from '../../../src/lib/seedEncoding';

describe('Algo seed encoding', function () {
  describe('#isValid', function () {
    it('should validate an encoded seed', function () {
      const seed = nacl.randomBytes(32);
      const encodedSeed = SeedEncoding.encode(seed);
      SeedEncoding.isValidSeed(encodedSeed).should.be.true();
    });

    it('should fail to verify an invalid Algorand seed', function () {
      SeedEncoding.isValidSeed('MO2H6ZU47Q36GJ6GVHUKGEBEQINN7ZWVACMWZQGIYUOE3RBSRVYHV4ACJG').should.be.false();
    });
  });

  describe('encode, decode', function () {
    it('should be able to encode and decode a seed', function () {
      const seed = nacl.randomBytes(32);
      const encodedSeed = SeedEncoding.encode(seed);
      const decodedSeed = SeedEncoding.decode(encodedSeed);
      should.deepEqual(decodedSeed.seed, seed);
    });
  });
});
