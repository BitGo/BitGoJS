import { fromBase64, toHex } from '@cosmjs/encoding';
import assert from 'assert';
import should from 'should';

import { KeyPair } from '../../src/lib';
import { TEST_ACCOUNT, TEST_SEND_TX } from '../resources/atom';

describe('ATOM Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPairObj = new KeyPair();
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv!.length, 64);
      should.equal(keys.pub.length, 66);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
    });

    it('from a private key', () => {
      const privateKey = TEST_SEND_TX.privateKey;
      const keyPairObj = new KeyPair({ prv: toHex(fromBase64(privateKey)) });
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv, toHex(fromBase64(TEST_SEND_TX.privateKey)));
      should.equal(keys.pub, toHex(fromBase64(TEST_SEND_TX.pubKey)));
      should.equal(keyPairObj.getAddress(), TEST_SEND_TX.sender);

      assert.throws(() => keyPairObj.getExtendedKeys());
    });

    it('from a compressed public key', () => {
      const publicKey = TEST_ACCOUNT.compressedPublicKey;
      const keyPairObj = new KeyPair({ pub: publicKey });
      const keys = keyPairObj.getKeys();
      should.not.exist(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.pub, TEST_ACCOUNT.compressedPublicKey);

      assert.throws(() => keyPairObj.getExtendedKeys());
    });

    it('from an uncompressed public key', () => {
      // Input is uncompressed, but we output the compressed key to keep
      // parity with Cosmos network expectations.
      const publicKey = TEST_ACCOUNT.uncompressedPublicKey;
      const keyPairObj = new KeyPair({ pub: publicKey });
      const keys = keyPairObj.getKeys();
      should.not.exist(keys.prv);
      should.exists(keys.pub);
      should.notEqual(keys.pub, publicKey);
      should.equal(keys.pub, TEST_ACCOUNT.compressedPublicKey);

      assert.throws(() => keyPairObj.getExtendedKeys());
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

  describe('get unique address ', () => {
    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: toHex(fromBase64(TEST_SEND_TX.privateKey)) });
      should.equal(keyPair.getAddress(), TEST_SEND_TX.sender);
    });

    it('from a compressed public key', () => {
      const keyPair = new KeyPair({ pub: toHex(fromBase64(TEST_SEND_TX.pubKey)) });
      should.equal(keyPair.getAddress(), TEST_SEND_TX.sender);
    });

    it('should be different for different public keys', () => {
      const keyPairOne = new KeyPair({ pub: TEST_ACCOUNT.compressedPublicKey });
      const keyPairTwo = new KeyPair({ pub: TEST_ACCOUNT.compressedPublicKeyTwo });
      should.notEqual(keyPairOne.getAddress(), keyPairTwo.getAddress());
    });
  });
});
