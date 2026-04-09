import assert from 'assert';
import should from 'should';

import {
  defaultDataToSign,
  defaultKeyPairFromPrv,
  defaultKeyPairFromPub,
  signedSerializedOriginationTransaction,
  validDataToSign,
} from '../resources';
import { XtzLib } from '../../src';
import { HashType } from '../../src/lib/iface';

describe('XTZ util library', function () {
  describe('address', function () {
    it('should validate addresses', function () {
      const validAddresses = [
        'tz1aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9',
        'tz2SHdGxFGhs68wYNC4hEqxbWARxp2J4mVxv',
        'tz3gN8NTLNLJg5KRsUU47NHNVHbdhcFXjjaB',
        'KT1EGbAxguaWQFkV3Egb2Z1r933MWuEYyrJS',
      ];

      for (const address of validAddresses) {
        XtzLib.Utils.isValidAddress(address).should.be.true();
      }
    });

    it('should fail to validate invalid addresses', function () {
      const invalidAddresses = [
        'tz4aWXP237BLwNHJcCD4b3DutCevhqq2T1Z9',
        'xtz2SHdGxFGhs68wYNC4hEqxbWARxp2J4mVxv',
        'KT2EGbAxguaWQFkV3Egb2Z1r933MWuEYyrJS',
        'abc',
      ];

      for (const address of invalidAddresses) {
        should.doesNotThrow(() => XtzLib.Utils.isValidAddress(address));
        XtzLib.Utils.isValidAddress(address).should.be.false();
      }
    });
  });

  describe('block hash', function () {
    it('should validate block hashes', function () {
      const validHashes = [
        'BKoifs5gGffAzuRBcg3ygxbLdrCXyDDS1ALvMG8SFYWahzoYMku',
        'BL4oxWAkozJ3mJHwVFQqga5dQMBi8kBCPAQyBKgF78z7SQT1AvN',
        'BL29n92KHaarq1r7XjwTFotzCpxq7LtXMc9bF2qD9Qt26ZTYQia',
      ];

      for (const hash of validHashes) {
        XtzLib.Utils.isValidBlockHash(hash).should.be.true();
      }
    });

    it('should fail to validate invalid block hashes', function () {
      const invalidHashes = [
        'AKoifs5gGffAzuRBcg3ygxbLdrCXyDDS1ALvMG8SFYWahzoYMku',
        'BKoifs5gGffAzuRBcg3ygxbLdrCXyDDS1ALvMG8SFYWahzoYMku1111111111',
        'invalid',
      ];

      for (const hash of invalidHashes) {
        XtzLib.Utils.isValidBlockHash(hash).should.be.false();
      }
    });
  });

  describe('transaction hash', function () {
    it('should validate tx hashes', function () {
      const validHashes = [
        'opUmZNMueryYFxTbzzocS7K4dzs3NmgKqhhr9TkcftszDDnoRVu',
        'ookyzxsYF7vyTeDzsgs58XJ4PXuvBkK8wWqZJ4EoRS6RWQb4Y9P',
        'ooXQoUX32szALRvgzD2TDzeRPXtPfmfqwoehPaK5khbrBiMAtSw',
      ];

      for (const hash of validHashes) {
        XtzLib.Utils.isValidTransactionHash(hash).should.be.true();
      }
    });

    it('should fail to validate invalid tx hashes', function () {
      const invalidHashes = [
        'lpUmZNMueryYFxTbzzocS7K4dzs3NmgKqhhr9TkcftszDDnoRVu',
        'opUmZNMueryYFxTbzzocS7K4dzs3NmgKqhhr9TkcftszDDnoRVu1111111111',
        'invalid',
      ];

      for (const hash of invalidHashes) {
        XtzLib.Utils.isValidTransactionHash(hash).should.be.false();
      }
    });

    it('should calculate the transaction hash', async function () {
      const operationId = await XtzLib.Utils.calculateTransactionId(signedSerializedOriginationTransaction);
      operationId.should.equal('opPsNbm7EcqPyryBDDR28BjdthnriktK8TbMvpwc9r4NwmvToYP');
    });

    it('should calculate the originated account address', async function () {
      const accountAddress = await XtzLib.Utils.calculateOriginatedAddress(
        'opPsNbm7EcqPyryBDDR28BjdthnriktK8TbMvpwc9r4NwmvToYP',
        0
      );
      accountAddress.should.equal('KT1LJvp55fbdNwbisJFign9wA4cPgq9T9oc4');
    });
  });

  describe('sign', function () {
    it('should produce a valid signature', async function () {
      const signatures = await XtzLib.Utils.sign(defaultKeyPairFromPrv, defaultDataToSign);
      signatures.bytes.should.equal(
        '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b'
      );
      signatures.prefixSig.should.equal(
        'spsig19yWAc5nBpGmNCWdvEWHnpJXEiTqZjhNgWwWa1Lz6kVgakb7qCPj9z6G6LLEFWmsmNcPCZYseERVDUXh99N7wqDppcDKQM'
      );
      signatures.sbytes.should.equal(
        '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b1fd49502ba8dc7adb01716093abe715d1eef87f47a88d8ec104fcc1d6baca7ba06cc2ced6c5baa880d6045b44be926d63bc3aeb3b9124f3b32ac6d9c63584fe5'
      );
      signatures.sig.should.equal(
        'sigS9pqYUXiUJcz2Wsx5x98ud9KtgGVg4gCwpBoDBgHrZy9gwJedKMCrcQPxm9C7i1gesETbhFD6Gm8BpadGgd2cgiGoQbiY'
      );
    });

    it('should produce a valid signature with watermark', async function () {
      const signatures = await XtzLib.Utils.sign(defaultKeyPairFromPrv, defaultDataToSign, new Uint8Array());
      signatures.bytes.should.equal(
        '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b'
      );
      signatures.prefixSig.should.equal(
        'spsig1DWTuXdgUg2t64PLRfaapsYejCoCVVkqy2Zjv41Zirt7MjoqSfBnP38qoAg3SWicfQNiG25yMqGYge4jrfrwv9H8hRKDyY'
      );
      signatures.sbytes.should.equal(
        '0507070a000000160196369c90625575ba44594b23794832a9337f7a2d0007070000050502000000320320053d036d0743035d0a00000015006b5ddaef3fb5d7c151cfb36fbe43a7a066777394031e0743036a0001034f034d031b3ad76776913e2c0cfe827b572c417b73a14debcf9e5db726ce9b10aa4bea6aa1173b313ff67eb9bdfdcf9a753178e6ac78ac5f53aef8bcca6d56706f5c3fb01f'
      );
      signatures.sig.should.equal(
        'sigVgnaU2S1L4jhtPaTX2SAxsGpP1dRS89VTSR9FrFuxxPvgA2G67QRuez6o6xP7ekagdZX4ELvh7pbMMdLoBSzvk2AVyQpk'
      );
    });

    it('should validate a signature belongs to a public key for a string message', async function () {
      const message = 'helloworld';
      const messageHex = Buffer.from(message).toString('hex');
      const signatures = await XtzLib.Utils.sign(defaultKeyPairFromPrv, messageHex, new Uint8Array(0));
      const result = await XtzLib.Utils.verifySignature(
        messageHex,
        defaultKeyPairFromPub.getKeys().pub,
        signatures.sig,
        new Uint8Array(0)
      );
      result.should.be.true();
    });

    it('should validate a signature belongs to a public key for dataToSign', async function () {
      const messageHex = Buffer.from(defaultDataToSign).toString('hex');
      const signatures = await XtzLib.Utils.sign(defaultKeyPairFromPrv, messageHex, new Uint8Array(0));
      const result = await XtzLib.Utils.verifySignature(
        messageHex,
        defaultKeyPairFromPub.getKeys().pub,
        signatures.sig,
        new Uint8Array(0)
      );
      result.should.be.true();
    });

    it('should fail to validate a signature with the wrong watermark', async function () {
      const messageHex = Buffer.from(defaultDataToSign).toString('hex');
      const signatures = await XtzLib.Utils.sign(defaultKeyPairFromPrv, messageHex);
      const result = await XtzLib.Utils.verifySignature(
        messageHex,
        defaultKeyPairFromPub.getKeys().pub,
        signatures.sig,
        new Uint8Array(3)
      );
      result.should.be.false();
    });

    it('should fail to validate a signature with the wrong public key', async function () {
      const messageHex = Buffer.from(defaultDataToSign).toString('hex');
      const signatures = await XtzLib.Utils.sign(defaultKeyPairFromPrv, messageHex);
      const result = await XtzLib.Utils.verifySignature(
        messageHex,
        'sppk7d2ztzbrLdBaTB7yzaWRkPfcWGsrNQNJdkBE9bCTSSzekLNzpvf',
        signatures.sig
      );
      result.should.be.false();
    });

    it('should fail to validate a signature with the wrong message', async function () {
      const messageHex = Buffer.from(defaultDataToSign).toString('hex');
      const signatures = await XtzLib.Utils.sign(defaultKeyPairFromPrv, messageHex);
      const secondMessageHex = Buffer.from('helloWorld').toString('hex');
      const result = await XtzLib.Utils.verifySignature(
        secondMessageHex,
        defaultKeyPairFromPub.getKeys().pub,
        signatures.sig
      );
      result.should.be.false();
    });

    it('should fail if the key pair does not have the private key', async function () {
      await XtzLib.Utils.sign(defaultKeyPairFromPub, defaultDataToSign).should.be.rejectedWith(
        new RegExp('Missing private key')
      );
    });
  });

  describe('generateDataToSign', function () {
    it('should build transfer data to sign', function () {
      const dataToSign = XtzLib.Utils.generateDataToSign(
        'KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL',
        'tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS',
        '100',
        '0'
      );
      JSON.stringify(dataToSign).should.equal(JSON.stringify(validDataToSign));
    });

    it('should fail if the contract address has the wrong format', function () {
      assert.throws(
        () =>
          XtzLib.Utils.generateDataToSign(
            'tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS',
            'tz2PtJ9zgEgFVTRqy6GXsst54tH3ksEnYvvS',
            '0',
            '0'
          ),
        new RegExp('Invalid contract address')
      );
    });

    it('should fail if the destination address has the wrong format', function () {
      assert.throws(
        () => XtzLib.Utils.generateDataToSign('KT1NH2M23xovhw7uwWVuoGTYxykeCcVfSqhL', 'abc', '0', '0'),
        new RegExp('Invalid destination address')
      );
    });
  });

  describe('signature', function () {
    it('should validate signature', function () {
      const validSignatures = [
        'sigVgnaU2S1L4jhtPaTX2SAxsGpP1dRS89VTSR9FrFuxxPvgA2G67QRuez6o6xP7ekagdZX4ELvh7pbMMdLoBSzvk2AVyQpk',
        'spsig1DWTuXdgUg2t64PLRfaapsYejCoCVVkqy2Zjv41Zirt7MjoqSfBnP38qoAg3SWicfQNiG25yMqGYge4jrfrwv9H8hRKDyY',
        'sigS9pqYUXiUJcz2Wsx5x98ud9KtgGVg4gCwpBoDBgHrZy9gwJedKMCrcQPxm9C7i1gesETbhFD6Gm8BpadGgd2cgiGoQbiY',
        'spsig19yWAc5nBpGmNCWdvEWHnpJXEiTqZjhNgWwWa1Lz6kVgakb7qCPj9z6G6LLEFWmsmNcPCZYseERVDUXh99N7wqDppcDKQM',
      ];

      for (const hash of validSignatures) {
        XtzLib.Utils.isValidSignature(hash).should.be.true();
      }
    });

    it('should fail to validate invalid signature', function () {
      const invalidHashes = [
        'sigS9pqYUXiUJcz2Wsx5x98ud9KtgGVg4gCwpBoDBgHrZ',
        'sig',
        'BKoifs5gGffAzuRBcg3ygxbLdrCXyDDS1ALvMG8SFYWahzoYMku1111111111',
        'invalid',
      ];

      for (const hash of invalidHashes) {
        XtzLib.Utils.isValidSignature(hash).should.be.false();
      }
    });
  });

  describe('decodeKey', function () {
    it('should decode the key', function () {
      const validKeys = [['spsk2cbiVsAvpGKmau9XcMscL3NRwjkyT575N5AyAofcoj41x6g6TL', XtzLib.Utils.hashTypes.spsk]];

      for (const data of validKeys) {
        XtzLib.Utils.decodeKey(data[0] as string, data[1] as HashType)
          .toString('hex')
          .should.equal('9cc0aaa9ef687e70f7780e60de08d7a443488a9cf8e1ebe9689118763376c07c');
      }
    });

    it('should fail to decode an invalid key', function () {
      const invalidKeys = [
        [
          'sigVgnaU2S1L4jhtPaTX2SAxsGpP1dRS89VTSR9FrFuxxPvgA2G67QRuez6o6xP7ekagdZX4ELvh7pbMMdLoBSzvk2AVyQpk',
          XtzLib.Utils.hashTypes.tz1,
        ],
        ['sppk', XtzLib.Utils.hashTypes.sppk],
      ];

      for (const data of invalidKeys) {
        assert.throws(
          () => XtzLib.Utils.decodeKey(data[0] as string, data[1] as HashType),
          new RegExp('Unsupported private key')
        );
      }
    });
  });
});
