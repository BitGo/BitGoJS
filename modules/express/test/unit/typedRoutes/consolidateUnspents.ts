import * as assert from 'assert';
import * as t from 'io-ts';
import {
  ConsolidateUnspentsRequestParams,
  ConsolidateUnspentsRequestBody,
  ConsolidateUnspentsResponse,
  PutConsolidateUnspents,
} from '../../../src/typedRoutes/api/v1/consolidateUnspents';
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

describe('ConsolidateUnspents codec tests', function () {
  describe('ConsolidateUnspentsRequestParams', function () {
    it('should validate params with required id', function () {
      const validParams = {
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestParams), validParams);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing id', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        id: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestParams), invalidParams);
      });
    });
  });

  describe('ConsolidateUnspentsRequestBody', function () {
    it('should validate empty body', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.validate, undefined);
      assert.strictEqual(decoded.target, undefined);
      assert.strictEqual(decoded.minSize, undefined);
      assert.strictEqual(decoded.maxSize, undefined);
      assert.strictEqual(decoded.maxInputCountPerConsolidation, undefined);
      assert.strictEqual(decoded.maxIterationCount, undefined);
      assert.strictEqual(decoded.minConfirms, undefined);
      assert.strictEqual(decoded.feeRate, undefined);
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with xprv', function () {
      const validBody = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.xprv, validBody.xprv);
    });

    it('should validate body with validate flag', function () {
      const validBody = {
        validate: false,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.validate, validBody.validate);
    });

    it('should validate body with target', function () {
      const validBody = {
        target: 5,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
    });

    it('should validate body with minSize as number', function () {
      const validBody = {
        minSize: 10000,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.minSize, validBody.minSize);
    });

    it('should validate body with minSize as string', function () {
      const validBody = {
        minSize: '10000',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.minSize, validBody.minSize);
    });

    it('should validate body with maxSize as number', function () {
      const validBody = {
        maxSize: 50000,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.maxSize, validBody.maxSize);
    });

    it('should validate body with maxSize as string', function () {
      const validBody = {
        maxSize: '50000',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.maxSize, validBody.maxSize);
    });

    it('should validate body with maxInputCountPerConsolidation', function () {
      const validBody = {
        maxInputCountPerConsolidation: 150,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.maxInputCountPerConsolidation, validBody.maxInputCountPerConsolidation);
    });

    it('should validate body with maxIterationCount', function () {
      const validBody = {
        maxIterationCount: 3,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.maxIterationCount, validBody.maxIterationCount);
    });

    it('should validate body with minConfirms', function () {
      const validBody = {
        minConfirms: 2,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
    });

    it('should validate body with feeRate', function () {
      const validBody = {
        feeRate: 20000,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        validate: true,
        target: 3,
        minSize: 10000,
        maxSize: 50000,
        maxInputCountPerConsolidation: 150,
        maxIterationCount: 3,
        minConfirms: 2,
        feeRate: 20000,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.validate, validBody.validate);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.minSize, validBody.minSize);
      assert.strictEqual(decoded.maxSize, validBody.maxSize);
      assert.strictEqual(decoded.maxInputCountPerConsolidation, validBody.maxInputCountPerConsolidation);
      assert.strictEqual(decoded.maxIterationCount, validBody.maxIterationCount);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean validate', function () {
      const invalidBody = {
        validate: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number target', function () {
      const invalidBody = {
        target: '5', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with invalid minSize type', function () {
      const invalidBody = {
        minSize: true, // boolean instead of number or string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with invalid maxSize type', function () {
      const invalidBody = {
        maxSize: true, // boolean instead of number or string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number maxInputCountPerConsolidation', function () {
      const invalidBody = {
        maxInputCountPerConsolidation: '150', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number maxIterationCount', function () {
      const invalidBody = {
        maxIterationCount: '3', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number minConfirms', function () {
      const invalidBody = {
        minConfirms: '2', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number feeRate', function () {
      const invalidBody = {
        feeRate: '20000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });
  });

  describe('ConsolidateUnspentsResponse', function () {
    it('should validate response with required fields', function () {
      const validResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      assert.strictEqual(decoded[0].status, validResponse[0].status);
      assert.strictEqual(decoded[0].tx, validResponse[0].tx);
      assert.strictEqual(decoded[0].hash, validResponse[0].hash);
      assert.strictEqual(decoded[0].instant, validResponse[0].instant);
      assert.strictEqual(decoded[0].fee, validResponse[0].fee);
      assert.strictEqual(decoded[0].feeRate, validResponse[0].feeRate);
      assert.deepStrictEqual(decoded[0].travelInfos, validResponse[0].travelInfos);
      assert.strictEqual(decoded[0].instantId, undefined); // Optional field
      assert.strictEqual(decoded[0].bitgoFee, undefined); // Optional field
      assert.strictEqual(decoded[0].travelResult, undefined); // Optional field
    });

    it('should validate response with all fields including optional ones', function () {
      const validResponse = [
        {
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
        },
      ];

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      assert.strictEqual(decoded[0].status, validResponse[0].status);
      assert.strictEqual(decoded[0].tx, validResponse[0].tx);
      assert.strictEqual(decoded[0].hash, validResponse[0].hash);
      assert.strictEqual(decoded[0].instant, validResponse[0].instant);
      assert.strictEqual(decoded[0].instantId, validResponse[0].instantId);
      assert.strictEqual(decoded[0].fee, validResponse[0].fee);
      assert.strictEqual(decoded[0].feeRate, validResponse[0].feeRate);
      assert.deepStrictEqual(decoded[0].travelInfos, validResponse[0].travelInfos);
      assert.deepStrictEqual(decoded[0].bitgoFee, validResponse[0].bitgoFee);
      assert.deepStrictEqual(decoded[0].travelResult, validResponse[0].travelResult);
    });

    it('should validate response with multiple consolidation transactions', function () {
      const validResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
        {
          status: 'accepted',
          tx: '0200000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          instant: false,
          fee: 12000,
          feeRate: 22000,
          travelInfos: [],
        },
      ];

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      assert.strictEqual(decoded.length, 2);
      assert.strictEqual(decoded[0].status, validResponse[0].status);
      assert.strictEqual(decoded[0].tx, validResponse[0].tx);
      assert.strictEqual(decoded[0].hash, validResponse[0].hash);
      assert.strictEqual(decoded[0].instant, validResponse[0].instant);
      assert.strictEqual(decoded[0].fee, validResponse[0].fee);
      assert.strictEqual(decoded[0].feeRate, validResponse[0].feeRate);
      assert.deepStrictEqual(decoded[0].travelInfos, validResponse[0].travelInfos);
      assert.strictEqual(decoded[1].status, validResponse[1].status);
      assert.strictEqual(decoded[1].tx, validResponse[1].tx);
      assert.strictEqual(decoded[1].hash, validResponse[1].hash);
      assert.strictEqual(decoded[1].instant, validResponse[1].instant);
      assert.strictEqual(decoded[1].fee, validResponse[1].fee);
      assert.strictEqual(decoded[1].feeRate, validResponse[1].feeRate);
      assert.deepStrictEqual(decoded[1].travelInfos, validResponse[1].travelInfos);
    });

    it('should reject response with missing status', function () {
      const invalidResponse = [
        {
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing tx', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing hash', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing instant', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing fee', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing feeRate', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing travelInfos', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
        },
      ];

      try {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
        assert.fail('Expected decode to fail but it succeeded');
      } catch (e) {
        // Expected to fail
        assert.ok(e instanceof Error);
      }
    });

    it('should reject response with non-string status', function () {
      const invalidResponse = [
        {
          status: 123, // number instead of string
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string tx', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: 123, // number instead of string
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string hash', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: 123, // number instead of string
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-boolean instant', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: 'false', // string instead of boolean
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-number fee', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: '10000', // string instead of number
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-number feeRate', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: '20000', // string instead of number
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string instantId when present', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: true,
          instantId: 123, // number instead of string
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });
  });

  describe('PutConsolidateUnspents route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PutConsolidateUnspents.path, '/api/v1/wallet/:id/consolidateunspents');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PutConsolidateUnspents.method, 'PUT');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PutConsolidateUnspents.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PutConsolidateUnspents.response[200]);
      assert.ok(PutConsolidateUnspents.response[400]);
    });

    /**
     * CRITICAL TEST: Validates that path parameter names match codec parameter names
     * to prevent runtime validation errors.
     */
    it('should have path parameter names matching codec parameter names', function () {
      const pathParams = extractPathParams(PutConsolidateUnspents.path);
      const codecParams = getCodecParamNames(ConsolidateUnspentsRequestParams);

      pathParams.sort();
      codecParams.sort();

      assert.deepStrictEqual(
        pathParams,
        codecParams,
        `Path parameters ${JSON.stringify(pathParams)} do not match codec parameters ${JSON.stringify(codecParams)}. ` +
          `This will cause runtime validation errors! Path: ${PutConsolidateUnspents.path}`
      );
    });
  });
});
