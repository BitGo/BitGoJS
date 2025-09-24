import * as assert from 'assert';
import * as t from 'io-ts';
import {
  CalculateMinerFeeInfoRequestBody,
  CalculateMinerFeeInfoResponse,
  PostCalculateMinerFeeInfo,
} from '../../../src/typedRoutes/api/common/calculateMinerFeeInfo';
import { assertDecode } from './common';

describe('CalculateMinerFeeInfo codec tests', function () {
  describe('CalculateMinerFeeInfoRequestBody', function () {
    it('should validate body with all required fields', function () {
      const validBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const decoded = assertDecode(t.type(CalculateMinerFeeInfoRequestBody), validBody);
      assert.strictEqual(decoded.nP2shInputs, validBody.nP2shInputs);
      assert.strictEqual(decoded.nP2pkhInputs, validBody.nP2pkhInputs);
      assert.strictEqual(decoded.nP2shP2wshInputs, validBody.nP2shP2wshInputs);
      assert.strictEqual(decoded.nOutputs, validBody.nOutputs);
      assert.strictEqual(decoded.feeRate, undefined); // Optional field
      assert.strictEqual(decoded.containsUncompressedPublicKeys, undefined); // Optional field
    });

    it('should validate body with all fields including optional ones', function () {
      const validBody = {
        feeRate: 10000,
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
        containsUncompressedPublicKeys: true,
      };

      const decoded = assertDecode(t.type(CalculateMinerFeeInfoRequestBody), validBody);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
      assert.strictEqual(decoded.nP2shInputs, validBody.nP2shInputs);
      assert.strictEqual(decoded.nP2pkhInputs, validBody.nP2pkhInputs);
      assert.strictEqual(decoded.nP2shP2wshInputs, validBody.nP2shP2wshInputs);
      assert.strictEqual(decoded.nOutputs, validBody.nOutputs);
      assert.strictEqual(decoded.containsUncompressedPublicKeys, validBody.containsUncompressedPublicKeys);
    });

    it('should reject body with missing nP2shInputs', function () {
      const invalidBody = {
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with missing nP2pkhInputs', function () {
      const invalidBody = {
        nP2shInputs: 1,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with missing nP2shP2wshInputs', function () {
      const invalidBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nOutputs: 2,
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with missing nOutputs', function () {
      const invalidBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number nP2shInputs', function () {
      const invalidBody = {
        nP2shInputs: '1', // string instead of number
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number nP2pkhInputs', function () {
      const invalidBody = {
        nP2shInputs: 1,
        nP2pkhInputs: '0', // string instead of number
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number nP2shP2wshInputs', function () {
      const invalidBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: '2', // string instead of number
        nOutputs: 2,
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number nOutputs', function () {
      const invalidBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: '2', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number feeRate', function () {
      const invalidBody = {
        feeRate: '10000', // string instead of number
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean containsUncompressedPublicKeys', function () {
      const invalidBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
        containsUncompressedPublicKeys: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(CalculateMinerFeeInfoRequestBody), invalidBody);
      });
    });
  });

  describe('CalculateMinerFeeInfoResponse', function () {
    it('should validate response with all required fields', function () {
      const validResponse = {
        size: 374,
        fee: 3740,
        feeRate: 10000,
      };

      const decoded = assertDecode(CalculateMinerFeeInfoResponse, validResponse);
      assert.strictEqual(decoded.size, validResponse.size);
      assert.strictEqual(decoded.fee, validResponse.fee);
      assert.strictEqual(decoded.feeRate, validResponse.feeRate);
    });

    it('should reject response with missing size', function () {
      const invalidResponse = {
        fee: 3740,
        feeRate: 10000,
      };

      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, invalidResponse);
      });
    });

    it('should reject response with missing fee', function () {
      const invalidResponse = {
        size: 374,
        feeRate: 10000,
      };

      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, invalidResponse);
      });
    });

    it('should reject response with missing feeRate', function () {
      const invalidResponse = {
        size: 374,
        fee: 3740,
      };

      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, invalidResponse);
      });
    });

    it('should reject response with non-number size', function () {
      const invalidResponse = {
        size: '374', // string instead of number
        fee: 3740,
        feeRate: 10000,
      };

      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, invalidResponse);
      });
    });

    it('should reject response with non-number fee', function () {
      const invalidResponse = {
        size: 374,
        fee: '3740', // string instead of number
        feeRate: 10000,
      };

      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, invalidResponse);
      });
    });

    it('should reject response with non-number feeRate', function () {
      const invalidResponse = {
        size: 374,
        fee: 3740,
        feeRate: '10000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, invalidResponse);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle zero values for number fields', function () {
      const body = {
        feeRate: 0,
        nP2shInputs: 0,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 0,
        nOutputs: 0,
      };

      // This should throw because the implementation requires at least one nP2shInputs or nP2shP2wshInputs
      // and at least one nOutputs, but the codec itself allows zero values
      const decoded = assertDecode(t.type(CalculateMinerFeeInfoRequestBody), body);
      assert.strictEqual(decoded.feeRate, 0);
      assert.strictEqual(decoded.nP2shInputs, 0);
      assert.strictEqual(decoded.nP2pkhInputs, 0);
      assert.strictEqual(decoded.nP2shP2wshInputs, 0);
      assert.strictEqual(decoded.nOutputs, 0);
    });

    it('should handle additional unknown properties', function () {
      const body = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(CalculateMinerFeeInfoRequestBody)), body);
      assert.strictEqual(decoded.nP2shInputs, body.nP2shInputs);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('PostCalculateMinerFeeInfo route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostCalculateMinerFeeInfo.path, '/api/v[12]/calculateminerfeeinfo');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostCalculateMinerFeeInfo.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostCalculateMinerFeeInfo.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostCalculateMinerFeeInfo.response[200]);
      assert.ok(PostCalculateMinerFeeInfo.response[400]);
      assert.ok(PostCalculateMinerFeeInfo.response[404]);
    });
  });
});
