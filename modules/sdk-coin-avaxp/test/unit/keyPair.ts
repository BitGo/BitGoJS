import assert from 'assert';
import should from 'should';
import { KeyPair, testnet } from '../../src/keyPair';
import * as testData from '../resources/avaxp';
// import { ACCOUNT_1, SEED_ACCOUNT } from '../resources/avaxp';

const pubKey = testData.ACCOUNT_1.pubkey;
const prvKey = testData.ACCOUNT_1.privkey;
const prvKey_cb58 = testData.ACCOUNT_1.privkey_cb58;

describe('Avax P Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv?.length, 64);
      should.equal(keyPair.getKeys().pub.length, 66);
    });

    it('from a seed', () => {
      const seed = testData.SEED_ACCOUNT.seed;
      const keyPairObj = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv!, testData.SEED_ACCOUNT.privateKey);
      should.equal(keys.pub, testData.SEED_ACCOUNT.publicKey);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
      should.equal(extendedKeys.xprv, testData.SEED_ACCOUNT.xPrivateKey);
      should.equal(extendedKeys.xpub, testData.SEED_ACCOUNT.xPublicKey);
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: pubKey });
      should.equal(keyPair.getKeys().pub, pubKey);
      should.exists(keyPair.getAddress());
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: prvKey });
      should.equal(keyPair.getKeys().prv, prvKey_cb58);
      should.equal(keyPair.getKeys().pub, pubKey);
      should.exists(keyPair.getAddress());
    });

    describe('getAddress', function () {
      it('should get an address', () => {
        const seed = testData.SEED_ACCOUNT.seed;
        const keyPair = new KeyPair({ seed: Buffer.from(seed, 'hex') });
        const address = keyPair.getAddress();
        address.should.equal(testData.SEED_ACCOUNT.addressMainnetWithoutPrefix);
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
      assert.throws(
        () => new KeyPair({ pub: testData.INVALID_SHORT_KEYPAIR_KEY }),
        (e) => e.message === testData.INVALID_PUBLIC_KEY_ERROR_MESSAGE
      );
    });

    it('from an invalid private key', () => {
      assert.throws(
        () => new KeyPair({ prv: testData.INVALID_SHORT_KEYPAIR_KEY }),
        (e) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE
      );
      assert.throws(
        () => {
          new KeyPair({ prv: testData.INVALID_LONG_KEYPAIR_PRV });
        },
        (e) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE
      );
      assert.throws(
        () => new KeyPair({ prv: prvKey + pubKey }),
        (e) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE
      );
    });
  });

  describe('verifyAddress', function () {
    it('should get and match mainnet address', () => {
      const seed = testData.SEED_ACCOUNT.seed;
      const keyPair = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const address = keyPair.getAddress();
      address.should.equal(testData.SEED_ACCOUNT.addressMainnetWithoutPrefix);

      const prv = testData.ACCOUNT_1.privkey;
      const keyPair2 = new KeyPair({ prv: prv });
      const address2 = keyPair2.getAddress();
      address2.should.equal(testData.ACCOUNT_1.addressMainnetWithoutPrefix);
    });

    it('should get and match testnet address', () => {
      const seed = testData.SEED_ACCOUNT.seed;
      const keyPair = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const address = keyPair.getAvaxPAddress(testnet);
      address.should.equal(testData.SEED_ACCOUNT.addressTestnetWithoutPrefix);

      const prv = testData.ACCOUNT_1.privkey;
      const keyPair2 = new KeyPair({ prv: prv });
      const address2 = keyPair2.getAvaxPAddress(testnet);
      address2.should.equal(testData.ACCOUNT_1.addressTestnetWithoutPrefix);
    });
  });
});
