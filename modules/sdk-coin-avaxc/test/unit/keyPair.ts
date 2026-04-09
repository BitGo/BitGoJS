import assert from 'assert';
import should from 'should';
import { KeyPair } from '../../src';
import { TEST_ACCOUNT } from '../resources/avaxc';

describe('Avax Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPairObj = new KeyPair();
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv!.length, 64);
      should.equal(keys.pub.length, 130);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
    });

    it('from a seed', () => {
      const seed = TEST_ACCOUNT.seed;
      const keyPairObj = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv!, TEST_ACCOUNT.ethPrivateKey);
      should.equal(keys.pub, TEST_ACCOUNT.ethUncompressedPublicKey);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
      should.equal(extendedKeys.xprv, TEST_ACCOUNT.ethExtendedPrivateKey);
      should.equal(extendedKeys.xpub, TEST_ACCOUNT.ethExtendedPublicKey);
    });

    it('from a private key', () => {
      const privateKey = TEST_ACCOUNT.ethPrivateKey;
      const keyPairObj = new KeyPair({ prv: privateKey });
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv, TEST_ACCOUNT.ethPrivateKey);
      should.equal(keys.pub, TEST_ACCOUNT.ethUncompressedPublicKey);

      assert.throws(() => keyPairObj.getExtendedKeys());
    });

    it('from a compressed public key', () => {
      const publickKey = TEST_ACCOUNT.ethCompressedPublicKey;
      const keyPairObj = new KeyPair({ pub: publickKey });
      const keys = keyPairObj.getKeys();
      should.not.exist(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.pub, TEST_ACCOUNT.ethUncompressedPublicKey);

      assert.throws(() => keyPairObj.getExtendedKeys());
    });

    it('from an uncompressed public key', () => {
      const publickKey = TEST_ACCOUNT.ethUncompressedPublicKey;
      const keyPairObj = new KeyPair({ pub: publickKey });
      const keys = keyPairObj.getKeys();
      should.not.exist(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.pub, TEST_ACCOUNT.ethUncompressedPublicKey);

      assert.throws(() => keyPairObj.getExtendedKeys());
    });

    it('from an extended private key', () => {
      const extendedPrivateKey = TEST_ACCOUNT.ethExtendedPrivateKey;
      const keyPairObj = new KeyPair({ prv: extendedPrivateKey });
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv, TEST_ACCOUNT.ethPrivateKey);
      should.equal(keys.pub, TEST_ACCOUNT.ethUncompressedPublicKey);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
      should.equal(extendedKeys.xprv, TEST_ACCOUNT.ethExtendedPrivateKey);
      should.equal(extendedKeys.xpub, TEST_ACCOUNT.ethExtendedPublicKey);
    });

    it('from an extended public key', () => {
      const extendedPublicKey = TEST_ACCOUNT.ethExtendedPublicKey;
      const keyPairObj = new KeyPair({ pub: extendedPublicKey });
      const keys = keyPairObj.getKeys();
      should.not.exist(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.pub, TEST_ACCOUNT.ethUncompressedPublicKey);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.not.exist(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
      should.equal(extendedKeys.xpub, TEST_ACCOUNT.ethExtendedPublicKey);
    });
  });

  describe('should fail to create a KeyPair', () => {
    it('from an invalid privateKey', () => {
      assert.throws(
        () => new KeyPair({ prv: '' }),
        (e: any) => e.message === 'Unsupported private key'
      );
    });

    it('from an invalid publicKey', () => {
      assert.throws(
        () => new KeyPair({ pub: '' }),
        (e: any) => e.message.startsWith('Unsupported public key')
      );
    });

    it('from an undefined seed', () => {
      const undefinedBuffer = undefined as unknown as Buffer;
      assert.throws(
        () => new KeyPair({ seed: undefinedBuffer }),
        (e: any) => e.message.startsWith('Invalid key pair options')
      );
    });

    it('from an undefined private key', () => {
      const undefinedStr: string = undefined as unknown as string;
      assert.throws(
        () => new KeyPair({ prv: undefinedStr }),
        (e: any) => e.message.startsWith('Invalid key pair options')
      );
    });

    it('from an undefined public key', () => {
      const undefinedStr: string = undefined as unknown as string;
      assert.throws(
        () => new KeyPair({ pub: undefinedStr }),
        (e: any) => e.message.startsWith('Invalid key pair options')
      );
    });
  });

  describe('should get address ', () => {
    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT.ethPrivateKey });
      should.equal(keyPair.getAddress(), TEST_ACCOUNT.ethAddress);
    });

    it('from a compressed public key', () => {
      const keyPair = new KeyPair({ pub: TEST_ACCOUNT.ethCompressedPublicKey });
      should.equal(keyPair.getAddress(), TEST_ACCOUNT.ethAddress);
    });

    it('from an uncompressed public key', () => {
      const keyPair = new KeyPair({ pub: TEST_ACCOUNT.ethUncompressedPublicKey });
      should.equal(keyPair.getAddress(), TEST_ACCOUNT.ethAddress);
    });

    it('should get an address from an extended public key', () => {
      const keyPair = new KeyPair({ pub: TEST_ACCOUNT.ethExtendedPublicKey });
      should.equal(keyPair.getAddress(), TEST_ACCOUNT.ethAddress);
    });

    it('should get an address from an extended private key', () => {
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT.ethExtendedPrivateKey });
      should.equal(keyPair.getAddress(), TEST_ACCOUNT.ethAddress);
    });
  });
});
