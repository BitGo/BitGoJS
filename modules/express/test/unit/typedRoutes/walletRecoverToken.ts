import * as assert from 'assert';
import * as t from 'io-ts';
import {
  RecoverTokenParams,
  RecoverTokenBody,
  RecoverTokenResponse,
  PostWalletRecoverToken,
} from '../../../src/typedRoutes/api/v2/walletRecoverToken';
import { assertDecode } from './common';

describe('WalletRecoverToken codec tests', function () {
  describe('RecoverTokenParams', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'eth',
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(RecoverTokenParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'eth',
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123, // number instead of string
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        coin: 'eth',
        id: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenParams), invalidParams);
      });
    });
  });

  describe('RecoverTokenBody', function () {
    it('should validate empty body (all fields optional)', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.tokenContractAddress, undefined);
      assert.strictEqual(decoded.recipient, undefined);
      assert.strictEqual(decoded.broadcast, undefined);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.prv, undefined);
    });

    it('should validate body with tokenContractAddress', function () {
      const validBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.tokenContractAddress, validBody.tokenContractAddress);
      assert.strictEqual(decoded.recipient, undefined);
      assert.strictEqual(decoded.broadcast, undefined);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.prv, undefined);
    });

    it('should validate body with recipient', function () {
      const validBody = {
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.recipient, validBody.recipient);
      assert.strictEqual(decoded.tokenContractAddress, undefined);
    });

    it('should validate body with broadcast', function () {
      const validBody = {
        broadcast: true,
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.broadcast, validBody.broadcast);
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with prv', function () {
      const validBody = {
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.prv, validBody.prv);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        tokenContractAddress: '0x1234567890123456789012345678901234567890',
        recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        broadcast: true,
        walletPassphrase: 'mySecurePassphrase',
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(RecoverTokenBody), validBody);
      assert.strictEqual(decoded.tokenContractAddress, validBody.tokenContractAddress);
      assert.strictEqual(decoded.recipient, validBody.recipient);
      assert.strictEqual(decoded.broadcast, validBody.broadcast);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.prv, validBody.prv);
    });

    it('should reject body with non-string tokenContractAddress', function () {
      const invalidBody = {
        tokenContractAddress: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });

    it('should reject body with non-string recipient', function () {
      const invalidBody = {
        recipient: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });

    it('should reject body with non-boolean broadcast', function () {
      const invalidBody = {
        broadcast: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });

    it('should reject body with non-string prv', function () {
      const invalidBody = {
        prv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(RecoverTokenBody), invalidBody);
      });
    });
  });

  describe('RecoverTokenResponse', function () {
    it('should validate response with required fields', function () {
      const validResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      const decoded = assertDecode(RecoverTokenResponse, validResponse);
      assert.strictEqual(decoded.halfSigned.expireTime, validResponse.halfSigned.expireTime);
      assert.strictEqual(decoded.halfSigned.contractSequenceId, validResponse.halfSigned.contractSequenceId);
      assert.strictEqual(decoded.halfSigned.operationHash, validResponse.halfSigned.operationHash);
      assert.strictEqual(decoded.halfSigned.signature, validResponse.halfSigned.signature);
      assert.strictEqual(decoded.halfSigned.gasLimit, validResponse.halfSigned.gasLimit);
      assert.strictEqual(decoded.halfSigned.gasPrice, validResponse.halfSigned.gasPrice);
      assert.strictEqual(decoded.halfSigned.tokenContractAddress, validResponse.halfSigned.tokenContractAddress);
      assert.strictEqual(decoded.halfSigned.walletId, validResponse.halfSigned.walletId);
      assert.deepStrictEqual(decoded.halfSigned.recipient, validResponse.halfSigned.recipient);
    });

    it('should reject response with missing halfSigned', function () {
      const invalidResponse = {};

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing expireTime in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing contractSequenceId in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing operationHash in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing signature in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing gasLimit in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing gasPrice in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing tokenContractAddress in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with missing walletId in halfSigned', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    // Note: recipient field is typed as t.unknown which accepts any value (including undefined)
    // because the recipient structure is complex and varies. Therefore, we don't test for missing recipient.

    it('should reject response with non-number expireTime', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: '1672531199', // string instead of number
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-number contractSequenceId', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: '1', // string instead of number
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-string operationHash', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: 123, // number instead of string
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-string signature', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature: 123, // number instead of string
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-number gasLimit', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: '100000', // string instead of number
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-number gasPrice', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: '20000000000', // string instead of number
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-string tokenContractAddress', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: 123, // number instead of string
          walletId: '123456789abcdef',
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });

    it('should reject response with non-string walletId', function () {
      const invalidResponse = {
        halfSigned: {
          recipient: { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: '1000000' },
          expireTime: 1672531199,
          contractSequenceId: 1,
          operationHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
          gasLimit: 100000,
          gasPrice: 20000000000,
          tokenContractAddress: '0x1234567890123456789012345678901234567890',
          walletId: 123, // number instead of string
        },
      };

      assert.throws(() => {
        assertDecode(RecoverTokenResponse, invalidResponse);
      });
    });
  });

  describe('PostWalletRecoverToken route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostWalletRecoverToken.path, '/api/v2/{coin}/wallet/{id}/recovertoken');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostWalletRecoverToken.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostWalletRecoverToken.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostWalletRecoverToken.response[200]);
      assert.ok(PostWalletRecoverToken.response[400]);
    });
  });
});
