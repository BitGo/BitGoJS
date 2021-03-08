import should from 'should';
import * as testData from '../../../resources/stacks/stacks';
import * as Utils from '../../../../src/coin/stacks/utils';

describe('Stacks util library', function() {
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
});
