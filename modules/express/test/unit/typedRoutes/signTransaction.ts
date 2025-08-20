import * as assert from 'assert';
import * as t from 'io-ts';
import {
  signTransactionRequestParams,
  signTransactionRequestBody,
  PostSignTransaction,
} from '../../../src/typedRoutes/api/v1/signTransaction';
import { assertDecode } from './common';

describe('SignTransaction codec tests', function () {
  describe('signTransactionRequestParams', function () {
    it('should validate valid params', function () {
      const validParams = {
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(signTransactionRequestParams), validParams);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing id', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        id: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestParams), invalidParams);
      });
    });
  });

  describe('signTransactionRequestBody', function () {
    it('should validate body with all required fields', function () {
      const validBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
          otherProperty: 'someValue',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      const decoded = assertDecode(t.type(signTransactionRequestBody), validBody);
      assert.strictEqual(decoded.transactionHex, validBody.transactionHex);
      assert.deepStrictEqual(decoded.unspents, validBody.unspents);
      assert.deepStrictEqual(decoded.keychain, validBody.keychain);
      assert.strictEqual(decoded.signingKey, validBody.signingKey);
      assert.strictEqual(decoded.validate, undefined); // Optional field
    });

    it('should validate body with all fields including optional ones', function () {
      const validBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
        validate: true,
      };

      const decoded = assertDecode(t.type(signTransactionRequestBody), validBody);
      assert.strictEqual(decoded.transactionHex, validBody.transactionHex);
      assert.deepStrictEqual(decoded.unspents, validBody.unspents);
      assert.deepStrictEqual(decoded.keychain, validBody.keychain);
      assert.strictEqual(decoded.signingKey, validBody.signingKey);
      assert.strictEqual(decoded.validate, validBody.validate);
    });

    it('should reject body with missing transactionHex', function () {
      const invalidBody = {
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });

    it('should reject body with missing unspents', function () {
      const invalidBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });

    it('should reject body with missing keychain', function () {
      const invalidBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });

    it('should reject body with missing signingKey', function () {
      const invalidBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string transactionHex', function () {
      const invalidBody = {
        transactionHex: 12345, // number instead of string
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });

    it('should reject body with non-array unspents', function () {
      const invalidBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: 'not an array', // string instead of array
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });

    it('should reject body with invalid keychain (missing xprv)', function () {
      const invalidBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          // missing xprv
          otherProperty: 'someValue',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string signingKey', function () {
      const invalidBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean validate', function () {
      const invalidBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
        validate: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(signTransactionRequestBody), invalidBody);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle empty strings for string fields', function () {
      const body = {
        transactionHex: '',
        unspents: [],
        keychain: {
          xprv: '',
        },
        signingKey: '',
      };

      const decoded = assertDecode(t.type(signTransactionRequestBody), body);
      assert.strictEqual(decoded.transactionHex, '');
      assert.deepStrictEqual(decoded.unspents, []);
      assert.deepStrictEqual(decoded.keychain, { xprv: '' });
      assert.strictEqual(decoded.signingKey, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(signTransactionRequestBody)), body);
      assert.strictEqual(decoded.transactionHex, body.transactionHex);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('PostSignTransaction route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostSignTransaction.path, '/api/v1/wallet/{id}/signtransaction');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostSignTransaction.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostSignTransaction.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostSignTransaction.response[200]);
      assert.ok(PostSignTransaction.response[400]);
    });
  });
});
