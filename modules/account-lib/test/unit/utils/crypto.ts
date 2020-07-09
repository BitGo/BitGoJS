import should from 'should';

import * as Crypto from '../../../src/utils/crypto';

describe('Crypto utils', function() {
  describe('should succeed', function() {
    it('to get a valid uncompressed public key from an xpub', () => {
      const pub = Crypto.xpubToUncompressedPub(
        'xpub661MyMwAqRbcEYS8w7XLSVeEsBXy79zSzH1J8vCdxAZningWLdN3zgtU6S598UeKT2DjCgZD5oxriwVyS4t5pz7Ga5xJVNyBPcvJVxaRq5q',
      );

      should.exist(pub);
      pub.should.equal(
        '040706358b2bf2917d7be11a692681d9e7266e431b2dc124cb15ba6d98501ecab091e6e25ce84278c56e1e264b69df67b3f37e2a7ffe41f3f56a07fb393095d5b1',
      );
    });

    it('to get a valid raw private key from an xprv', () => {
      const prv = Crypto.xprvToRawPrv(
        'xprv9s21ZrQH143K24Mfq5zL5MhWK9hUhhGbd45hLXo2Pq2oqzMMo63oStZzF9HJ1Z6954LhpFkdHzUXfqoE7GH6eyJvQSfYuAdK2gXGjM6mvd2',
      );

      should.exist(prv);
      prv.should.equal('1f3cd7a858a11eef3e3f591cb5532241ce12c26b588197c88ebb42c6b6cbb5ba');
    });

    it('to get a valid extended keys from a raw private key', () => {
      const pub = Crypto.rawPrvToExtendedKeys('1F3CD7A858A11EEF3E3F591CB5532241CE12C26B588197C88EBB42C6B6CBB5BA');

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

  describe('should fail', function() {
    it('to get a valid uncompressed public key from an invalid xpub', () => {
      should.throws(() => Crypto.xpubToUncompressedPub('xpub'));
    });

    it('to get a valid raw private key from an invalid xprv', () => {
      should.throws(() => Crypto.xprvToRawPrv('xprv'));
    });

    it('to get a valid extended keys from an invalid raw private key', () => {
      should.throws(() => Crypto.rawPrvToExtendedKeys('ABCD'));
    });
  });
});
