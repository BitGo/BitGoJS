import 'should';
import { OpenSSL, minModulusBitLength } from '@bitgo/sdk-lib-mpc';
import { bitLength, isProbablyPrime } from 'bigint-crypto-utils';
import { NODE_MAJOR_VERSION } from '../node.utils';

describe('openssl', function () {
  it('should throw an error if module is not initialized', async function () {
    const openssl = new OpenSSL();
    await openssl
      .generateSafePrime(minModulusBitLength)
      .should.be.rejectedWith('The OpenSSl class is not initialized! Please call OpenSSL.init().');
  });

  // node 14 requires --experimental-wasm-bigint node flag
  if (NODE_MAJOR_VERSION > 14) {
    it('should generate a safe prime number of a certain bitLength', async function () {
      const openssl = new OpenSSL();
      await openssl.init();
      const safePrime = await openssl.generateSafePrime(512);
      bitLength(safePrime).should.equal(512);
    });

    it('should generate a safe prime number', async function () {
      const openssl = new OpenSSL();
      await openssl.init();
      const safePrime = await openssl.generateSafePrime(512);
      let isPrime = await isProbablyPrime(safePrime);
      isPrime.should.be.true();
      isPrime = await isProbablyPrime((safePrime - BigInt(1)) / BigInt(2));
      isPrime.should.be.true();
    });

    it('should be able to generate multiple safe primes with the same openssl instance', async function () {
      const openssl = new OpenSSL();
      await openssl.init();
      const safePrimes = await Promise.all([openssl.generateSafePrime(512), openssl.generateSafePrime(512)]);
      safePrimes.length.should.equal(2);
    });
  }
});
