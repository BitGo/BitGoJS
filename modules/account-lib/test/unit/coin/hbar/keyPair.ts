import should from 'should';
import * as nacl from 'tweetnacl';
import { KeyPair } from '../../../../src/coin/hbar';
import * as testData from '../../../resources/hbar/hbar';
import { convertFromStellarPub, toUint8Array } from '../../../../src/coin/hbar/utils';

const pub = testData.ACCOUNT_1.pubKeyWithPrefix;
const prv = testData.ACCOUNT_1.prvKeyWithPrefix;

describe('Hedera Key Pair', () => {
  describe('should create a valid KeyPair', () => {
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

      stellarPubs.forEach(stellarPub => {
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
      should.throws(
        () => new KeyPair(source),
        e => e.message.includes(testData.errorMessageInvalidPublicKey),
      );
    });

    it('from an invalid private key', () => {
      const shorterPrv = { prv: '82A34E' };
      const longerPrv = { prv: prv + '1' };
      const prvWithPrefix = { prv: testData.ed25519PrivKeyPrefix + prv + '1' };
      should.throws(
        () => new KeyPair(shorterPrv),
        e => e.message === testData.errorMessageInvalidPrivateKey,
      );
      should.throws(
        () => new KeyPair(longerPrv),
        e => e.message === testData.errorMessageInvalidPrivateKey,
      );
      should.throws(
        () => new KeyPair(prvWithPrefix),
        e => e.message === testData.errorMessageInvalidPrivateKey,
      );
      should.throws(
        () => new KeyPair({ prv: prv + pub }),
        e => e.message === testData.errorMessageInvalidPrivateKey,
      );
    });
  });

  describe('should fail to get address ', () => {
    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prv });
      should.throws(
        () => keyPair.getAddress(),
        e => e.message === testData.errorMessageNotPossibleToDeriveAddress,
      );
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pub });
      should.throws(
        () => keyPair.getAddress(),
        e => e.message === testData.errorMessageNotPossibleToDeriveAddress,
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
      should.throws(
        () => keyPair.signMessage(message),
        e => e.message === testData.errorMessageMissingPrivateKey,
      );
    });
  });
});
