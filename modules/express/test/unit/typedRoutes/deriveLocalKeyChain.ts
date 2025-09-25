import * as assert from 'assert';
import * as t from 'io-ts';
import {
  DeriveLocalKeyChainRequestBody,
  DeriveLocalKeyChainResponse,
  PostDeriveLocalKeyChain,
} from '../../../src/typedRoutes/api/v1/deriveLocalKeyChain';
import { assertDecode } from './common';

describe('DeriveLocalKeyChain codec tests', function () {
  describe('DeriveLocalKeyChainRequestBody', function () {
    it('should validate body with required path and xprv', function () {
      const validBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(DeriveLocalKeyChainRequestBody), validBody);
      assert.strictEqual(decoded.path, validBody.path);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.xpub, undefined); // Optional field
    });

    it('should validate body with required path and xpub', function () {
      const validBody = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const decoded = assertDecode(t.type(DeriveLocalKeyChainRequestBody), validBody);
      assert.strictEqual(decoded.path, validBody.path);
      assert.strictEqual(decoded.xpub, validBody.xpub);
      assert.strictEqual(decoded.xprv, undefined); // Optional field
    });

    it('should reject body with missing path', function () {
      const invalidBody = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      assert.throws(() => {
        assertDecode(t.type(DeriveLocalKeyChainRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string path', function () {
      const invalidBody = {
        path: 123, // number instead of string
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      assert.throws(() => {
        assertDecode(t.type(DeriveLocalKeyChainRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        path: 'm/0/1',
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(DeriveLocalKeyChainRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xpub', function () {
      const invalidBody = {
        path: 'm/0/1',
        xpub: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(DeriveLocalKeyChainRequestBody), invalidBody);
      });
    });

    // Note: The validation that either xprv or xpub must be provided is handled by the implementation,
    // not by the io-ts codec, so we don't test for that here.
  });

  describe('DeriveLocalKeyChainResponse', function () {
    it('should validate response with all required fields', function () {
      const validResponse = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const decoded = assertDecode(DeriveLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.path, validResponse.path);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
      assert.strictEqual(decoded.xprv, undefined); // Optional field
      assert.strictEqual(decoded.ethAddress, undefined); // Optional field
    });

    it('should validate response with all fields including optional ones', function () {
      const validResponse = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        ethAddress: '0x1234567890123456789012345678901234567890',
      };

      const decoded = assertDecode(DeriveLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.path, validResponse.path);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
      assert.strictEqual(decoded.xprv, validResponse.xprv);
      assert.strictEqual(decoded.ethAddress, validResponse.ethAddress);
    });

    it('should reject response with missing path', function () {
      const invalidResponse = {
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with missing xpub', function () {
      const invalidResponse = {
        path: 'm/0/1',
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string path', function () {
      const invalidResponse = {
        path: 123, // number instead of string
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string xpub', function () {
      const invalidResponse = {
        path: 'm/0/1',
        xpub: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string xprv', function () {
      const invalidResponse = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string ethAddress', function () {
      const invalidResponse = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        ethAddress: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle empty strings for string fields', function () {
      const body = {
        path: '',
        xprv: '',
      };

      const decoded = assertDecode(t.type(DeriveLocalKeyChainRequestBody), body);
      assert.strictEqual(decoded.path, '');
      assert.strictEqual(decoded.xprv, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(DeriveLocalKeyChainRequestBody)), body);
      assert.strictEqual(decoded.path, body.path);
      assert.strictEqual(decoded.xprv, body.xprv);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('PostDeriveLocalKeyChain route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostDeriveLocalKeyChain.path, '/api/v1/keychain/derive');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostDeriveLocalKeyChain.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostDeriveLocalKeyChain.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostDeriveLocalKeyChain.response[200]);
      assert.ok(PostDeriveLocalKeyChain.response[400]);
    });
  });
});
