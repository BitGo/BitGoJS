import assert from 'assert';
import {
  xpubToUncompressedPub,
  xprvToRawPrv,
  rawPrvToExtendedKeys,
  hexToBigInt,
  convertHexArrToBigIntArr,
  convertBigIntArrToHexArr,
} from '@bitgo/sdk-core';
import should from 'should';

describe('Crypto utils', function () {
  describe('should succeed', function () {
    it('to get a valid uncompressed public key from an xpub', () => {
      const pub = xpubToUncompressedPub(
        'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6S598UeKT2DjCgZD5oxriwVyS4t5pz7Ga5xJVNyBPcvJVxaRq5q',
      );

      should.exist(pub);
      pub.should.equal(
        '040706358b2bf2917d7be11a692681d9e7266e431b2dc124cb15ba6d98501ecab091e6e25ce84278c56e1e264b69df67b3f37e2a7ffe41f3f56a07fb393095d5b1',
      );
    });

    it('to get a valid raw private key from an xprv', () => {
      const prv = xprvToRawPrv(
        'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzF9HJ1Z6954LhpFkdHzUXfqoE7GH6eyJvQSfYuAdK2gXGjM6mvd2',
      );

      should.exist(prv);
      prv.should.equal('1f3cd7a858a11eef3e3f591cb5532241ce12c26b588197c88ebb42c6b6cbb5ba');
    });

    it('to get a valid extended keys from a raw private key', () => {
      const pub = rawPrvToExtendedKeys('1F3CD7A858A11EEF3E3F591CB5532241CE12C26B588197C88EBB42C6B6CBB5BA');

      should.exist(pub.xprv);
      should.exist(pub.xpub);
      pub.xprv!.should.equal(
        'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzF9HJ1Z6954LhpFkdHzUXfqoE7GH6eyJvQSfYuAdK2gXGjM6mvd2',
      );
      pub.xpub.should.equal(
        'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6S598UeKT2DjCgZD5oxriwVyS4t5pz7Ga5xJVNyBPcvJVxaRq5q',
      );
    });
  });

  describe('should fail', function () {
    it('to get a valid uncompressed public key from an invalid xpub', () => {
      assert.throws(() => xpubToUncompressedPub('xpub'));
    });

    it('to get a valid raw private key from an invalid xprv', () => {
      assert.throws(() => xprvToRawPrv('xprv'));
    });

    it('to get a valid extended keys from an invalid raw private key', () => {
      assert.throws(() => rawPrvToExtendedKeys('ABCD'));
    });
  });

  describe('hexToBigInt utility', () => {
    const hex = '36119d';
    const number = 3543453;
    it('should convert hex to BigInt', function () {
      hexToBigInt(hex).should.equal(BigInt(number));
      hexToBigInt('0x' + hex).should.equal(BigInt(number));
    });
    it('should throw error converting hex to BigInt', function () {
      assert.throws(() => hexToBigInt('op'));
    });
  });

  describe('convertHexToBigIntArr and convertBigIntArrToHexArr', function () {
    it('able to serialize/deserialize between the two methods', function () {
      const fakeHexArr = ['8abc528e671324135d709395a4cf2552e842f648b8245df65f144311d4482082117355440ae565faf21d7587'];
      const fakeBigIntArr = convertHexArrToBigIntArr(fakeHexArr);
      const hexArrAgain = convertBigIntArrToHexArr(fakeBigIntArr);
      hexArrAgain.should.deepEqual(fakeHexArr);
    });
  });
});
