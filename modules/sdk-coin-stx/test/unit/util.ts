import assert from 'assert';
import should from 'should';
import { AddressVersion, ClarityType, IntCV, NoneCV, SomeCV, UIntCV, ListCV } from '@stacks/transactions';
import BigNum from 'bn.js';
import * as testData from './resources';
import { StxLib } from '../../src';

const { KeyPair, Utils } = StxLib;

describe('Stx util library', function () {
  describe('address', function () {
    it('should validate addresses', function () {
      const validAddresses = [
        'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
        'ST11NJTTKGVT6D1HY4NJRVQWMQM7TVAR091EJ8P2Y',
        'SP2T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
        'ST1WVJMS5VS41F0YMH7D2M0VHXRG4CY43ZJZBS60A?memoId=4',
        'SPSZBZ3W0JC2MEBN0M9PAM2QB5SH72QYEQAMN6HD?memoId=0',
        'SP3BV7092K9ZS9NJ9ZYMPXE69SV6Y6072M7HEZ49E?memoId=255',
      ];

      for (const address of validAddresses) {
        Utils.isValidAddressWithPaymentId(address).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function () {
      const invalidAddresses = [
        'SP244HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6',
        'ST1T758K6T2YRKG9Q0TJ16B6FP5QQREWZSESRS0PY',
        'ST1WVJMS5VS41F0YMH7D2M0VHXRG4CY43ZJZBS60A?memoId=NaN',
        'SPSZBZ3W0JC2MEBN0M9PAM2QB5SH72QYEQAMN6HD?memoId=',
        'SP3BV7092K9ZS9NJ9ZYMPXE69SV6Y6072M7HEZ49E?memoId=testing',
        '',
        'abc',
      ];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => Utils.isValidAddress(address));
        Utils.isValidAddressWithPaymentId(address).should.be.false();
      }
    });

    it('should generate multisig addresses from compressed public keys', function () {
      const pubKeys = [
        '0263e1f2f322fb74224e210f9d616fce14d10fa89520dcde3d6d02514cdb16846a',
        '02d5de9e1b9c13fc7b67446ebcff4fbb9aa6b1933f907e9aabf32f48d6e0a5064d',
        '0296c4b8353c4a938173f80706df480cf6f85523b428d59ee81d9effcf61e5eae8',
      ];

      const address = Utils.getSTXAddressFromPubKeys(pubKeys);

      address.address.should.equal('SM1W9PBVTZA9SRNBQJ2A05R3T0ZVYC94PD0AN9KDG');
      address.hash160.should.equal('789b2f7afa939c5577909402e07a07f7e6249668');

      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.TestnetMultiSig).address.should.equal(
        'SN1W9PBVTZA9SRNBQJ2A05R3T0ZVYC94PD0A9GGMZ'
      );
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.MainnetMultiSig).address.should.equal(
        'SM1W9PBVTZA9SRNBQJ2A05R3T0ZVYC94PD0AN9KDG'
      );
    });

    it('should generate multisig addresses from uncompressed public keys', function () {
      const pubKeys = [
        '049742b908579ffd225d5e1d9486471f19a101dd04b7a81d11da882e7ac7f3e042989c311524a3335e15dec9338a07bd21b6e4444b6b7744d314cc926a1f0383db',
        '0464097ccbc22905ec6f678c846346294033e11a216d133abf6af252294695b3538d65f65b188b6e72e1890e7738f9e221944e618dea1178ef749717b35492de6a',
        '042c608408352ab41477ad9dd1cabca9e712de2dff3c5c8bfa4b5f7f1a0f74a32402a826d2ce5f3a6b01c16aeebdd304e235791958bbf97a08b5d4e9dd4db399b7',
      ];

      Utils.getSTXAddressFromPubKeys(pubKeys).address.should.equal('SM2TF8C003JE5YA8B43C2ZAY0K95QFVJNV86FCCQ4');
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.TestnetMultiSig).address.should.equal(
        'SN2TF8C003JE5YA8B43C2ZAY0K95QFVJNV90P7YGS'
      );
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.MainnetMultiSig).address.should.equal(
        'SM2TF8C003JE5YA8B43C2ZAY0K95QFVJNV86FCCQ4'
      );
    });

    it('should generate multisig addresses from compressed and uncompressed public keys', function () {
      const pubKeys = [
        '04d6f0f7d97a72979596a17fa2946eaeff3703250a62640271eea59477f5b19f39ad01ce2a53025eba365a4f40dd085234194d1d06aefec2a9d4439be0f3c2df34',
        '02f6d0597fb6d5467203d080e17f7b4f767ead59fc303b7d7261a832cb44305bb0',
        '034c80f991410082824aee4ca48147082997d44e800da9877e694f9cb64b3cb64a',
      ];

      Utils.getSTXAddressFromPubKeys(pubKeys).address.should.equal('SME8PKRHSCB699FEK59F7T7CBB225KH1MCKM67EV');
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.TestnetMultiSig).address.should.equal(
        'SNE8PKRHSCB699FEK59F7T7CBB225KH1MDPBVKF9'
      );
      Utils.getSTXAddressFromPubKeys(pubKeys, AddressVersion.MainnetMultiSig).address.should.equal(
        'SME8PKRHSCB699FEK59F7T7CBB225KH1MCKM67EV'
      );
    });

    it('should not generate multisig addresses from invalid input', function () {
      assert.throws(() => Utils.getSTXAddressFromPubKeys([]), /Invalid number of public keys/);
      assert.throws(() => Utils.getSTXAddressFromPubKeys(['badkey', 'badkey2']), /Invalid public key/);
      assert.throws(
        () =>
          Utils.getSTXAddressFromPubKeys([
            '02f6d0597fb6d5467203d080e17f7b4f767ead59fc303b7d7261a832cb44305bb0',
            'badkey',
          ]),
        /Invalid public key/
      );
    });
  });

  describe('amount', function () {
    it('valid amount', function () {
      Utils.isValidAmount('10').should.be.true();
    });

    it('invalid amount', function () {
      Utils.isValidAmount('-10').should.be.false();
    });
  });

  describe('private key', function () {
    it('should validate proper keys', function () {
      const keys = [testData.secretKey1, testData.secretKey2, testData.ACCOUNT_1.prv];

      for (const key of keys) {
        Utils.isValidPrivateKey(key).should.be.true();
      }
    });

    it('should not validate invalid keys', function () {
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

  describe('public key', function () {
    it('should validate proper keys', function () {
      const keys = [testData.pubKey1, testData.pubKey2, testData.pubKey2Compressed];

      for (const key of keys) {
        Utils.isValidPublicKey(key).should.be.true();
      }
    });

    it('should not validate invalid keys', function () {
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

  describe('transaction id', function () {
    it('should validate proper ids', function () {
      const txIds = [
        '0x209a3e196195063b2e5195232087a71fe2329a6dc8d2fca531d48c5a7824f679',
        '6a590378c059f78fb698ec0af1ff610586cb1a52ee79fdae69e56430fde08cf4',
        '0e0149bc2c819f3ae40cef95ca58955c80bbc9e15f8c7c651c7b86c2214b7f02',
      ];

      for (const txId of txIds) {
        Utils.isValidTransactionId(txId).should.be.true();
      }
    });

    it('should not validate invalid ids', function () {
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

  describe('transaction memo', function () {
    it('check for valid memo strings', function () {
      const memoStrings = ['', 'This is a test.', 'Okay', '!!This is thirty four bytes long!!'];
      for (const memo of memoStrings) {
        Utils.isValidMemo(memo).should.be.true();
      }
    });
    it('check for valid memo strings', function () {
      const memoStrings = ['ꜟꜟThis is thirty four chars long!!', 'It was the best of times, it was the worst of times'];
      for (const memo of memoStrings) {
        Utils.isValidMemo(memo).should.be.false();
      }
    });
  });

  describe('sign and verify', function () {
    const keyPair1 = new KeyPair({ prv: testData.secretKey1 });
    const keyPair2 = new KeyPair({ prv: testData.secretKey2 });

    it('sign a message', function () {
      should.equal(Utils.signMessage(keyPair1, testData.message1), testData.expectedSignature1);
      should.equal(Utils.signMessage(keyPair2, testData.message2), testData.expectedSignature2);
    });

    it('verify a signature', function () {
      Utils.verifySignature(testData.message1, testData.expectedSignature1, keyPair1.getKeys().pub).should.be.true();

      // handle compressed and uncompressed public keys properly
      Utils.verifySignature(
        testData.message2,
        testData.expectedSignature2,
        keyPair2.getKeys(false).pub
      ).should.be.true();

      Utils.verifySignature(
        testData.message2,
        testData.expectedSignature2,
        keyPair2.getKeys(true).pub
      ).should.be.true();
    });

    it('should not verify signatures', function () {
      // empty message
      assert.throws(
        () => Utils.verifySignature('', testData.expectedSignature1, keyPair1.getKeys().pub),
        new RegExp('Cannot verify empty messages')
      );

      // wrong public key
      Utils.verifySignature(testData.message1, testData.expectedSignature1, keyPair2.getKeys().pub).should.be.false();

      // wrong signature
      Utils.verifySignature(testData.message2, testData.expectedSignature1, keyPair2.getKeys().pub).should.be.false();
    });
  });

  describe('stringifyCv', function () {
    it('Int type', function () {
      const input: IntCV = { type: ClarityType.Int, value: BigInt('100000') };
      Utils.stringifyCv(input).should.deepEqual({ type: 0, value: '100000' });
    });

    it('UInt type', function () {
      const input: UIntCV = { type: ClarityType.UInt, value: BigInt('100000') };
      Utils.stringifyCv(input).should.deepEqual({ type: 1, value: '100000' });
    });

    it('OptionalNone type', function () {
      const input: NoneCV = { type: ClarityType.OptionalNone };
      Utils.stringifyCv(input).should.deepEqual(input);
    });

    it('OptionalSome type with uint value', function () {
      const input: SomeCV = {
        type: ClarityType.OptionalSome,
        value: { type: ClarityType.UInt, value: BigInt('100000') },
      };
      Utils.stringifyCv(input).should.deepEqual({ type: 10, value: { type: 1, value: '100000' } });
    });

    it('OptionalSome type with tuple value', function () {
      const input: SomeCV = {
        type: ClarityType.OptionalSome,
        value: {
          type: ClarityType.Tuple,
          data: {
            hashbytes: { type: ClarityType.Buffer, buffer: Buffer.from('some-hash') },
            version: { type: ClarityType.Buffer, buffer: new BigNum(1).toBuffer() },
          },
        },
      };
      Utils.stringifyCv(input).should.deepEqual(input);
    });

    it('List type', function () {
      const input: ListCV = { type: ClarityType.List, list: [{ type: ClarityType.UInt, value: BigInt('100000') }] };
      Utils.stringifyCv(input).should.deepEqual({ type: 11, list: [{ type: 1, value: '100000' }] });
    });

    it('List type with empty list', function () {
      const input: ListCV = { type: ClarityType.List, list: [] };
      Utils.stringifyCv(input).should.deepEqual({ type: 11, list: [] });
    });
  });

  describe('getAddressVersion', function () {
    it('should succeed to for valid addresses', function () {
      // Mainnet single sig
      Utils.getAddressVersion('SP1DN2NGRB2R3W75ST0GAA7DBV1VEBBWYZ1D33DEQ').should.equal(22);
      // Mainnet multi sig
      Utils.getAddressVersion('SM468VETKA5DB15HWG2QM7Y04EFQKV44R9D6D0QC').should.equal(20);
      // Testnet single sig
      Utils.getAddressVersion('ST1SRCA93CE1WD8TEG28BSWBFR68J24ZTAB2FAJ0').should.equal(26);
      // Testnet multi sig
      Utils.getAddressVersion('SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX').should.equal(21);
      // With Memo Id
      Utils.getAddressVersion('SP1DN2NGRB2R3W75ST0GAA7DBV1VEBBWYZ1D33DEQ?memoId=0').should.equal(22);
      Utils.getAddressVersion('SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX?memoId=255').should.equal(21);
    });
  });

  describe('xpubToSTXPubkey', function () {
    it('should succeed to convert for valid xpubs', function () {
      Utils.xpubToSTXPubkey(
        'xpub661MyMwAqRbcGS2HMdvANN7o8ESWqwvr5U4ry5fZdD9VHhymWyfoDQF4vzfKotXgGtJTrwrFRz7XbGFov4FqdKKo6mRYNWvMp7P23DjuJnS'
      ).should.equal('03f0f3581a4256797fa8478cb6b1da6588f4c4bedc80ab2601e3a1572cf57b6156');
      Utils.xpubToSTXPubkey(
        'xpub661MyMwAqRbcFEzr5CcpFzPG45rmPf75DTvDobN5gJimCatbHtzR53SbHzDZ1J56byKSsdc8vSujGuQpyPjb7Lsua2NfADJewPxNzL3N6Tj'
      ).should.equal('0262b7e86c1e36e45d451263b54a1c3d740abeab61d221d1175fc3fdad752853ab');
      Utils.xpubToSTXPubkey(
        'xpub661MyMwAqRbcGP1adk34VzRQJEMX25rCxjEyU9YFFWNhWNzwPoqgjLoKfnqotLwrz7kBevWbRZnqTSQrQDuJuYUQaDQ5DDPEzEXMwPS9PEf'
      ).should.equal('036529a0e41cfd1a9d265b74f8d0002c92c5aec10d4239000260a25cfd54e4726c');
    });
  });

  describe('getBaseAddress', function () {
    it('should return the base address', async function () {
      const addressWithMemo = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX?memoId=255';
      const baseAddress = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX';
      Utils.getBaseAddress(addressWithMemo).should.equal(baseAddress);
      Utils.getBaseAddress(baseAddress).should.equal(baseAddress);
    });
  });

  describe('isSameBaseAddress', function () {
    it('should validate if base address match', async function () {
      const address = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX?memoId=255';
      const baseAddress = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX';
      Utils.isSameBaseAddress(address, baseAddress).should.true();

      const address2 = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX';
      const baseAddress2 = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX';
      Utils.isSameBaseAddress(address2, baseAddress2).should.true();

      const address3 = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX?memoId=255';
      const baseAddress3 = 'ST1SRCA93CE1WD8TEG28BSWBFR68J24ZTAB2FAJ0';
      Utils.isSameBaseAddress(address3, baseAddress3).should.false();

      const address4 = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDX';
      const baseAddress4 = 'ST1SRCA93CE1WD8TEG28BSWBFR68J24ZTAB2FAJ0';
      Utils.isSameBaseAddress(address4, baseAddress4).should.false();

      const address5 = 'SN237KBNCA2CZZ32CWMNTF74DFAYCPNJ3MNN6ANDF';
      const baseAddress5 = 'ST1SRCA93CE1WD8TEG28BSWBFR68J24ZTAB2FAJ0';
      assert.throws(
        () => Utils.isSameBaseAddress(address5, baseAddress5).should.false(),
        new RegExp(`invalid address: ${address5}`)
      );
    });
  });
});
