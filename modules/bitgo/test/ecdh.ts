/**
 * @prettier
 */
import 'should';
import { bip32 } from '@bitgo/utxo-lib';
import * as crypto from 'crypto';
import * as utxolib from '@bitgo/utxo-lib';

import { getSharedSecret, signMessageWithDerivedEcdhKey, verifyEcdhSignature } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import * as assert from 'assert';
import { BitGo } from '../src/bitgo';

describe('ECDH utils', () => {
  function getKey(seed: string) {
    return bip32.fromSeed(crypto.createHash('sha256').update(seed).digest());
  }

  it('should calculate a new ECDH sharing secret correctly', () => {
    for (let i = 0; i < 256; i++) {
      const eckey1 = getKey(`${i}.a`);
      const eckey2 = getKey(`${i}.b`);

      assert(eckey1.privateKey);
      [eckey1, utxolib.bitgo.keyutil.privateKeyBufferToECPair(eckey1.privateKey)].forEach((privateKey) => {
        const sharingKey1 = getSharedSecret(privateKey, eckey2).toString('hex');
        const sharingKey2 = getSharedSecret(eckey2, eckey1).toString('hex');
        sharingKey1.should.equal(sharingKey2);

        switch (i) {
          case 0:
            sharingKey1.should.eql('465ffe5745325998b83fb39631347148e24d4f21b3f3b54739c264d5c42db4b8');
            break;
          case 1:
            sharingKey1.should.eql('61ff44fc1af8061a433a314b7b8be8ae352c10f62aac5887047dbaa5643b818d');
            break;
        }
      });
    }
  });

  describe('signMessageWithDerivedEcdhKey and verifyEcdhSignature', function () {
    it('signMessageWithDerivedEcdhKey and verifyEcdhSignature are able to sign/verify the same message', function () {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
      const myEcdhKeychain = bitgo.keychains().create();
      const message = {
        ntilde: 'bla',
        h1: 'bla',
      };
      const derivationPath = 'm/0/1';
      const signedMessage = signMessageWithDerivedEcdhKey(JSON.stringify(message), myEcdhKeychain.xprv, derivationPath);
      const hexEncodedSignedMessage = signedMessage.toString('hex');
      const derivedPubKey = bip32.fromBase58(myEcdhKeychain.xpub).derivePath(derivationPath).publicKey;
      const isVerify = verifyEcdhSignature(JSON.stringify(message), hexEncodedSignedMessage, derivedPubKey);
      isVerify.should.be.true();
    });
  });

  it('verifyEcdhSignature fails if the message/signature or pub key is diff than the one used for signing', function () {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const myEcdhKeychain = bitgo.keychains().create();
    const message = {
      ntilde: 'bla',
      h1: 'bla',
    };
    const derivationPath = 'm/0/1';
    let signedMessage = signMessageWithDerivedEcdhKey(JSON.stringify(message), myEcdhKeychain.xprv, derivationPath);
    const hexEncodedSignedMessage = signedMessage.toString('hex');
    let derivedPubKey = bip32.fromBase58(myEcdhKeychain.xpub).derivePath(derivationPath).publicKey;

    // wrong message
    let isVerify = verifyEcdhSignature('fake message', hexEncodedSignedMessage, derivedPubKey);
    isVerify.should.be.false();

    // bad signature
    signedMessage = signMessageWithDerivedEcdhKey('fake message', myEcdhKeychain.xprv, derivationPath);
    isVerify = verifyEcdhSignature(JSON.stringify(message), signedMessage.toString('hex'), derivedPubKey);
    isVerify.should.be.false();

    // bad public key derived at a diff. path
    derivedPubKey = bip32.fromBase58(myEcdhKeychain.xpub).derivePath('m/0/0').publicKey;
    isVerify = verifyEcdhSignature(JSON.stringify(message), signedMessage.toString('hex'), derivedPubKey);
    isVerify.should.be.false();
  });
});
