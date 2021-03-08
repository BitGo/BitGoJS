import should from 'should';
import * as testData from '../../../resources/stacks/stacks';

import { Stacks } from '../../../../src';

describe('Stacks KeyPair', function() {
  const defaultSeed = { seed: Buffer.alloc(64) };

  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new Stacks.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 64);
      should.equal(keyPair.getKeys().pub.length, 130);
    });

    it('from a private key', () => {
      const keyPair = new Stacks.KeyPair({ prv: testData.secretKey1 });
      should.equal(keyPair.getKeys().prv, testData.secretKey1);
    });

    it('from an uncompressed public key', () => {
      const keyPair = new Stacks.KeyPair({ pub: testData.pubKey2 });
      should.equal(keyPair.getKeys(false).pub, testData.pubKey2);
      should.equal(keyPair.getKeys(true).pub, testData.pubKey2Compressed);
    });

    it('from a compressed public key', () => {
      const keyPair = new Stacks.KeyPair({ pub: testData.pubKey2Compressed });
      should.equal(keyPair.getKeys(false).pub, testData.pubKey2);
      should.equal(keyPair.getKeys(true).pub, testData.pubKey2Compressed);
    });
  });

  describe('should fail to create a KeyPair', function() {
    it('from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      should.throws(() => new Stacks.KeyPair(seed));
    });

    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      should.throws(() => new Stacks.KeyPair(source));
    });

    it('from an invalid private key', () => {
      const source = {
        prv: '82A34E',
      };
      should.throws(() => new Stacks.KeyPair(source));
    });
  });

  describe('getAddress', function() {
    it('should get an address', () => {
      const keyPair = new Stacks.KeyPair(defaultSeed);
      const address = keyPair.getAddress();
      address.should.equal(testData.defaultSeedAddress);
    });
  });

  describe('getKeys', function() {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new Stacks.KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv!.should.equal(testData.defaultSeedSecretKey);
      pub.should.equal(testData.defaultSeedPubKey);
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new Stacks.KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });
});
