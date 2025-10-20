import * as assert from 'assert';
import * as t from 'io-ts';
import {
  signTransactionRequestParams,
  signTransactionRequestBody,
  PostSignTransaction,
} from '../../../src/typedRoutes/api/v1/signTransaction';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

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

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('SignTransaction Supertest Integration Tests', function () {
    const agent = setupAgent();
    const walletId = '5a1341e7c8421dc90710673b3166bbd5';

    const mockSignedTransaction = {
      tx: '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c00000000b5483045022100f4f8c8e8d4c7e3b5c3f4e5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6022074f8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8014104f8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully sign a transaction', async function () {
      const requestBody = {
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
      };

      // Create mock wallet with signTransaction method
      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      // Create mock wallets object
      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      // Stub BitGo.prototype.wallets to return our mock wallets
      const walletsStub = sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');
      assert.strictEqual(result.body.tx, mockSignedTransaction.tx);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(walletsStub.calledOnce, true);
      assert.strictEqual(mockWallets.get.calledOnceWith({ id: walletId }), true);
      assert.strictEqual(mockWallet.signTransaction.calledOnce, true);

      // Verify the request body was passed correctly
      const signTransactionCall = mockWallet.signTransaction.getCall(0);
      assert.deepStrictEqual(signTransactionCall.args[0], requestBody);
    });

    it('should successfully sign a transaction with validate flag', async function () {
      const requestBody = {
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

      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');
      assert.strictEqual(mockWallet.signTransaction.calledOnce, true);

      // Verify validate flag was passed
      const signTransactionCall = mockWallet.signTransaction.getCall(0);
      assert.strictEqual(signTransactionCall.args[0].validate, true);
    });

    it('should successfully sign transaction with additional keychain properties', async function () {
      const requestBody = {
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
          xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
          path: 'm/0',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');
      assert.strictEqual(mockWallet.signTransaction.calledOnce, true);
    });

    it('should sign transaction with multiple unspents', async function () {
      const requestBody = {
        transactionHex:
          '0100000002c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffffd9f8e7d6c5b4a3928170605d4e3c2b1a09f8e7d6c5b4a392817060500000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
          },
          {
            chainPath: 'm/0/1',
            redeemScript:
              '522103a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b22102b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c22103c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d253ae',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');

      // Verify multiple unspents were passed correctly
      const signTransactionCall = mockWallet.signTransaction.getCall(0);
      assert.strictEqual(signTransactionCall.args[0].unspents.length, 2);
    });
  });

  // ==========================================
  // ERROR TESTS
  // ==========================================

  describe('SignTransaction Error Tests', function () {
    const agent = setupAgent();
    const walletId = '5a1341e7c8421dc90710673b3166bbd5';

    afterEach(function () {
      sinon.restore();
    });

    it('should handle wallet not found error', async function () {
      const requestBody = {
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
      };

      // Stub wallets().get() to reject with wallet not found error
      const mockWallets = {
        get: sinon.stub().rejects(new Error('Wallet not found')),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response
      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle signTransaction failure with invalid private key', async function () {
      const requestBody = {
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
          xprv: 'invalid_xprv_key',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      // Create mock wallet where signTransaction fails
      const mockWallet = {
        signTransaction: sinon.stub().rejects(new Error('Invalid private key for signing')),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response
      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle signTransaction failure with invalid transaction hex', async function () {
      const requestBody = {
        transactionHex: 'invalid_hex_data',
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

      const mockWallet = {
        signTransaction: sinon.stub().rejects(new Error('Invalid transaction hex format')),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle signTransaction failure with mismatched unspents', async function () {
      const requestBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [], // Empty unspents array
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      const mockWallet = {
        signTransaction: sinon
          .stub()
          .rejects(new Error('Number of unspents does not match number of transaction inputs')),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should reject request with empty body', async function () {
      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send({});

      // io-ts validation should fail
      assert.ok(result.status >= 400);
    });

    it('should reject request with missing transactionHex', async function () {
      const requestBody = {
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

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should reject request with missing unspents', async function () {
      const requestBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should reject request with missing keychain', async function () {
      const requestBody = {
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

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should reject request with missing signingKey', async function () {
      const requestBody = {
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

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should reject request with invalid body types', async function () {
      const requestBody = {
        transactionHex: 12345, // number instead of string
        unspents: 'not-an-array', // string instead of array
        keychain: 'not-an-object', // string instead of object
        signingKey: 12345, // number instead of string
      };

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should handle malformed JSON', async function () {
      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      assert.ok(result.status >= 400);
    });

    it('should handle missing authentication', async function () {
      const requestBody = {
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
      };

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should fail with authentication error
      assert.strictEqual(result.status, 401);
    });
  });

  // ==========================================
  // EDGE CASE TESTS
  // ==========================================

  describe('SignTransaction Edge Case Tests', function () {
    const agent = setupAgent();
    const walletId = '5a1341e7c8421dc90710673b3166bbd5';

    const mockSignedTransaction = {
      tx: '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c00000000b5483045022100f4f8c8e8d4c7e3b5c3f4e5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6022074f8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8014104f8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should handle very long wallet ID', async function () {
      const veryLongWalletId = 'a'.repeat(1000);
      const requestBody = {
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
      };

      const mockWallets = {
        get: sinon.stub().rejects(new Error('Invalid wallet ID')),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${veryLongWalletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should handle gracefully
      assert.ok(result.status >= 400);
    });

    it('should handle wallet ID with special characters', async function () {
      const specialCharWalletId = '../../../etc/passwd';
      const requestBody = {
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
      };

      const mockWallets = {
        get: sinon.stub().rejects(new Error('Invalid wallet ID')),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${encodeURIComponent(specialCharWalletId)}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should handle special characters safely
      assert.ok(result.status >= 400);
    });

    it('should handle empty string fields', async function () {
      const requestBody = {
        transactionHex: '',
        unspents: [],
        keychain: {
          xprv: '',
        },
        signingKey: '',
      };

      const mockWallet = {
        signTransaction: sinon.stub().rejects(new Error('Invalid transaction data')),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should fail with server error due to invalid transaction data
      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle very long transaction hex', async function () {
      const veryLongHex = '01' + '00'.repeat(100000); // Very long hex string
      const requestBody = {
        transactionHex: veryLongHex,
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

      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should handle large payload successfully
      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.signTransaction.calledOnce, true);
    });

    it('should handle large number of unspents', async function () {
      // Create 100 unspents
      const unspents = Array.from({ length: 100 }, (_, i) => ({
        chainPath: `m/0/${i}`,
        redeemScript:
          '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
      }));

      const requestBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: unspents,
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should handle large unspents array successfully
      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.signTransaction.calledOnce, true);
    });

    it('should handle unspents with complex objects', async function () {
      const requestBody = {
        transactionHex:
          '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c0000000000ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        unspents: [
          {
            chainPath: 'm/0/0',
            redeemScript:
              '522103b31347f19510acbc7f50822ac4093ca80554946c471b43eb937d0c9118d1122d2102cd3787d12af6eb87e7b9af00118a225e2ce663a5c94f555460ae131139a2afee2103bd558669de622fc57a8157f449c52254218dfe4e843f58b214b710c4c36833c153ae',
            // Additional properties
            value: 100000,
            address: '1ABC123XYZ',
            index: 0,
            txid: 'abc123def456',
          },
        ],
        keychain: {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should handle additional properties in unspents successfully
      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.signTransaction.calledOnce, true);
    });

    it('should handle keychain with many additional properties', async function () {
      const requestBody = {
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
          xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
          path: 'm/0',
          encryptedPrv: 'encrypted_key_data',
          source: 'user',
          type: 'independent',
          isBitGo: false,
        },
        signingKey: 'L1WKFfxHbVdnqMf6HhNnLhM6hZxewJgBhRbKYoXTQqQaP1oyGZCj',
      };

      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should handle additional keychain properties
      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.signTransaction.calledOnce, true);
    });

    it('should handle validate flag set to false', async function () {
      const requestBody = {
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
        validate: false,
      };

      const mockWallet = {
        signTransaction: sinon.stub().resolves(mockSignedTransaction),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify validate flag was passed correctly
      const signTransactionCall = mockWallet.signTransaction.getCall(0);
      assert.strictEqual(signTransactionCall.args[0].validate, false);
    });

    it('should handle response with different structure', async function () {
      const requestBody = {
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
      };

      // Response with additional properties
      const customResponse = {
        tx: '0100000001c7a6e16e2bcf94fba6e0a5839b7accd93f2d684b4b7d97a75a6c3b9b79644f0c00000000b5483045022100f4f8c8e8d4c7e3b5c3f4e5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6022074f8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8014104f8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3ffffffff0188130000000000001976a914385ed68a0d08c9d34553774be5ee8d5ce2261fce88ac00000000',
        signatureShares: ['share1', 'share2'],
        halfSigned: false,
        walletId: walletId,
      };

      const mockWallet = {
        signTransaction: sinon.stub().resolves(customResponse),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/wallet/${walletId}/signtransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should accept response with additional properties
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');
      result.body.should.have.property('signatureShares');
      result.body.should.have.property('halfSigned');
      result.body.should.have.property('walletId');
      assert.strictEqual(result.body.halfSigned, false);
      assert.strictEqual(result.body.walletId, walletId);
    });
  });
});
