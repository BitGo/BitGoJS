import should from 'should';
import * as testData from '../../../resources/xrp/xrp';

import { Xrp } from '../../../../src';

describe('Xrp KeyPair', function () {
  const defaultSeed = { seed: Buffer.alloc(16) };

  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new Xrp.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 66);
      should.equal(keyPair.getKeys().pub.length, 66);
    });

    it('from a private key', () => {
      const keyPair = new Xrp.KeyPair({ prv: testData.ACCOUNT_1.prv });
      should.equal(keyPair.getKeys().prv, testData.ACCOUNT_1.prv);
    });

    it('from a public key', () => {
      const keyPair = new Xrp.KeyPair({ pub: testData.ACCOUNT_1.pub });
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_1.pub);
    });

    it('from an extended private key', () => {
      const keyPair = new Xrp.KeyPair({ prv: testData.xprv1 });
      should.equal(keyPair.getExtendedKeys().xprv!, testData.xprv1);
      should.equal(keyPair.getExtendedKeys().xpub, testData.xpub1);
      should.equal(keyPair.getKeys().prv!.length, 66);
      should.equal(keyPair.getKeys().pub.length, 66);
    });

    it('from an extended public key', () => {
      const keyPair = new Xrp.KeyPair({ pub: testData.xpub1 });
      should.equal(keyPair.getExtendedKeys().xpub, testData.xpub1);
      should.equal(keyPair.getKeys().pub.length, 66);
    });
  });

  describe('should fail to create a KeyPair', function () {
    it('from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Entropy should be 128 bits (16 bytes)
      should.throws(() => new Xrp.KeyPair(seed));
    });

    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      should.throws(() => new Xrp.KeyPair(source));
    });

    it('from an invalid private key', () => {
      const source = {
        prv: '82A34E',
      };
      should.throws(() => new Xrp.KeyPair(source));
    });
  });

  describe('getKeys from seed', function () {
    it('should get private and public keys', () => {
      const keyPair = new Xrp.KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv!.should.equal(testData.defaultSeed.prv);
      pub.should.equal(testData.defaultSeed.pub);
    });
  });

  describe('getAddress from private key', function () {
    it('should get an address', () => {
      const keyPair = new Xrp.KeyPair({ prv: testData.ACCOUNT_1.prv });
      const address = keyPair.getAddress();
      address.should.equal(testData.ACCOUNT_1.address);
    });
  });

  describe('getAddress from public key', function () {
    it('should get an address', () => {
      const keyPair = new Xrp.KeyPair({ pub: testData.ACCOUNT_1.pub });
      const address = keyPair.getAddress();
      address.should.equal(testData.ACCOUNT_1.address);
    });
  });

  describe('getAddress from seed', function () {
    it('should get an address', () => {
      const keyPair = new Xrp.KeyPair(defaultSeed);
      const address = keyPair.getAddress();
      address.should.equal(testData.defaultSeed.address);
    });
  });
});
