import * as assert from 'assert';
import * as t from 'io-ts';
import {
  CreateLocalKeyChainRequestBody,
  CreateLocalKeyChainResponse,
  PostCreateLocalKeyChain,
} from '../../../src/typedRoutes/api/v1/createLocalKeyChain';
import { assertDecode } from './common';

describe('CreateLocalKeyChain codec tests', function () {
  describe('CreateLocalKeyChainRequestBody', function () {
    it('should validate body with optional seed', function () {
      const validBody = {
        seed: 'some-seed-value',
      };

      const decoded = assertDecode(t.type(CreateLocalKeyChainRequestBody), validBody);
      assert.strictEqual(decoded.seed, validBody.seed);
    });

    it('should validate body with no parameters', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(CreateLocalKeyChainRequestBody), validBody);
      assert.strictEqual(decoded.seed, undefined); // Optional field
    });

    it('should reject body with non-string seed', function () {
      const invalidBody = {
        seed: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(CreateLocalKeyChainRequestBody), invalidBody);
      });
    });
  });

  describe('CreateLocalKeyChainResponse', function () {
    it('should validate response with required fields', function () {
      const validResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const decoded = assertDecode(CreateLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.xprv, validResponse.xprv);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
      assert.strictEqual(decoded.ethAddress, undefined); // Optional field
    });

    it('should validate response with all fields including optional ones', function () {
      const validResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        ethAddress: '0x1234567890123456789012345678901234567890',
      };

      const decoded = assertDecode(CreateLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.xprv, validResponse.xprv);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
      assert.strictEqual(decoded.ethAddress, validResponse.ethAddress);
    });

    it('should reject response with missing xprv', function () {
      const invalidResponse = {
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with missing xpub', function () {
      const invalidResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string xprv', function () {
      const invalidResponse = {
        xprv: 123, // number instead of string
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string xpub', function () {
      const invalidResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string ethAddress', function () {
      const invalidResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        ethAddress: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, invalidResponse);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle empty strings for string fields', function () {
      const body = {
        seed: '',
      };

      const decoded = assertDecode(t.type(CreateLocalKeyChainRequestBody), body);
      assert.strictEqual(decoded.seed, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        seed: 'some-seed-value',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(CreateLocalKeyChainRequestBody)), body);
      assert.strictEqual(decoded.seed, body.seed);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });
  describe('PostCreateLocalKeyChain route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostCreateLocalKeyChain.path, '/api/v1/keychain/local');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostCreateLocalKeyChain.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostCreateLocalKeyChain.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostCreateLocalKeyChain.response[200]);
      assert.ok(PostCreateLocalKeyChain.response[400]);
    });
  });
});
