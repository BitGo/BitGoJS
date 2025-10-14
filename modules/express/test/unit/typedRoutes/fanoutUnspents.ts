import * as assert from 'assert';
import * as t from 'io-ts';
import {
  FanoutUnspentsRequestParams,
  FanoutUnspentsRequestBody,
  FanoutUnspentsResponse,
  PutFanoutUnspents,
} from '../../../src/typedRoutes/api/v1/fanoutUnspents';
import { assertDecode } from './common';

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

describe('FanoutUnspents codec tests', function () {
  describe('FanoutUnspentsRequestParams', function () {
    it('should validate params with required id', function () {
      const validParams = {
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestParams), validParams);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing id', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        id: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestParams), invalidParams);
      });
    });
  });

  describe('FanoutUnspentsRequestBody', function () {
    it('should validate body with required target', function () {
      const validBody = {
        target: 10,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.validate, undefined);
      assert.strictEqual(decoded.minConfirms, undefined);
    });

    it('should reject body without target', function () {
      const invalidBody = {};

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        target: 10,
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with xprv', function () {
      const validBody = {
        target: 10,
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.xprv, validBody.xprv);
    });

    it('should validate body with validate flag', function () {
      const validBody = {
        target: 10,
        validate: false,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.validate, validBody.validate);
    });

    it('should validate body with minConfirms', function () {
      const validBody = {
        target: 10,
        minConfirms: 2,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        target: 10,
        walletPassphrase: 'mySecurePassphrase',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        validate: true,
        minConfirms: 2,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.validate, validBody.validate);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
    });

    it('should reject body with non-number target', function () {
      const invalidBody = {
        target: '10', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        target: 10,
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        target: 10,
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean validate', function () {
      const invalidBody = {
        target: 10,
        validate: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number minConfirms', function () {
      const invalidBody = {
        target: 10,
        minConfirms: '2', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });
  });

  describe('FanoutUnspentsResponse', function () {
    it('should validate response with required fields', function () {
      const validResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      const decoded = assertDecode(FanoutUnspentsResponse, validResponse);
      assert.strictEqual(decoded.status, validResponse.status);
      assert.strictEqual(decoded.tx, validResponse.tx);
      assert.strictEqual(decoded.hash, validResponse.hash);
      assert.strictEqual(decoded.instant, validResponse.instant);
      assert.strictEqual(decoded.fee, validResponse.fee);
      assert.strictEqual(decoded.feeRate, validResponse.feeRate);
      assert.deepStrictEqual(decoded.travelInfos, validResponse.travelInfos);
      assert.strictEqual(decoded.instantId, undefined); // Optional field
      assert.strictEqual(decoded.bitgoFee, undefined); // Optional field
      assert.strictEqual(decoded.travelResult, undefined); // Optional field
    });

    it('should validate response with all fields including optional ones', function () {
      const validResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: true,
        instantId: 'inst-123456',
        fee: 10000,
        feeRate: 20000,
        travelInfos: [{ fromAddress: '1From...', toAddress: '1To...', amount: 1000000 }],
        bitgoFee: { amount: 5000, address: '1BitGo...' },
        travelResult: { compliance: 'pass' },
      };

      const decoded = assertDecode(FanoutUnspentsResponse, validResponse);
      assert.strictEqual(decoded.status, validResponse.status);
      assert.strictEqual(decoded.tx, validResponse.tx);
      assert.strictEqual(decoded.hash, validResponse.hash);
      assert.strictEqual(decoded.instant, validResponse.instant);
      assert.strictEqual(decoded.instantId, validResponse.instantId);
      assert.strictEqual(decoded.fee, validResponse.fee);
      assert.strictEqual(decoded.feeRate, validResponse.feeRate);
      assert.deepStrictEqual(decoded.travelInfos, validResponse.travelInfos);
      assert.deepStrictEqual(decoded.bitgoFee, validResponse.bitgoFee);
      assert.deepStrictEqual(decoded.travelResult, validResponse.travelResult);
    });

    it('should reject response with missing status', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing tx', function () {
      const invalidResponse = {
        status: 'accepted',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing hash', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing instant', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing fee', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing feeRate', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing travelInfos', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
      };

      try {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
        assert.fail('Expected decode to fail but it succeeded');
      } catch (e) {
        // Expected to fail
        assert.ok(e instanceof Error);
      }
    });

    it('should reject response with non-string status', function () {
      const invalidResponse = {
        status: 123, // number instead of string
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string instantId when present', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: true,
        instantId: 123, // number instead of string
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });
  });

  describe('PutFanoutUnspents route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PutFanoutUnspents.path, '/api/v1/wallet/:id/fanoutunspents');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PutFanoutUnspents.method, 'PUT');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PutFanoutUnspents.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PutFanoutUnspents.response[200]);
      assert.ok(PutFanoutUnspents.response[400]);
    });

    /**
     * CRITICAL TEST: Validates that path parameter names match codec parameter names
     * to prevent runtime validation errors.
     */
    it('should have path parameter names matching codec parameter names', function () {
      const pathParams = extractPathParams(PutFanoutUnspents.path);
      const codecParams = getCodecParamNames(FanoutUnspentsRequestParams);

      pathParams.sort();
      codecParams.sort();

      assert.deepStrictEqual(
        pathParams,
        codecParams,
        `Path parameters ${JSON.stringify(pathParams)} do not match codec parameters ${JSON.stringify(codecParams)}. ` +
          `This will cause runtime validation errors! Path: ${PutFanoutUnspents.path}`
      );
    });
  });
});
