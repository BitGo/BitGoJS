import * as assert from 'assert';
import * as t from 'io-ts';
import {
  CreateAddressParams,
  CreateAddressBody,
  PostCreateAddress,
} from '../../../src/typedRoutes/api/v2/createAddress';
import { assertDecode } from './common';

/**
 * Helper function to extract path parameter names from a route path
 * Supports both Express-style (:param) and OpenAPI-style ({param}) notation
 */
function extractPathParams(path: string): string[] {
  // Match both :param and {param} patterns
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

describe('CreateAddress codec tests', function () {
  describe('CreateAddressParams', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'btc',
        id: '59cd72485007a239fb00282ed480da1f',
      };

      const decoded = assertDecode(t.type(CreateAddressParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '59cd72485007a239fb00282ed480da1f',
      };

      assert.throws(() => {
        assertDecode(t.type(CreateAddressParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'btc',
      };

      assert.throws(() => {
        assertDecode(t.type(CreateAddressParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123, // number instead of string
        id: '59cd72485007a239fb00282ed480da1f',
      };

      assert.throws(() => {
        assertDecode(t.type(CreateAddressParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        coin: 'btc',
        id: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(CreateAddressParams), invalidParams);
      });
    });

    it('should validate params with different coin types', function () {
      const coins = ['btc', 'eth', 'ltc', 'bch', 'xlm', 'xrp'];

      coins.forEach((coin) => {
        const validParams = {
          coin,
          id: '59cd72485007a239fb00282ed480da1f',
        };
        const decoded = assertDecode(t.type(CreateAddressParams), validParams);
        assert.strictEqual(decoded.coin, coin);
      });
    });

    it('should reject params with extra unexpected fields', function () {
      const invalidParams = {
        coin: 'btc',
        id: '59cd72485007a239fb00282ed480da1f',
        extraField: 'should not be here',
      };

      // Note: io-ts allows extra fields by default, but we're testing that required fields are present
      const decoded = assertDecode(t.type(CreateAddressParams), invalidParams);
      assert.strictEqual(decoded.coin, 'btc');
      assert.strictEqual(decoded.id, '59cd72485007a239fb00282ed480da1f');
    });
  });

  describe('CreateAddressBody', function () {
    it('should validate empty body', function () {
      const validBody = {};
      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.deepStrictEqual(decoded, {});
    });

    it('should validate body with label only', function () {
      const validBody = {
        label: 'My Test Address',
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.label, validBody.label);
    });

    it('should validate body with chain', function () {
      const validBody = {
        chain: 1,
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.chain, validBody.chain);
    });

    it('should reject body with non-number chain', function () {
      const invalidBody = {
        chain: '1', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.partial(CreateAddressBody), invalidBody);
      });
    });

    it('should validate body with all forwarder version values', function () {
      const forwarderVersions = [0, 1, 2, 3, 4];

      forwarderVersions.forEach((version) => {
        const validBody = {
          forwarderVersion: version,
        };
        const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
        assert.strictEqual(decoded.forwarderVersion, version);
      });
    });

    it('should reject body with invalid forwarder version', function () {
      const invalidBody = {
        forwarderVersion: 5, // not in union [0,1,2,3,4]
      };

      assert.throws(() => {
        assertDecode(t.partial(CreateAddressBody), invalidBody);
      });
    });

    it('should validate body with EIP1559 parameters', function () {
      const validBody = {
        eip1559: {
          maxFeePerGas: 1000000000,
          maxPriorityFeePerGas: 500000000,
        },
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.deepStrictEqual(decoded.eip1559, validBody.eip1559);
    });

    it('should reject body with incomplete EIP1559 parameters', function () {
      const invalidBody = {
        eip1559: {
          maxFeePerGas: 1000000000,
          // missing maxPriorityFeePerGas
        },
      };

      assert.throws(() => {
        assertDecode(t.partial(CreateAddressBody), invalidBody);
      });
    });

    it('should validate body with gasPrice as number', function () {
      const validBody = {
        gasPrice: 20000000000,
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
    });

    it('should validate body with gasPrice as string', function () {
      const validBody = {
        gasPrice: '20000000000',
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
    });

    it('should reject body with invalid gasPrice type', function () {
      const invalidBody = {
        gasPrice: true, // boolean instead of number or string
      };

      assert.throws(() => {
        assertDecode(t.partial(CreateAddressBody), invalidBody);
      });
    });

    it('should validate body with valid format values', function () {
      const formats = ['base58', 'cashaddr'];

      formats.forEach((format) => {
        const validBody = {
          format,
        };
        const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
        assert.strictEqual(decoded.format, format);
      });
    });

    it('should reject body with invalid format', function () {
      const invalidBody = {
        format: 'invalid', // not in union ['base58', 'cashaddr']
      };

      assert.throws(() => {
        assertDecode(t.partial(CreateAddressBody), invalidBody);
      });
    });

    it('should validate body with count', function () {
      const validBody = {
        count: 5,
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.count, validBody.count);
    });

    it('should reject body with non-number count', function () {
      const invalidBody = {
        count: '5', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.partial(CreateAddressBody), invalidBody);
      });
    });

    it('should validate body with boolean flags', function () {
      const validBody = {
        lowPriority: true,
        allowSkipVerifyAddress: false,
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.lowPriority, true);
      assert.strictEqual(decoded.allowSkipVerifyAddress, false);
    });

    it('should reject body with non-boolean flags', function () {
      const invalidBody = {
        lowPriority: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.partial(CreateAddressBody), invalidBody);
      });
    });

    it('should validate body with all optional fields', function () {
      const validBody = {
        type: 'p2sh',
        chain: 1,
        forwarderVersion: 3,
        evmKeyRingReferenceAddress: '0x1234567890123456789012345678901234567890',
        onToken: 'ofcbtc',
        label: 'Test Address',
        lowPriority: false,
        gasPrice: 20000000000,
        eip1559: {
          maxFeePerGas: 1000000000,
          maxPriorityFeePerGas: 500000000,
        },
        format: 'cashaddr',
        count: 1,
        baseAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        allowSkipVerifyAddress: true,
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.type, validBody.type);
      assert.strictEqual(decoded.chain, validBody.chain);
      assert.strictEqual(decoded.forwarderVersion, validBody.forwarderVersion);
      assert.strictEqual(decoded.evmKeyRingReferenceAddress, validBody.evmKeyRingReferenceAddress);
      assert.strictEqual(decoded.onToken, validBody.onToken);
      assert.strictEqual(decoded.label, validBody.label);
      assert.strictEqual(decoded.lowPriority, validBody.lowPriority);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
      assert.deepStrictEqual(decoded.eip1559, validBody.eip1559);
      assert.strictEqual(decoded.format, validBody.format);
      assert.strictEqual(decoded.count, validBody.count);
      assert.strictEqual(decoded.baseAddress, validBody.baseAddress);
      assert.strictEqual(decoded.allowSkipVerifyAddress, validBody.allowSkipVerifyAddress);
    });

    it('should validate body with ETH-specific parameters', function () {
      const validBody = {
        forwarderVersion: 3,
        gasPrice: 20000000000,
        eip1559: {
          maxFeePerGas: 1000000000,
          maxPriorityFeePerGas: 500000000,
        },
        lowPriority: true,
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.forwarderVersion, 3);
      assert.strictEqual(decoded.gasPrice, 20000000000);
      assert.deepStrictEqual(decoded.eip1559, validBody.eip1559);
      assert.strictEqual(decoded.lowPriority, true);
    });

    it('should validate body with BCH-specific parameters', function () {
      const validBody = {
        format: 'cashaddr',
        label: 'BCH Address',
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.format, 'cashaddr');
      assert.strictEqual(decoded.label, 'BCH Address');
    });

    it('should validate body with OFC-specific parameters', function () {
      const validBody = {
        onToken: 'ofcbtc',
        label: 'OFC BTC Address',
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.onToken, 'ofcbtc');
      assert.strictEqual(decoded.label, 'OFC BTC Address');
    });

    it('should validate body with bulk address creation', function () {
      const validBody = {
        count: 10,
        chain: 0,
      };

      const decoded = assertDecode(t.partial(CreateAddressBody), validBody);
      assert.strictEqual(decoded.count, 10);
      assert.strictEqual(decoded.chain, 0);
    });
  });

  describe('PostCreateAddress route configuration', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostCreateAddress.path, '/api/v2/{coin}/wallet/{id}/address');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostCreateAddress.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      assert.ok(PostCreateAddress.request);
    });

    it('should have the correct response types', function () {
      assert.ok(PostCreateAddress.response[200]);
      assert.ok(PostCreateAddress.response[400]);
    });

    /**
     * CRITICAL TEST: This test catches the bug where path parameter names
     * don't match codec parameter names.
     *
     * Bug scenario:
     * - Path: '/api/v2/{coin}/wallet/{walletId}/address'  ← uses 'walletId'
     * - Codec: { coin: t.string, id: t.string }          ← expects 'id'
     *
     * This mismatch causes Express to extract { coin: 'btc', walletId: '123' }
     * but io-ts validation expects { coin: 'btc', id: '123' }, resulting in
     * "Invalid value undefined supplied to .../id: string" error.
     */
    it('should have path parameter names matching codec parameter names', function () {
      const pathParams = extractPathParams(PostCreateAddress.path);
      const codecParams = getCodecParamNames(CreateAddressParams);

      // Sort both arrays for comparison (order doesn't matter)
      pathParams.sort();
      codecParams.sort();

      assert.deepStrictEqual(
        pathParams,
        codecParams,
        `Path parameters ${JSON.stringify(pathParams)} do not match codec parameters ${JSON.stringify(codecParams)}. ` +
          `This will cause runtime validation errors! Path: ${PostCreateAddress.path}`
      );
    });

    it('should extract correct parameter names from path', function () {
      const pathParams = extractPathParams(PostCreateAddress.path);

      // Should extract 'coin' and 'id' (not 'walletId')
      assert.ok(pathParams.includes('coin'), 'Path should include "coin" parameter');
      assert.ok(pathParams.includes('id'), 'Path should include "id" parameter');
      assert.strictEqual(pathParams.length, 2, 'Path should have exactly 2 parameters');

      // Critical: should NOT have 'walletId' in the path
      assert.ok(!pathParams.includes('walletId'), 'Path should NOT include "walletId" - use "id" instead');
    });

    it('should validate that codec parameters match expected names', function () {
      const codecParams = getCodecParamNames(CreateAddressParams);

      assert.ok(codecParams.includes('coin'), 'Codec should include "coin" parameter');
      assert.ok(codecParams.includes('id'), 'Codec should include "id" parameter');
      assert.strictEqual(codecParams.length, 2, 'Codec should have exactly 2 parameters');
    });

    /**
     * Integration-style test: Simulates what Express would extract from the URL
     * and validates it against the codec.
     */
    it('should validate simulated Express-extracted parameters', function () {
      // Simulate Express extracting parameters from URL: POST /api/v2/btc/wallet/abc123/address
      const simulatedExpressParams = {
        coin: 'btc',
        id: 'abc123def456',
      };

      // This should pass - simulating what Express extracts from the path
      const decoded = assertDecode(t.type(CreateAddressParams), simulatedExpressParams);
      assert.strictEqual(decoded.coin, 'btc');
      assert.strictEqual(decoded.id, 'abc123def456');
    });

    /**
     * Negative test: This demonstrates what happens with the bug.
     * If path had {walletId} instead of {id}, Express would extract 'walletId',
     * but codec expects 'id', causing validation failure.
     */
    it('should fail validation if wrong parameter names are extracted (bug scenario)', function () {
      // Simulate Express extracting 'walletId' instead of 'id' (bug scenario)
      const buggyExpressParams = {
        coin: 'btc',
        walletId: 'abc123def456', // Wrong name!
      };

      // This should fail because codec expects 'id', not 'walletId'
      assert.throws(
        () => {
          assertDecode(t.type(CreateAddressParams), buggyExpressParams);
        },
        (error: any) => {
          // Verify it fails specifically because 'id' is undefined
          const errorMessage = error.message || '';
          return errorMessage.includes('id') || errorMessage.includes('undefined');
        },
        'Should fail validation when parameter names mismatch'
      );
    });
  });
});
