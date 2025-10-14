import * as assert from 'assert';
import * as t from 'io-ts';
import {
  AcceptShareRequestParams,
  AcceptShareRequestBody,
  PostAcceptShare,
} from '../../../src/typedRoutes/api/v1/acceptShare';

/**
 * Helper function to test io-ts codec decoding
 */
export function assertDecode<T>(codec: t.Type<T, unknown>, input: unknown): T {
  const result = codec.decode(input);
  if (result._tag === 'Left') {
    const errors = JSON.stringify(result.left, null, 2);
    assert.fail(`Decode failed with errors:\n${errors}`);
  }
  return result.right;
}

/**
 * Helper function to extract path parameter names from a route path
 * Supports both Express-style (:param) and OpenAPI-style ({param}) notation
 */
function extractPathParams(path: string): string[] {
  const colonParams = path.match(/:(\w+)/g)?.map((p) => p.slice(1)) || [];
  const braceParams = path.match(/\{(\w+)\}/g)?.map((p) => p.slice(1, -1)) || [];
  return [...colonParams, ...braceParams];
}

/**
 * Helper function to get codec parameter names from a params object
 */
function getCodecParamNames(paramsCodec: Record<string, any>): string[] {
  return Object.keys(paramsCodec);
}

describe('AcceptShare codec tests', function () {
  describe('AcceptShareRequestParams', function () {
    it('should validate valid params', function () {
      const validParams = {
        shareId: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(AcceptShareRequestParams), validParams);
      assert.strictEqual(decoded.shareId, validParams.shareId);
    });

    it('should reject params with missing shareId', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(AcceptShareRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string shareId', function () {
      const invalidParams = {
        shareId: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(AcceptShareRequestParams), invalidParams);
      });
    });
  });

  describe('AcceptShareRequestBody', function () {
    it('should validate body with all fields', function () {
      const validBody = {
        userPassword: 'mySecurePassword',
        newWalletPassphrase: 'myNewPassphrase',
        overrideEncryptedXprv: 'encryptedXprvString',
      };

      const decoded = assertDecode(t.type(AcceptShareRequestBody), validBody);
      assert.strictEqual(decoded.userPassword, validBody.userPassword);
      assert.strictEqual(decoded.newWalletPassphrase, validBody.newWalletPassphrase);
      assert.strictEqual(decoded.overrideEncryptedXprv, validBody.overrideEncryptedXprv);
    });

    it('should validate empty body since all fields are optional', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(AcceptShareRequestBody), validBody);
      assert.strictEqual(decoded.userPassword, undefined);
      assert.strictEqual(decoded.newWalletPassphrase, undefined);
      assert.strictEqual(decoded.overrideEncryptedXprv, undefined);
    });

    it('should reject body with non-string optional fields', function () {
      const invalidBody = {
        userPassword: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(AcceptShareRequestBody), invalidBody);
      });
    });
  });

  describe('Edge cases', function () {
    describe('PostAcceptShare route definition', function () {
      it('should have the correct path', function () {
        assert.strictEqual(PostAcceptShare.path, '/api/v1/walletshare/{shareId}/acceptShare');
      });

      it('should have the correct HTTP method', function () {
        assert.strictEqual(PostAcceptShare.method, 'POST');
      });

      it('should have the correct request configuration', function () {
        // Verify the route is configured with a request property
        assert.ok(PostAcceptShare.request);
      });

      it('should have the correct response types', function () {
        // Check that the response object has the expected status codes
        assert.ok(PostAcceptShare.response[200]);
        assert.ok(PostAcceptShare.response[400]);
      });

      /**
       * CRITICAL TEST: Validates that path parameter names match codec parameter names
       * to prevent runtime validation errors.
       */
      it('should have path parameter names matching codec parameter names', function () {
        const pathParams = extractPathParams(PostAcceptShare.path);
        const codecParams = getCodecParamNames(AcceptShareRequestParams);

        pathParams.sort();
        codecParams.sort();

        assert.deepStrictEqual(
          pathParams,
          codecParams,
          `Path parameters ${JSON.stringify(pathParams)} do not match codec parameters ${JSON.stringify(
            codecParams
          )}. ` + `This will cause runtime validation errors! Path: ${PostAcceptShare.path}`
        );
      });
    });

    it('should handle empty strings for optional fields', function () {
      const body = {
        userPassword: '',
        newWalletPassphrase: '',
        overrideEncryptedXprv: '',
      };

      const decoded = assertDecode(t.type(AcceptShareRequestBody), body);
      assert.strictEqual(decoded.userPassword, '');
      assert.strictEqual(decoded.newWalletPassphrase, '');
      assert.strictEqual(decoded.overrideEncryptedXprv, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        userPassword: 'password123',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(AcceptShareRequestBody)), body);
      assert.strictEqual(decoded.userPassword, 'password123');
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });
});
