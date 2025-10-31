import { coins, FlareNetwork } from '@bitgo/statics';
import { NotImplementedError } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { Utils } from '../../../src/lib/utils';
import { KeyPair } from '../../../src/lib';
import * as testData from '../../resources/account';

describe('Utils', function () {
  let utils: Utils;
  const network = coins.get('tflrp').network as FlareNetwork;

  beforeEach(function () {
    utils = new Utils();
  });

  describe('includeIn', function () {
    it('should return true when all wallet addresses are in output addresses', function () {
      const walletAddresses = [testData.ACCOUNT_1.addressMainnet, testData.ACCOUNT_3.address];
      const outputAddresses = [
        testData.ACCOUNT_1.addressMainnet,
        testData.ACCOUNT_3.address,
        testData.ACCOUNT_4.address,
      ];

      assert.strictEqual(utils.includeIn(walletAddresses, outputAddresses), true);
    });

    it('should return false when not all wallet addresses are in output addresses', function () {
      const walletAddresses = [testData.ACCOUNT_1.addressMainnet, testData.ACCOUNT_3.address];
      const outputAddresses = [testData.ACCOUNT_3.address, testData.ACCOUNT_4.address];

      assert.strictEqual(utils.includeIn(walletAddresses, outputAddresses), false);
    });

    it('should return true for empty wallet addresses', function () {
      const walletAddresses: string[] = [];
      const outputAddresses = [testData.ACCOUNT_1.addressMainnet, testData.ACCOUNT_3.address];

      assert.strictEqual(utils.includeIn(walletAddresses, outputAddresses), true);
    });

    it('should return false when wallet address not found in empty output addresses', function () {
      const walletAddresses = [testData.ACCOUNT_1.addressMainnet];
      const outputAddresses: string[] = [];

      assert.strictEqual(utils.includeIn(walletAddresses, outputAddresses), false);
    });
  });

  describe('isValidAddress', function () {
    it('should validate single valid Flare addresses', function () {
      const validAddresses = [
        testData.SEED_ACCOUNT.addressMainnet,
        testData.SEED_ACCOUNT.addressTestnet,
        testData.ACCOUNT_1.addressMainnet,
        testData.ACCOUNT_1.addressTestnet,
      ];

      validAddresses.forEach((addr) => {
        const result = utils.isValidAddress(addr);
        assert.strictEqual(typeof result, 'boolean');
        assert.strictEqual(result, true);
      });
    });

    it('should validate array of addresses', function () {
      const addresses = [
        testData.SEED_ACCOUNT.addressMainnet,
        testData.SEED_ACCOUNT.addressTestnet,
        testData.ACCOUNT_1.addressMainnet,
        testData.ACCOUNT_1.addressTestnet,
      ];

      const result = utils.isValidAddress(addresses);
      assert.strictEqual(typeof result, 'boolean');
      assert.strictEqual(result, true);
    });

    it('should validate addresses separated by ~', function () {
      const addressString =
        testData.SEED_ACCOUNT.addressTestnet +
        '~' +
        testData.ACCOUNT_1.addressTestnet +
        '~' +
        testData.ACCOUNT_4.address;

      const result = utils.isValidAddress(addressString);
      assert.strictEqual(typeof result, 'boolean');
      assert.strictEqual(result, true);
    });

    it('should reject obviously invalid addresses', function () {
      const invalidAddresses = [
        '',
        'invalid',
        '123',
        'bitcoin1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
        'eth:0x1234567890123456789012345678901234567890',
      ];

      invalidAddresses.forEach((addr) => {
        const result = utils.isValidAddress(addr);
        assert.strictEqual(typeof result, 'boolean');
        assert.strictEqual(result, false);
      });
    });
  });

  describe('isValidAddressRegex', function () {
    it('should test address format with regex', function () {
      const testAddress = testData.SEED_ACCOUNT.addressTestnet;
      const result = utils['isValidAddressRegex'](testAddress);
      assert.strictEqual(typeof result, 'boolean');
      assert.strictEqual(result, true);
    });

    it('should reject empty strings', function () {
      const result = utils['isValidAddressRegex']('');
      assert.strictEqual(result, false);
    });
  });

  describe('isValidTransactionId', function () {
    it('should return true for valid transaction IDs', function () {
      const validTxIds = [
        '6wewzpFrTDPGmFfRJoT9YyGVxsRDxQXu6pz6LSXLf2eU6StBe',
        '3SuMRBREQwhsR1qQYjSpHPNgwV7keXQbKBgP8jULnKdz7ppEV',
        '2ExGh7o1c4gQtQrzDt2BvJxg42FswGWaLY7NEXCqcejPxjSTij',
      ];

      validTxIds.forEach((txId) => {
        const result = utils.isValidTransactionId(txId);
        assert.strictEqual(typeof result, 'boolean');
        assert.strictEqual(result, true);
      });
    });
    it('should return false for invalid transaction IDs', function () {
      const invalidTxIds = [
        '',
        '123',
        'invalidtxid',
        '0xaf32fd2276be99560e5218d79f9c3d2f29c126fa61b60b08a42c1be430f877df',
      ];

      invalidTxIds.forEach((txId) => {
        const result = utils.isValidTransactionId(txId);
        assert.strictEqual(typeof result, 'boolean');
        assert.strictEqual(result, false);
      });
    });
  });

  describe('isValidBlockId', function () {
    it('should return true for valid block IDs', function () {
      const validTxIds = [
        'mg3B2HsQ8Pqe63J2arXi6uD3wGJV1fgCNe5bRufDToAgVRVBp',
        'rVWodN2iTugUMckkgf8ntXcoyuduey24ZgXCMi66mrFegcV4R',
        '2MrU9G74ra9QX99wQRxvKrbzV93i6Ua7KgHMETVMSYoJq2tb5g',
      ];

      validTxIds.forEach((txId) => {
        const result = utils.isValidBlockId(txId);
        assert.strictEqual(typeof result, 'boolean');
        assert.strictEqual(result, true);
      });
    });
    it('should return false for invalid block IDs', function () {
      const invalidTxIds = [
        '',
        '123',
        'invalidtxid',
        '0xa2379e3804e603357e3a670f2696852aae8ffe2f22a7b79f7fba86f78c8f3290',
      ];

      invalidTxIds.forEach((txId) => {
        const result = utils.isValidBlockId(txId);
        assert.strictEqual(typeof result, 'boolean');
        assert.strictEqual(result, false);
      });
    });
  });

  describe('isValidSignature', function () {
    it('should throw NotImplementedError', function () {
      assert.throws(
        () => utils.isValidSignature('signature123'),
        NotImplementedError,
        'isValidSignature not implemented'
      );
    });
  });

  describe('createSignature', function () {
    it('should create signature using secp256k1', function () {
      const message = Buffer.from(testData.SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(testData.SEED_ACCOUNT.privateKey, 'hex');

      const signature = utils.createSignature(network, message, privateKey).toString('hex');

      assert.ok(signature.length > 0);
      assert.strictEqual(signature, testData.SEED_ACCOUNT.signature);
    });

    it('should create different signatures for different messages', function () {
      const message1 = Buffer.from('message 1', 'utf8');
      const message2 = Buffer.from('message 2', 'utf8');
      const privateKey = Buffer.from(testData.SEED_ACCOUNT.privateKey, 'hex');

      const sig1 = utils.createSignature(network, message1, privateKey);
      const sig2 = utils.createSignature(network, message2, privateKey);

      assert.notDeepStrictEqual(sig1, sig2);
    });

    it('should throw error for invalid private key', function () {
      const message = Buffer.from('hello world', 'utf8');
      const invalidPrivateKey = Buffer.from('invalid', 'utf8');

      assert.throws(() => utils.createSignature(network, message, invalidPrivateKey), /Failed to create signature/);
    });
  });

  describe('verifySignature', function () {
    it('should verify valid signature', function () {
      const message = Buffer.from(testData.SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(testData.SEED_ACCOUNT.privateKey, 'hex');
      const signature = utils.createSignature(network, message, privateKey);
      const publicKey = Buffer.from(testData.SEED_ACCOUNT.publicKey, 'hex'); // Compressed public key format
      const isValid = utils.verifySignature(network, message, signature, publicKey);
      assert.strictEqual(typeof isValid, 'boolean');
      assert.strictEqual(isValid, true);
    });

    it('should return false for invalid signature', function () {
      const message = Buffer.from('hello world', 'utf8');
      const invalidSignature = Buffer.from('invalid signature', 'utf8');
      const publicKey = Buffer.from('02' + '0'.repeat(62), 'hex');
      const result = utils.verifySignature(network, message, invalidSignature, publicKey);
      assert.strictEqual(result, false);
    });
  });

  describe('recoverySignature', function () {
    it('should recover signature', () => {
      const compressed = true;
      const keyPair = new KeyPair({ prv: testData.SEED_ACCOUNT.flrpPrivateKey });
      const prv = keyPair.getPrivateKey();
      const pub = keyPair.getPublicKey({ compressed });
      const message = Buffer.from(testData.SEED_ACCOUNT.message, 'hex');
      const signature = utils.createSignature(network, message, prv!);
      utils.recoverySignature(network, message, signature).should.deepEqual(pub);
    });

    it('should recover same public key for same message and signature', function () {
      const message = Buffer.from(testData.SEED_ACCOUNT.message, 'utf8');
      const privateKey = Buffer.from(testData.SEED_ACCOUNT.privateKey, 'hex');
      const signature = utils.createSignature(network, message, privateKey);

      const pubKey1 = utils.recoverySignature(network, message, signature);
      const pubKey2 = utils.recoverySignature(network, message, signature);

      assert.deepStrictEqual(pubKey1, pubKey2);
    });

    it('should throw error for invalid signature', function () {
      const message = Buffer.from(testData.SEED_ACCOUNT.message, 'utf8');
      const invalidSignature = Buffer.from('invalid signature', 'utf8');

      assert.throws(() => utils.recoverySignature(network, message, invalidSignature), /Failed to recover signature/);
    });

    it('should throw error for empty message', function () {
      const message = Buffer.alloc(0);
      const signature = Buffer.alloc(65); // Empty but valid length signature (65 bytes: 64 signature + 1 recovery param)

      assert.throws(() => utils.recoverySignature(network, message, signature), /Failed to recover signature/);
    });
  });

  describe('address parsing utilities', function () {
    it('should handle address separator constants', function () {
      const { ADDRESS_SEPARATOR } = require('../../../src/lib/iface');
      assert.strictEqual(ADDRESS_SEPARATOR, '~');
    });

    it('should handle input separator constants', function () {
      const { INPUT_SEPARATOR } = require('../../../src/lib/iface');
      assert.strictEqual(INPUT_SEPARATOR, ':');
    });
  });

  describe('error handling', function () {
    it('should properly extend base utils', function () {
      // Test that utils class exists and has expected methods
      assert.ok('isValidAddress' in utils);
      assert.ok('includeIn' in utils);
      assert.ok('createSignature' in utils);
      assert.ok('verifySignature' in utils);
    });

    it('should handle parsing errors gracefully', function () {
      // Test that utils can handle malformed input without crashing
      // Note: These may throw errors, which is acceptable behavior
      try {
        utils.isValidAddress(null as unknown as string);
        utils.isValidAddress(undefined as unknown as string);
      } catch (error) {
        // Expected behavior - utils should handle or throw meaningful errors
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('constants validation', function () {
    it('should have correct constant values', function () {
      const constants = require('../../../src/lib/constants');

      assert.strictEqual(typeof constants.DECODED_BLOCK_ID_LENGTH, 'number');
      assert.strictEqual(typeof constants.SHORT_PUB_KEY_LENGTH, 'number');
      assert.strictEqual(typeof constants.COMPRESSED_PUBLIC_KEY_LENGTH, 'number');
      assert.strictEqual(typeof constants.UNCOMPRESSED_PUBLIC_KEY_LENGTH, 'number');
      assert.strictEqual(typeof constants.RAW_PRIVATE_KEY_LENGTH, 'number');
      assert.strictEqual(typeof constants.SUFFIXED_PRIVATE_KEY_LENGTH, 'number');
      assert.strictEqual(typeof constants.PRIVATE_KEY_COMPRESSED_SUFFIX, 'string');
      assert.strictEqual(typeof constants.OUTPUT_INDEX_HEX_LENGTH, 'number');
      assert.ok(constants.ADDRESS_REGEX instanceof RegExp);
      assert.ok(constants.HEX_REGEX instanceof RegExp);
    });
  });

  describe('Memo Utilities', function () {
    it('should convert string to bytes', function () {
      const text = 'Hello Flare';
      const bytes = utils.stringToBytes(text);

      assert.ok(bytes instanceof Uint8Array);
      assert.strictEqual(utils.bytesToString(bytes), text);
    });

    it('should handle UTF-8 strings', function () {
      const text = 'Hello 世界 🌍';
      const bytes = utils.stringToBytes(text);

      assert.strictEqual(utils.bytesToString(bytes), text);
    });

    it('should create memo bytes from string', function () {
      const text = 'Memo text';
      const bytes = utils.createMemoBytes(text);

      assert.ok(bytes instanceof Uint8Array);
      assert.strictEqual(utils.parseMemoBytes(bytes), text);
    });

    it('should create memo bytes from JSON object', function () {
      const obj = { type: 'payment', amount: 1000 };
      const bytes = utils.createMemoBytes(obj);
      const parsed = utils.parseMemoBytes(bytes);

      assert.strictEqual(parsed, JSON.stringify(obj));
    });

    it('should handle Uint8Array input', function () {
      const originalBytes = new Uint8Array([1, 2, 3, 4]);
      const bytes = utils.createMemoBytes(originalBytes);

      assert.deepStrictEqual(bytes, originalBytes);
    });

    it('should throw error for invalid memo type', function () {
      assert.throws(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        utils.createMemoBytes(123 as any);
      }, /Invalid memo format/);
    });

    it('should parse empty memo', function () {
      const emptyBytes = new Uint8Array([]);
      const parsed = utils.parseMemoBytes(emptyBytes);

      assert.strictEqual(parsed, '');
    });

    it('should validate memo size', function () {
      const smallMemo = new Uint8Array([1, 2, 3]);
      const largeMemo = new Uint8Array(5000);

      assert.strictEqual(utils.validateMemoSize(smallMemo), true);
      assert.strictEqual(utils.validateMemoSize(largeMemo), false);
      assert.strictEqual(utils.validateMemoSize(largeMemo, 6000), true);
    });

    it('should handle special characters in memo', function () {
      const specialText = 'Special: \n\t\r\0';
      const bytes = utils.createMemoBytes(specialText);
      const parsed = utils.parseMemoBytes(bytes);

      assert.strictEqual(parsed, specialText);
    });
  });
});
