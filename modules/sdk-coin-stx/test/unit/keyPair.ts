import assert from 'assert';
import should from 'should';
import * as testData from './resources';

import { StxLib } from '../../src';
import { TransactionVersion } from '@stacks/transactions';

describe('Stx KeyPair', function () {
  const defaultSeed = { seed: Buffer.alloc(64) };

  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new StxLib.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 64);
      should.equal(keyPair.getKeys().pub.length, 130);
    });

    it('from a private key', () => {
      const keyPair = new StxLib.KeyPair({ prv: testData.secretKey1 });
      should.equal(keyPair.getKeys().prv, testData.secretKey1);
    });

    it('from an uncompressed public key', () => {
      const keyPair = new StxLib.KeyPair({ pub: testData.pubKey2 });
      should.equal(keyPair.getKeys(false).pub, testData.pubKey2);
      should.equal(keyPair.getKeys(true).pub, testData.pubKey2Compressed);
    });

    it('from a compressed public key', () => {
      const keyPair = new StxLib.KeyPair({ pub: testData.pubKey2Compressed });
      should.equal(keyPair.getKeys(false).pub, testData.pubKey2);
      should.equal(keyPair.getKeys(true).pub, testData.pubKey2Compressed);
    });

    it('from an extended private key', () => {
      const keyPair = new StxLib.KeyPair({ prv: testData.xprv1 });
      should.equal(keyPair.getExtendedKeys().xpub, testData.xpub1);
      should.equal(keyPair.getKeys(false).prv!, testData.xprv1Protocol);
      should.equal(keyPair.getKeys(false).pub.length, 130);
    });

    it('from an extended public key', () => {
      const keyPair = new StxLib.KeyPair({ pub: testData.xpub1 });
      should.equal(keyPair.getExtendedKeys().xpub, testData.xpub1);
      should.equal(keyPair.getKeys(false).pub, testData.xpub1Protocol);
      should.equal(keyPair.getKeys(true).pub, testData.xpub1ProtocolCompressed);
      should.equal(keyPair.getKeys(false).pub.length, 130);
    });
  });

  describe('should fail to create a KeyPair', function () {
    it('from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      assert.throws(() => new StxLib.KeyPair(seed));
    });

    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      assert.throws(() => new StxLib.KeyPair(source));
    });

    it('from an invalid private key', () => {
      const source = {
        prv: '82A34E',
      };
      assert.throws(() => new StxLib.KeyPair(source));
    });
  });

  describe('getAddress', function () {
    it('should get an address', () => {
      const keyPair = new StxLib.KeyPair(defaultSeed);
      const address = keyPair.getAddress();
      address.should.equal(testData.defaultSeedAddressUncompressedMainnet);
    });
  });

  describe('getSTXAddress', function () {
    it('should get an uncompressed stacks address for the mainnet', () => {
      const keyPair = new StxLib.KeyPair(defaultSeed);
      const address = keyPair.getSTXAddress();
      address.should.equal(testData.defaultSeedAddressUncompressedMainnet);
    });

    it('should get an compressed stacks address for the mainnet', () => {
      const keyPair = new StxLib.KeyPair(defaultSeed);
      const address = keyPair.getSTXAddress(true);
      address.should.equal(testData.defaultSeedAddressCompressedMainnet);
    });

    it('should get an uncompressed stacks address for the testnet', () => {
      const keyPair = new StxLib.KeyPair(defaultSeed);
      const address = keyPair.getSTXAddress(false, TransactionVersion.Testnet);
      address.should.equal(testData.defaultSeedAddressUncompressedTestnet);
    });

    it('should get an compressed stacks address for the mainnet', () => {
      const keyPair = new StxLib.KeyPair(defaultSeed);
      const address = keyPair.getSTXAddress(true, TransactionVersion.Testnet);
      address.should.equal(testData.defaultSeedAddressCompressedTestnet);
    });
  });

  describe('getKeys', function () {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new StxLib.KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv!.should.equal(testData.defaultSeedSecretKey);
      pub.should.equal(testData.defaultSeedPubKey);
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new StxLib.KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });
});
