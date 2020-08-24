import should from 'should';
import * as nacl from 'tweetnacl';
import { KeyPair } from '../../../../src/coin/hbar';
import * as testData from '../../../resources/hbar/hbar';
import { toUint8Array } from '../../../../src/coin/hbar/utils';

const pub = testData.ACCOUNT_1.pubKeyWithPrefix;
const prv = testData.ACCOUNT_1.prvKeyWithPrefix;

describe('Hedera Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.toString(true).length, 64);
      should.equal(keyPair.getKeys().pub.toString(true).length, 64);
      should.equal(
        keyPair
          .getKeys()
          .prv!.toString()
          .slice(0, 32),
        testData.ed25519PrivKeyPrefix,
      );
      should.equal(
        keyPair
          .getKeys()
          .pub.toString()
          .slice(0, 24),
        testData.ed25519PubKeyPrefix,
      );
    });

    it('from a seed', () => {
      const keyPair = new KeyPair({ seed: new Buffer(toUint8Array(testData.ACCOUNT_1.prvKeyWithPrefix.slice(32))) });
      should.equal(keyPair.getKeys().prv!.toString(), testData.ACCOUNT_1.prvKeyWithPrefix);
      should.equal(keyPair.getKeys().pub.toString(), testData.ACCOUNT_1.pubKeyWithPrefix);
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pub });
      should.equal(keyPair.getKeys().pub.toString(), pub);
    });

    it('from a public key with prefix', () => {
      const keyPair = new KeyPair({ pub: testData.ACCOUNT_1.pubKeyWithPrefix });
      should.equal(keyPair.getKeys().pub.toString(), pub);
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prv });
      should.equal(keyPair.getKeys().prv!.toString(), prv);
      should.equal(keyPair.getKeys().pub.toString(), pub);
    });

    it('from a private key with prefix', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_1.prvKeyWithPrefix });
      should.equal(keyPair.getKeys().prv!.toString(), prv);
      should.equal(keyPair.getKeys().pub.toString(), pub);
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
      should.equal(keyPair.getKeys().prv!.toString(), prv);
    });

    it('from a byte array public key', () => {
      const keyPair = new KeyPair({ pub: Buffer.from(testData.ACCOUNT_1.publicKeyBytes).toString('hex') });
      should.equal(keyPair.getKeys().pub.toString(), pub);
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
});
