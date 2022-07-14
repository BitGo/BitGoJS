import assert from 'assert';
import should from 'should';
import * as stellar from 'stellar-sdk';
import * as Utils from '../../src/lib/utils';
import * as testData from '../resources/hbar';
import { isValidEd25519PublicKey } from '@bitgo/sdk-core';

describe('HBAR util library', function () {
  describe('address', function () {
    it('should validate addresses', function () {
      const validAddresses = ['0', '0.0.0', '99.99.99', '0.0.41098'];

      for (const address of validAddresses) {
        Utils.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function () {
      const invalidAddresses = ['0.0', '0.0.0.0', 'abc', 'a.b.c', '', '0x23C3E227BE97281A70A549c7dDB8d5Caad3E7C84'];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        Utils.isValidAddress(address).should.be.false();
      }
    });
  });

  describe('transaction id', function () {
    it('should validate tx ids', function () {
      const validHashes = ['0.0.14621@1595374723.356981689'];

      for (const hash of validHashes) {
        Utils.isValidTransactionId(hash).should.be.true();
      }
    });

    it('should fail to validate invalid tx ids', function () {
      const invalidHashes = ['0.0.14621', 'invalid', ''];

      for (const hash of invalidHashes) {
        Utils.isValidTransactionId(hash).should.be.false();
      }
    });
  });

  describe('transaction timestamp', function () {
    it('should validate tx timestamps', function () {
      const validTimestamps = ['1595374723.356981689', '1595374723'];

      for (const timestamp of validTimestamps) {
        Utils.isValidTimeString(timestamp).should.be.true();
      }
    });

    it('should fail to validate invalid tx timestamp', function () {
      const invalidTimestamp = ['0.0.14621', 'invalid', ''];

      for (const timestamp of invalidTimestamp) {
        Utils.isValidTimeString(timestamp).should.be.false();
      }
    });
  });

  describe('should remove prefix', function () {
    it('from a private key', function () {
      const rawPrivateKey = Utils.removePrefix(testData.ed25519PrivKeyPrefix, testData.ACCOUNT_1.prvKeyWithPrefix);
      should.deepEqual(rawPrivateKey, '62b0b669de0ab5e91b4328e1431859a5ca47e7426e701019272f5c2d52825b01');
    });

    it('from a public key', function () {
      const rawPublicKey = Utils.removePrefix(testData.ed25519PubKeyPrefix, testData.ACCOUNT_1.pubKeyWithPrefix);
      should.deepEqual(rawPublicKey, '5a9111b5e6881ff20b9243a42ac1a9a67fa16cd4f01e58bab30c1fe611ea8cf9');
    });
  });

  describe('should convert a stellar pub', function () {
    it('and get back a valid ed pub', function () {
      const stellarPub = 'GBVEZT27ZUCMJABF76XIPPO7M3KUABVR4GZNPBAD3YTPXUSDA57ANRLD';
      const newPub = Utils.convertFromStellarPub(stellarPub);
      should.equal(isValidEd25519PublicKey(newPub), true);
    });

    it('and get back a specific ed pub', function () {
      const stellarPub = 'GBVEZT27ZUCMJABF76XIPPO7M3KUABVR4GZNPBAD3YTPXUSDA57ANRLD';
      const newPub = Utils.convertFromStellarPub(stellarPub);
      newPub.should.equal('6a4ccf5fcd04c48025ffae87bddf66d54006b1e1b2d78403de26fbd243077e06');
    });

    it('and create a valid ed pub that can be transformed back into a stellar pub', function () {
      const stellarPub = 'GBVEZT27ZUCMJABF76XIPPO7M3KUABVR4GZNPBAD3YTPXUSDA57ANRLD';

      const newPub = Utils.convertFromStellarPub(stellarPub);
      const stellarDecoded = stellar.StrKey.encodeEd25519PublicKey(Buffer.from(newPub, 'hex'));
      const beginStellarKeyPair = stellar.Keypair.fromPublicKey(stellarPub);
      const endStellarKeyPair = stellar.Keypair.fromPublicKey(stellarDecoded);

      should.equal(beginStellarKeyPair.publicKey(), endStellarKeyPair.publicKey());
    });
  });

  describe('should return the same key', function () {
    it('from a private key without the prefix', function () {
      const rawPrivateKey = Utils.removePrefix(testData.ed25519PrivKeyPrefix, testData.ACCOUNT_2.privateKey);
      should.deepEqual(rawPrivateKey, testData.ACCOUNT_2.privateKey);
    });

    it('from a public key without the prefix', function () {
      const rawPublicKey = Utils.removePrefix(testData.ed25519PubKeyPrefix, testData.ACCOUNT_2.publicKey);
      should.deepEqual(rawPublicKey, testData.ACCOUNT_2.publicKey);
    });

    it('from a public key with chars of prefix in the middle', function () {
      const publicKey = '592a4fbb7263c59d450e651d' + testData.ed25519PubKeyPrefix + 'f96620dc9208ee7c';
      const rawPublicKey = Utils.removePrefix(testData.ed25519PubKeyPrefix, publicKey);
      should.deepEqual(rawPublicKey, publicKey);
    });

    it('from a private key with chars of prefix in the middle', function () {
      const privateKey = '5bb72603f237c099' + testData.ed25519PrivKeyPrefix + '3f7973d37fdade3c';
      const rawPrivateKey = Utils.removePrefix(testData.ed25519PrivKeyPrefix, privateKey);
      should.deepEqual(rawPrivateKey, privateKey);
    });
  });

  describe('getAddressDetails', function () {
    it('should get memoId and address', async function () {
      const addr = '0.0.41098?memoId=23233';
      const details = Utils.getAddressDetails(addr);

      details.address.should.equal('0.0.41098');
      details.memoId?.should.equal('23233');
    });

    it('should throw when memoId=null', async function () {
      const addr = '0.0.41098?memoId=';
      assert.throws(() => Utils.getAddressDetails(addr), /invalid address: '0.0.41098\?memoId=', memoId is not valid/);
    });

    it('should get memoId and address when no memoId', async function () {
      const addr = '0.0.41098';
      const details = Utils.getAddressDetails(addr);

      details.address.should.equal('0.0.41098');
      details.memoId?.should.equal(undefined);
    });
  });

  describe('normalizeAddress', function () {
    it('should build without a memoId if its missing for an address', async function () {
      const address = '0.0.41098';
      let memoId: string | undefined = undefined;
      let norm = Utils.normalizeAddress({ address, memoId });
      norm.should.equal('0.0.41098');
      memoId = '';
      norm = Utils.normalizeAddress({ address, memoId });
      norm.should.equal('0.0.41098');
    });
  });

  describe('getBaseAddress', function () {
    it('should return the base address', async function () {
      const addressWithMemo = '0.0.41098?memoId=1';
      const baseAddress = '0.0.41098';
      Utils.getBaseAddress(addressWithMemo).should.equal(baseAddress);
      Utils.getBaseAddress(baseAddress).should.equal(baseAddress);
    });
  });

  describe('isSameBaseAddress', function () {
    it('should validate if base address match', async function () {
      const address = '0.0.41098?memoId=1';
      const baseAddress = '0.0.41098';
      Utils.isSameBaseAddress(address, baseAddress).should.true();

      const address2 = '0.0.41098';
      const baseAddress2 = '0.0.41098';
      Utils.isSameBaseAddress(address2, baseAddress2).should.true();

      const address3 = '0.0.41099?memoId=1';
      const baseAddress3 = '0.0.41098';
      Utils.isSameBaseAddress(address3, baseAddress3).should.false();

      const address4 = '0.0.41099';
      const baseAddress4 = '0.0.41098';
      Utils.isSameBaseAddress(address4, baseAddress4).should.false();

      const address5 = '0.0.0.0';
      const baseAddress5 = '0.0.41098';
      assert.throws(
        () => Utils.isSameBaseAddress(address5, baseAddress5).should.false(),
        new RegExp(`invalid address: ${address5}`)
      );
    });
  });

  describe('isValidMemoId', function () {
    it('should validate memoId', async function () {
      const memo1 = 'testmemo';
      Utils.isValidMemo(memo1).should.true();
      const memo2 = '';
      Utils.isValidMemo(memo2).should.false();
      const memo3 = undefined;
      // @ts-expect-error testing for error
      Utils.isValidMemo(memo3).should.false();
      const memo4 =
        'memoooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo';
      Utils.isValidMemo(memo4).should.false();
    });
  });

  describe('isValidAddressWithPaymentId', function () {
    it('should validate addresses with and without payment id', function () {
      const validAddresses = ['0', '0.0.0', '99.99.99', '0.0.41098', '0.0.41098?memoId=4'];

      for (const address of validAddresses) {
        Utils.isValidAddressWithPaymentId(address).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function () {
      const invalidAddresses = [
        '0.0.41098?memoId=memooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo',
        '0.0.41098?memoId=',
        '0.0',
        '0.0.0.0',
        'abc',
        'a.b.c',
        '',
        '0x23C3E227BE97281A70A549c7dDB8d5Caad3E7C84',
      ];

      for (const address of invalidAddresses) {
        Utils.isValidAddressWithPaymentId(address).should.be.false();
      }
    });
  });
});
