import { rangeProof } from '@bitgo/sdk-core';
import { isProbablyPrime, bitLength } from 'bigint-crypto-utils';

describe('rangeproof tests', function () {
  it('should generate safe primes of a specified bitlength', async function () {
    const bitlength = 128; // this should be small enough to be reasonably fast
    const p = await rangeProof.generateSafePrime(bitlength);
    (await isProbablyPrime(p)).should.be.true();
    const q = (p - BigInt(1)) / BigInt(2);
    (await isProbablyPrime(q)).should.be.true();
    bitLength(p).should.equal(bitlength);
  });

  it('should generate an ntilde value of the appropriate bitlength', async function () {
    const bitlength = 256;
    const ntilde = await rangeProof.generateNTilde(bitlength);
    bitLength(ntilde.ntilde).should.equal(bitlength);
  });
});
