import should from 'should';
import * as nacl from 'tweetnacl';
import { KeyPair } from '../../../../src/coin/hbar';
import * as testData from '../../../resources/hbar/hbar';

const pub = testData.ACCOUNT_1.publicKey;
const prv = testData.ACCOUNT_1.privateKey;

describe('Hedera Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pub });
      should.equal(keyPair.getKeys().pub, pub);
    });

    it('from a public key with prefix', () => {
      const keyPair = new KeyPair({ pub: testData.ACCOUNT_1.publicKey });
      should.equal(keyPair.getKeys().pub, pub);
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prv });
      should.equal(keyPair.getKeys().prv!, prv);
      should.equal(keyPair.getKeys().pub, pub);
    });

    it('from a private key with prefix', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_1.privateKey });
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
      const keyPair = new KeyPair({ prv: Buffer.from(testData.privateKeyBytes).toString('hex') });
      should.equal(keyPair.getKeys().prv!, prv);
    });

    it('from a byte array public key', () => {
      const keyPair = new KeyPair({ pub: Buffer.from(testData.publicKeyBytes).toString('hex') });
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
});
