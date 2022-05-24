import should from 'should';
import { KeyPair } from '../../../../src/coin/avaxp';
import * as testData from './resources/avaxp';
import { ACCOUNT_1, SEED_ACCOUNT } from './resources/avaxp';
const pubKey = testData.ACCOUNT_1.pubkey;
const prvKey = testData.ACCOUNT_1.privkey;

describe('Avax P Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      console.log('private ' + keyPair.getKeys().prv);
      console.log('public ' + keyPair.getKeys().pub);
      console.log('address ' + keyPair.getAddress());
      should.equal(keyPair.getKeys().prv?.length, 64);
      should.equal(keyPair.getKeys().pub.length, 66);
    });

    it('from a seed', () => {
      const seed = SEED_ACCOUNT.seed;
      const keyPairObj = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv!, SEED_ACCOUNT.privateKey);
      should.equal(keys.pub, SEED_ACCOUNT.publicKey);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
      should.equal(extendedKeys.xprv, SEED_ACCOUNT.xPrivateKey);
      should.equal(extendedKeys.xpub, SEED_ACCOUNT.xPublicKey);
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pubKey });
      should.equal(keyPair.getKeys().pub, pubKey);
      should.exists(keyPair.getAddress());
      // should.equal(keyPair.getKeys().prv, prvKey);
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prvKey });
      should.equal(keyPair.getKeys().prv, prvKey);
      should.equal(keyPair.getKeys().pub, pubKey);
      should.exists(keyPair.getAddress());
    });

    describe('getAddress', function () {
      it('should get an address', () => {
        const seed = SEED_ACCOUNT.seed;
        const keyPair = new KeyPair({ seed: Buffer.from(seed, 'hex') });
        const address = keyPair.getAddress();
        address.should.equal(SEED_ACCOUNT.address);
      });
    });

    it('without source', () => {
      const keyPair = new KeyPair();
      keyPair.getKeys().should.have.property('pub');
      keyPair.getKeys().should.have.property('prv');
    });
  });

  describe('should fail to create a KeyPair', () => {
    it('from an invalid public key', () => {
      should.throws(
        () => new KeyPair({ pub: testData.INVALID_SHORT_KEYPAIR_KEY }),
        (e) => e.message === testData.INVALID_PUBLIC_KEY_ERROR_MESSAGE,
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

  describe('verifyAddress', function () {
    it('should get and match address', () => {
      const seed = SEED_ACCOUNT.seed;
      const keyPair = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const address = keyPair.getAddress();
      address.should.equal(SEED_ACCOUNT.address);

      const prv = ACCOUNT_1.privkey;
      const keyPair2 = new KeyPair({ prv: prv });
      const address2 = keyPair2.getAddress();
      address2.should.equal(ACCOUNT_1.address);
    });
  });
});
