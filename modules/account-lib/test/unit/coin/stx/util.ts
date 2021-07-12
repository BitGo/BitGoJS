import should from 'should';
import { AddressVersion } from '@stacks/transactions';
import * as testData from '../../../resources/stx/stx';
import * as Utils from '../../../../src/coin/stx/utils';
import { Stx } from '../../../../src';

describe('Stx util library', function() {
  describe('address', function() {
    it('should validate addresses', function() {
      const validAddresses = [
        'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
        'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y',
        'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
        'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
      ];

      for (const address of validAddresses) {
        Utils.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function() {
      const invalidAddresses = [
        'SP244HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
        'ST1T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
        '',
        'abc',
      ];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        Utils.isValidAddress(address).should.be.false();
      }
    });

    it('should generate multisig addresses from compressed public keys', function() {
      const pubKeys = [
        '0263e1f2f322fb74224e210f9d616fce14d10fa89520dcde3d6d02514cdb16846a',
        '02d5de9e1b9c13fc7b67446ebcff4fbb9aa6b1933f907e9aabf32f48d6e0a5064d',
        '0296c4b8353c4a938173f80706df480cf6f85523b428d59ee81d9effcf61e5eae8',
      ];

      const address = Utils.getSTXAddressFromPubKeys(pubKeys);

      address.address.should.equal('SM30NCRDKC2C3Q5RQ7RE6YK6A550JJPZJCP094ZQX');
      address.hash160.should.equal('c15661b360983b97173e1c6f4cca2941295bf265');

      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.TestnetMultiSig).address.should.equal(
        'SN30NCRDKC2C3Q5RQ7RE6YK6A550JJPZJCMHHRC3D',
      );
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.MainnetMultiSig).address.should.equal(
        'SM30NCRDKC2C3Q5RQ7RE6YK6A550JJPZJCP094ZQX',
      );
    });

    it('should generate multisig addresses from uncompressed public keys', function() {
      const pubKeys = [
        '049742b908579ffd225d5e1d9486471f19a101dd04b7a81d11da882e7ac7f3e042989c311524a3335e15dec9338a07bd21b6e4444b6b7744d314cc926a1f0383db',
        '0464097ccbc22905ec6f678c846346294033e11a216d133abf6af252294695b3538d65f65b188b6e72e1890e7738f9e221944e618dea1178ef749717b35492de6a',
        '042c608408352ab41477ad9dd1cabca9e712de2dff3c5c8bfa4b5f7f1a0f74a32402a826d2ce5f3a6b01c16aeebdd304e235791958bbf97a08b5d4e9dd4db399b7',
      ];

      Utils.getSTXAddressFromPubKeys(pubKeys).address.should.equal('SM2G611SJ5X59SMZTB6APDAFMN8JM2CDNSA0CVBHH');
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.TestnetMultiSig).address.should.equal(
        'SN2G611SJ5X59SMZTB6APDAFMN8JM2CDNSBHW10HX',
      );
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.MainnetMultiSig).address.should.equal(
        'SM2G611SJ5X59SMZTB6APDAFMN8JM2CDNSA0CVBHH',
      );
    });

    it('should generate multisig addresses from compressed and uncompressed public keys', function() {
      const pubKeys = [
        '04d6f0f7d97a72979596a17fa2946eaeff3703250a62640271eea59477f5b19f39ad01ce2a53025eba365a4f40dd085234194d1d06aefec2a9d4439be0f3c2df34',
        '02f6d0597fb6d5467203d080e17f7b4f767ead59fc303b7d7261a832cb44305bb0',
        '034c80f991410082824aee4ca48147082997d44e800da9877e694f9cb64b3cb64a',
      ];

      Utils.getSTXAddressFromPubKeys(pubKeys).address.should.equal('SM3TNQA9N6J72TCWECS7E2AK7MCNE1ZWFVJEVCSST');
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.TestnetMultiSig).address.should.equal(
        'SN3TNQA9N6J72TCWECS7E2AK7MCNE1ZWFVH2K9ZYJ',
      );
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.MainnetMultiSig).address.should.equal(
        'SM3TNQA9N6J72TCWECS7E2AK7MCNE1ZWFVJEVCSST',
      );
    });

    it('should not generate multisig addresses from invalid input', function() {
      should.throws(() => Utils.getSTXAddressFromPubKeys([]), 'Invalid number of public keys');
      should.throws(() => Utils.getSTXAddressFromPubKeys(['badkey', 'badkey2']), 'Invalid public key');
      should.throws(
        () =>
          Utils.getSTXAddressFromPubKeys([
            '02f6d0597fb6d5467203d080e17f7b4f767ead59fc303b7d7261a832cb44305bb0',
            'badkey',
          ]),
        'Invalid public key',
      );
    });
  });

  describe('amount', function() {
    it('valid amount', function() {
      Utils.isValidAmount('10').should.be.true();
    });

    it('invalid amount', function() {
      Utils.isValidAmount('-10').should.be.false();
    });
  });

  describe('private key', function() {
    it('should validate proper keys', function() {
      const keys = [testData.secretKey1, testData.secretKey2, testData.ACCOUNT_1.prv];

      for (const key of keys) {
        Utils.isValidPrivateKey(key).should.be.true();
      }
    });

    it('should not validate invalid keys', function() {
      const keys = [
        '66c88648116b721bb2f394e0007f9d348ea08017b6e604de51a3a7d957d5852409',
        '688648116b721bb2f394e0007f9d348ea08017b6e604de51a3a7d957d58524',
        '0x66c88648116b721bb2f394e0007f9d348ea08017b6e604de51a3a7d957d58524',
        '',
        'bitgo-stacks',
        '66c88648116b721bb2f394e0007f9d34 8ea08017b6e604de51a3a7d957d58524',
        '66c88648116b721bb2f394e0007f9d3rrxx908017b6e604de51a3a7d957d58524',
      ];

      for (const key of keys) {
        Utils.isValidPrivateKey(key).should.be.false();
      }
    });
  });

  describe('public key', function() {
    it('should validate proper keys', function() {
      const keys = [testData.pubKey1, testData.pubKey2, testData.pubKey2Compressed];

      for (const key of keys) {
        Utils.isValidPublicKey(key).should.be.true();
      }
    });

    it('should not validate invalid keys', function() {
      const keys = [
        '0421d6f42c97d23ec2c0dc21208a9c5edfce4e5bc7b63972e68e86e3cea6f41a94a9a7c24a1ccd83792173f475fdb590cc82f94ff615df39142766e759ce6387',
        '0321d6f42c99f7d23ec 2c0dc21208a9c5edfce4e5bc7b63972e68e6e3cea6f41a',
        '0aa68c2d6fdb3706b39f32d6f4225275ce062561908fd7ca540a44c92eb8594ea6db9fcfe0b390c0ead3f45c36afd682eab62eb124a63b460945fe1f7c7f8a09e2',
        '',
        'bitgo-stacks',
        '0921d6f42c99f7d23ec2c0dc21208a9c5edfce4e5bc7b63972e68e86e3cea6f41a',
        '0321d6f42c99f7d23ec2c0dc21208a9c5edfce4e5bc7b63972e68ezze3cea6f41a',
        '0x0321d6f42c99f7d23ec2c0dc21208a9c5edfce4e5bc7b63972e68e86e3cea6f41a',
        testData.invalidPubKey1,
        testData.invalidPubKey2,
      ];

      for (const key of keys) {
        Utils.isValidPublicKey(key).should.be.false();
      }
    });
  });

  describe('transaction id', function() {
    it('should validate proper ids', function() {
      const txIds = [
        '0x209a3e196195063b2e5195232087a71fe2329a6dc8d2fca531d48c5a7824f679',
        '6a590378c059f78fb698ec0af1ff610586cb1a52ee79fdae69e56430fde08cf4',
        '0e0149bc2c819f3ae40cef95ca58955c80bbc9e15f8c7c651c7b86c2214b7f02',
      ];

      for (const txId of txIds) {
        Utils.isValidTransactionId(txId).should.be.true();
      }
    });

    it('should not validate invalid ids', function() {
      const txIds = [
        '',
        'bitgo-stacks',
        '0x209a3e196195063b2e5195232087a71fe2329a6dc8d2fca531d48c5a7824f67',
        '6a590378c059f78fb698ec0af1ff610586cb52ee79fdae69e56430fde08cf4',
        '1x209a3e196195063b2e5195232087a71fe2329a6dc8d2fca531d48c5a7824f679',
        '6a590378c059f78fb698ec0af1ff610586cb1azz2ee79fdae69e56430fde08cf4',
        '0e0149bc2c819f3ae40cef95ca58955c80bbc9e1   5f8c7c651c7b86c2214b7f02',
      ];

      for (const txId of txIds) {
        Utils.isValidTransactionId(txId).should.be.false();
      }
    });
  });

  describe('transaction memo', function() {
    it('check for valid memo strings', function() {
      const memoStrings = ['', 'This is a test.', 'Okay', '!!This is thirty four bytes long!!'];
      for (const memo of memoStrings) {
        Utils.isValidMemo(memo).should.be.true();
      }
    });
    it('check for valid memo strings', function() {
      const memoStrings = ['ꜟꜟThis is thirty four chars long!!', 'It was the best of times, it was the worst of times'];
      for (const memo of memoStrings) {
        Utils.isValidMemo(memo).should.be.false();
      }
    });
  });

  describe('sign and verify', function() {
    const keyPair1 = new Stx.KeyPair({ prv: testData.secretKey1 });
    const keyPair2 = new Stx.KeyPair({ prv: testData.secretKey2 });

    it('sign a message', function() {
      should.equal(Stx.Utils.signMessage(keyPair1, testData.message1), testData.expectedSignature1);
      should.equal(Stx.Utils.signMessage(keyPair2, testData.message2), testData.expectedSignature2);
    });

    it('verify a signature', function() {
      Stx.Utils.verifySignature(
        testData.message1,
        testData.expectedSignature1,
        keyPair1.getKeys().pub,
      ).should.be.true();

      // handle compressed and uncompressed public keys properly
      Stx.Utils.verifySignature(
        testData.message2,
        testData.expectedSignature2,
        keyPair2.getKeys(false).pub,
      ).should.be.true();

      Stx.Utils.verifySignature(
        testData.message2,
        testData.expectedSignature2,
        keyPair2.getKeys(true).pub,
      ).should.be.true();
    });

    it('should not verify signatures', function() {
      // empty message
      should.throws(
        () => Stx.Utils.verifySignature('', testData.expectedSignature1, keyPair1.getKeys().pub),
        'Cannot verify empty messages',
      );

      // wrong public key
      Stx.Utils.verifySignature(
        testData.message1,
        testData.expectedSignature1,
        keyPair2.getKeys().pub,
      ).should.be.false();

      // wrong signature
      Stx.Utils.verifySignature(
        testData.message2,
        testData.expectedSignature1,
        keyPair2.getKeys().pub,
      ).should.be.false();
    });
  });
});
