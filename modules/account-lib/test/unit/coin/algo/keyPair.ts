import should from 'should';
import * as testData from '../../../resources/algo/algo';

import { Algo } from '../../../../src';

describe('Algo KeyPair', function() {
  const defaultSeed = { seed: Buffer.alloc(32) };

  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new Algo.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 64);
      should.equal(keyPair.getKeys().pub.length, 64);
    });

    it('from a private key', () => {
      let keyPair = new Algo.KeyPair({ prv: testData.secretKey1 });
      should.equal(keyPair.getKeys().prv, testData.secretKey1);
      should.equal(keyPair.getKeys().pub, testData.pubKey1);

      keyPair = new Algo.KeyPair({ prv: testData.secretKey2 });
      should.equal(keyPair.getKeys().prv, testData.secretKey2);
      should.equal(keyPair.getKeys().pub, testData.pubKey2);
    });

    it('from a public key', () => {
      const keyPair = new Algo.KeyPair({ pub: testData.pubKey3 });
      should.equal(keyPair.getKeys().pub, testData.pubKey3);
    });
  });

  describe('should fail to create a KeyPair', function() {
    it('from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      should.throws(() => new Algo.KeyPair(seed));
    });

    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      should.throws(() => new Algo.KeyPair(source));
    });

    it('from an invalid private key', () => {
      const source = {
        prv: '82A34E',
      };
      should.throws(() => new Algo.KeyPair(source));
    });
  });

  describe('getAddress', function() {
    it('should get an address', () => {
      let keyPair = new Algo.KeyPair(defaultSeed);
      let address = keyPair.getAddress();
      address.should.equal(testData.defaultSeedAddress);

      keyPair = new Algo.KeyPair({ prv: testData.secretKey2 });
      address = keyPair.getAddress();
      address.should.equal(testData.address2);
    });
  });

  describe('getKeys', function() {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new Algo.KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv!.should.equal(testData.defaultSeedSecretKey);
      pub.should.equal(testData.defaultSeedPubKey);
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new Algo.KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });
});
