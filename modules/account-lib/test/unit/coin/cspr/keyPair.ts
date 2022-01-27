import should from 'should';
import * as nacl from 'tweetnacl';
import { KeyPair } from '../../../../src/coin/cspr';
import * as testData from '../../../resources/cspr/cspr';

const xPubKey = testData.ACCOUNT_FROM_SEED.xPublicKey;
const xPrvKey = testData.ACCOUNT_FROM_SEED.xPrivateKey;
const pubKey = testData.ACCOUNT_FROM_SEED.publicKey;
const prvKey = testData.ACCOUNT_FROM_SEED.privateKey;
const accountSeed = testData.ACCOUNT_FROM_SEED.seed;

describe('Casper Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv?.length, 64);
      should.equal(keyPair.getKeys().pub.length, 66);
    });

    it('from a seed', () => {
      const keyPair = new KeyPair({ seed: Buffer.from(accountSeed) });
      should.equal(keyPair.getKeys().prv, prvKey);
      should.equal(keyPair.getKeys().pub, pubKey);
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pubKey });
      should.equal(keyPair.getKeys().pub, pubKey);
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prvKey });
      should.equal(keyPair.getKeys().prv, prvKey);
      should.equal(keyPair.getKeys().pub, pubKey);
    });

    it('from an xpub', () => {
      const keyPair = new KeyPair({ pub: xPubKey });
      const keys = keyPair.getKeys();
      should.not.exist(keys.prv);
      should.equal(keys.pub, pubKey);

      const extendedKeys = keyPair.getExtendedKeys();
      should.not.exist(extendedKeys.xprv);
      should.equal(extendedKeys.xpub, xPubKey);
    });

    it('from an xprv', () => {
      const keyPair = new KeyPair({ prv: xPrvKey });
      const keys = keyPair.getKeys();
      should.equal(keys.prv, prvKey);
      should.equal(keys.pub, pubKey);

      const extendedKeys = keyPair.getExtendedKeys();
      should.equal(extendedKeys.xprv, xPrvKey);
      should.equal(extendedKeys.xpub, xPubKey);
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
  });

  describe('should get address ', () => {
    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prvKey });
      should.equal(keyPair.getAddress(), '02' + keyPair.getKeys().pub);
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pubKey });
      should.equal(keyPair.getAddress(), '02' + keyPair.getKeys().pub);
    });

    it('should get an address from xpub', () => {
      const keyPair = new KeyPair({ pub: xPubKey });
      should.equal(keyPair.getAddress(), '02' + keyPair.getKeys().pub);
    });

    it('should get an address from prv', () => {
      const keyPair = new KeyPair({ prv: xPrvKey });
      should.equal(keyPair.getAddress(), '02' + keyPair.getKeys().pub);
    });

    it('from a seed', () => {
      const keyPair = new KeyPair({ seed: Buffer.from(accountSeed) });
      should.equal(keyPair.getAddress(), '02' + keyPair.getKeys().pub);
    });
  });

  describe('getExtendedKeys', function () {
    it('should get the keys in extended format from xprv', () => {
      const keyPair = new KeyPair({ prv: xPrvKey });
      const { xprv: calculatedXprv, xpub: calculatedXpub } = keyPair.getExtendedKeys();
      calculatedXprv?.should.equal(xPrvKey);
      calculatedXpub.should.equal(xPubKey);
    });

    it('should get the keys in extended format from xpub', () => {
      const keyPair = new KeyPair({ pub: xPubKey });
      const { xprv: calculatedXprv, xpub: calculatedXpub } = keyPair.getExtendedKeys();
      should.not.exist(calculatedXprv);
      calculatedXpub.should.equal(xPubKey);
    });

    it('should not be able to get keys from prv', () => {
      const keyPair = new KeyPair({ prv: prvKey });
      should.throws(() => keyPair.getExtendedKeys());
    });

    it('should get the keys in extended format from pub', () => {
      const keyPair = new KeyPair({ pub: pubKey });
      should.throws(() => keyPair.getExtendedKeys());
    });
  });

  describe('should fail to create a KeyPair', () => {
    it('from an invalid public key', () => {
      should.throws(
        () => new KeyPair({ pub: testData.INVALID_SHORT_KEYPAIR_KEY }),
        (e) => e.message.includes(testData.INVALID_PUBLIC_KEY_ERROR_MESSAGE),
      );
    });

    it('from an invalid private key', () => {
      should.throws(
        () => new KeyPair({ prv: testData.INVALID_SHORT_KEYPAIR_KEY }),
        (e) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE,
      );
      should.throws(
        () => {
          new KeyPair({ prv: testData.INVALID_LONG_KEYPAIR_PRV });
        },
        (e) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE,
      );
      should.throws(
        () => new KeyPair({ prv: prvKey + pubKey }),
        (e) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE,
      );
    });
  });
});
