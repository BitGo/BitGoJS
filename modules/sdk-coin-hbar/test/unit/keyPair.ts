import assert from 'assert';
import * as should from 'should';
import * as nacl from 'tweetnacl';
import { KeyPair } from '../../src';
import * as testData from '../resources/hbar';
import { convertFromStellarPub, toUint8Array } from '../../src/lib/utils';

const pub = testData.ACCOUNT_1.pubKeyWithPrefix;
const prv = testData.ACCOUNT_1.prvKeyWithPrefix;

describe('Hedera Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    describe('from root keys', async () => {
      const rootKey = {
        prv: 'rprv68d6f1ff76f10f30f4bd21bc900d3e4ed2d0f5ba4f243080f3d12774d5cf6746:bb085bbfc58b8c12945c44a00e68816e183b7f9eca6fac9f1769dd63a981dbf3:028f2c66f941b4049cd5b7f76e43c30633e34abf3e0c7722274c536c8d6a7a85:32bfbd348ccd84e7c37552bfbb908e5aa9c4a605fcd0b5ccfad36f3bc7bc85bc',
        pub: 'rpubbb085bbfc58b8c12945c44a00e68816e183b7f9eca6fac9f1769dd63a981dbf3:028f2c66f941b4049cd5b7f76e43c30633e34abf3e0c7722274c536c8d6a7a85',
      };
      it('should create a valid KeyPair from root private', async () => {
        const newKeyPair = new KeyPair({ prv: rootKey.prv });
        const keys = newKeyPair.getKeys();
        assert.ok(keys.prv);
        assert.ok(keys.pub);
        assert.equal(keys.prv.slice(0, 32), testData.ed25519PrivKeyPrefix);
        assert.equal(keys.pub.slice(0, 24), testData.ed25519PubKeyPrefix);
        const rawKeys = newKeyPair.getKeys(true);
        assert.ok(rawKeys.prv);
        assert.ok(rawKeys.pub);
        assert.equal(rawKeys.prv.length, 64);
        assert.equal(rawKeys.pub.length, 64);
        assert.ok(rootKey.prv.includes(rawKeys.prv));
        assert.ok(rootKey.pub.includes(rawKeys.pub));
      });

      it('should create a valid KeyPair from root pub', async () => {
        const newKeyPair = new KeyPair({ pub: rootKey.pub });
        const keys = newKeyPair.getKeys();
        assert.ok(keys.pub);
        assert.equal(keys.pub.slice(0, 24), testData.ed25519PubKeyPrefix);
        const rawKeys = newKeyPair.getKeys(true);
        assert.ok(rawKeys.pub);
        assert.equal(rawKeys.pub.length, 64);
        assert.ok(rootKey.pub.includes(rawKeys.pub));
      });
    });

    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys(true).prv!.length, 64);
      should.equal(keyPair.getKeys(true).pub.length, 64);
      should.equal(keyPair.getKeys().prv!.slice(0, 32), testData.ed25519PrivKeyPrefix);
      should.equal(keyPair.getKeys().pub.slice(0, 24), testData.ed25519PubKeyPrefix);
    });

    it('from a seed', () => {
      const keyPair = new KeyPair({ seed: Buffer.from(toUint8Array(testData.ACCOUNT_1.prvKeyWithPrefix.slice(32))) });
      should.equal(keyPair.getKeys().prv!, testData.ACCOUNT_1.prvKeyWithPrefix);
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_1.pubKeyWithPrefix);
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pub });
      should.equal(keyPair.getKeys().pub, pub);
    });

    it('from a public key with prefix', () => {
      const stellarPubs = [
        'GBVEZT27ZUCMJABF76XIPPO7M3KUABVR4GZNPBAD3YTPXUSDA57ANRLD',
        'GDMQYYBRX3ZD34VHU4IJNSLASAQY6VZ7B6UJD5OFKSOW7XFJI5MZMETW',
        'GAD2SVW5EZLCH6HDC3VK7UE4DZK7KCIUHVCY2PO7ZEUERSWU6QQ6QIHB',
      ];

      stellarPubs.forEach((stellarPub) => {
        const edPub = convertFromStellarPub(stellarPub);
        const keyPair = new KeyPair({ pub: edPub });

        should.exist(keyPair.getKeys().pub);
        should.not.exist(keyPair.getKeys().prv);
      });
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prv });
      should.equal(keyPair.getKeys().prv!, prv);
      should.equal(keyPair.getKeys().pub, pub);
    });

    it('from a private key with prefix', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_1.prvKeyWithPrefix });
      should.equal(keyPair.getKeys().prv!, prv);
      should.equal(keyPair.getKeys().pub, pub);
    });

    it('from seed', () => {
      const seed = nacl.randomBytes(32);
      const keyPair = new KeyPair({ seed: Buffer.from(seed) });
      keyPair.getKeys().should.have.property('pub');
      keyPair.getKeys().should.have.property('prv');
    });

    it('without source', () => {
      const keyPair = new KeyPair();
      keyPair.getKeys().should.have.property('pub');
      keyPair.getKeys().should.have.property('prv');
    });

    it('from a byte array private key', () => {
      const keyPair = new KeyPair({ prv: Buffer.from(testData.ACCOUNT_1.privateKeyBytes).toString('hex') });
      should.equal(keyPair.getKeys().prv!, prv);
    });

    it('from a byte array public key', () => {
      const keyPair = new KeyPair({ pub: Buffer.from(testData.ACCOUNT_1.publicKeyBytes).toString('hex') });
      should.equal(keyPair.getKeys().pub, pub);
    });
  });

  describe('should fail to create a KeyPair', () => {
    it('from an invalid public key', () => {
      const source = { pub: '01D63D' };
      assert.throws(
        () => new KeyPair(source),
        (e: any) => e.message.includes(testData.errorMessageInvalidPublicKey)
      );
    });

    it('from an invalid private key', () => {
      const shorterPrv = { prv: '82A34E' };
      const longerPrv = { prv: prv + '12' };
      const prvWithPrefix = { prv: testData.ed25519PrivKeyPrefix + prv + '12' };
      const prvWithOddNumber = { prv: testData.ed25519PrivKeyPrefix + prv + '1' };
      const prvWithNonHex = { prv: testData.ed25519PrivKeyPrefix + prv + 'GG' };
      assert.throws(
        () => new KeyPair(shorterPrv),
        (e: any) => e.message === testData.errorMessageInvalidPrivateKey
      );
      assert.throws(
        () => new KeyPair(longerPrv),
        (e: any) => e.message === testData.errorMessageInvalidPrivateKey
      );
      assert.throws(
        () => new KeyPair(prvWithPrefix),
        (e: any) => e.message === testData.errorMessageInvalidPrivateKey
      );
      assert.throws(
        () => new KeyPair({ prv: prv + pub }),
        (e: any) => e.message === testData.errorMessageInvalidPrivateKey
      );
      assert.throws(
        () => new KeyPair(prvWithOddNumber),
        (e: any) => e.message === testData.errorMessageOddLengthOrNonHexPrivateKey
      );
      assert.throws(
        () => new KeyPair(prvWithNonHex),
        (e: any) => e.message === testData.errorMessageOddLengthOrNonHexPrivateKey
      );
    });
  });

  describe('should fail to get address ', () => {
    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prv });
      assert.throws(
        () => keyPair.getAddress(),
        (e: any) => e.message === testData.errorMessageNotPossibleToDeriveAddress
      );
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pub });
      assert.throws(
        () => keyPair.getAddress(),
        (e: any) => e.message === testData.errorMessageNotPossibleToDeriveAddress
      );
    });
  });

  describe('should succeed to sign and verify ', () => {
    it('a random message', () => {
      const message = 'Hello World!';
      const keyPair = new KeyPair({ prv: prv });
      const signature = keyPair.signMessage(message);
      const isValid = keyPair.verifySignature(message, signature);
      isValid.should.be.true();
    });

    it('a public key in hex format', () => {
      const keyPair = new KeyPair({ prv: prv });
      const message = keyPair.getKeys().pub;
      const signature = keyPair.signMessage(message);
      const isValid = keyPair.verifySignature(message, signature);
      isValid.should.be.true();
    });

    it('a message in hex format', () => {
      const userPub = '302a300506032b657003210012558e304e09d468d3ab07edf6f7e634adc4788cee76d6a9eb2aff9385698077';
      const message = '302a300506032b6570032100aa3de24a1df3ce6fb61c8397358985f1df517853ef01523daee5b19dc82f40d5';
      const signature = Buffer.from(
        '76ca6556fbfcc5a8b43c12ba6425c5a6c90f5033180628410b5c29f651719f58ef4c1e' +
          '78dddd5fd794c555ec38c9b9c02ea76d3eef4d8422ae7ea8363cab920c',
        'hex'
      );

      const keyPair = new KeyPair({ pub: userPub });
      const isValid = keyPair.verifySignature(message, new Uint8Array(signature));
      isValid.should.be.true();
    });

    it('an empty message', () => {
      const message = '';
      const keyPair = new KeyPair({ prv: prv });
      const signature = keyPair.signMessage(message);
      const isValid = keyPair.verifySignature(message, signature);
      isValid.should.be.true();
    });
  });

  describe('should fail sign ', () => {
    it('a message without a private key', () => {
      const message = 'Hello World!';
      const keyPair = new KeyPair({ pub: pub });
      assert.throws(
        () => keyPair.signMessage(message),
        (e: any) => e.message === testData.errorMessageMissingPrivateKey
      );
    });
  });
});
