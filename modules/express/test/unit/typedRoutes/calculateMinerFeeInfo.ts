import * as assert from 'assert';
import * as t from 'io-ts';
import {
  CalculateMinerFeeInfoRequestBody,
  CalculateMinerFeeInfoResponse,
  PostCalculateMinerFeeInfo,
} from '../../../src/typedRoutes/api/common/calculateMinerFeeInfo';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

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

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockCalculateMinerFeeInfoResponse = {
      size: 374,
      fee: 3740,
      feeRate: 10000,
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully calculate miner fee info with all required fields', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(mockCalculateMinerFeeInfoResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('size');
      result.body.should.have.property('fee');
      result.body.should.have.property('feeRate');
      assert.strictEqual(result.body.size, mockCalculateMinerFeeInfoResponse.size);
      assert.strictEqual(result.body.fee, mockCalculateMinerFeeInfoResponse.fee);
      assert.strictEqual(result.body.feeRate, mockCalculateMinerFeeInfoResponse.feeRate);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, mockCalculateMinerFeeInfoResponse.size);
      assert.strictEqual(decodedResponse.fee, mockCalculateMinerFeeInfoResponse.fee);
      assert.strictEqual(decodedResponse.feeRate, mockCalculateMinerFeeInfoResponse.feeRate);
    });

    it('should successfully calculate miner fee info with optional feeRate', async function () {
      const requestBody = {
        feeRate: 15000,
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const customFeeRateResponse = {
        size: 374,
        fee: 5610, // Updated fee based on higher fee rate
        feeRate: 15000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(customFeeRateResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.feeRate, customFeeRateResponse.feeRate);
      assert.strictEqual(result.body.fee, customFeeRateResponse.fee);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.feeRate, customFeeRateResponse.feeRate);
    });

    it('should successfully calculate miner fee info with containsUncompressedPublicKeys', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
        containsUncompressedPublicKeys: true,
      };

      const uncompressedKeysResponse = {
        size: 500, // Larger size due to uncompressed keys
        fee: 5000,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(uncompressedKeysResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, uncompressedKeysResponse.size);
      assert.strictEqual(result.body.fee, uncompressedKeysResponse.fee);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, uncompressedKeysResponse.size);
    });

    it('should successfully calculate miner fee info with all optional fields', async function () {
      const requestBody = {
        feeRate: 12000,
        nP2shInputs: 2,
        nP2pkhInputs: 1,
        nP2shP2wshInputs: 1,
        nOutputs: 3,
        containsUncompressedPublicKeys: false,
      };

      const fullFieldsResponse = {
        size: 600,
        fee: 7200,
        feeRate: 12000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(fullFieldsResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, fullFieldsResponse.size);
      assert.strictEqual(result.body.fee, fullFieldsResponse.fee);
      assert.strictEqual(result.body.feeRate, fullFieldsResponse.feeRate);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should work with v1 API endpoint', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(mockCalculateMinerFeeInfoResponse);

      const result = await agent
        .post('/api/v1/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, mockCalculateMinerFeeInfoResponse.size);
      assert.strictEqual(result.body.fee, mockCalculateMinerFeeInfoResponse.fee);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, mockCalculateMinerFeeInfoResponse.size);
    });

    it('should calculate fee with only P2SH inputs', async function () {
      const requestBody = {
        nP2shInputs: 3,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 0,
        nOutputs: 2,
      };

      const p2shOnlyResponse = {
        size: 600,
        fee: 6000,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(p2shOnlyResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, p2shOnlyResponse.size);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, p2shOnlyResponse.size);
    });

    it('should calculate fee with only P2PKH inputs', async function () {
      const requestBody = {
        nP2shInputs: 0,
        nP2pkhInputs: 5,
        nP2shP2wshInputs: 0,
        nOutputs: 1,
      };

      const p2pkhOnlyResponse = {
        size: 800,
        fee: 8000,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(p2pkhOnlyResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, p2pkhOnlyResponse.size);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, p2pkhOnlyResponse.size);
    });

    it('should calculate fee with only P2SH-P2WSH (segwit) inputs', async function () {
      const requestBody = {
        nP2shInputs: 0,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 4,
        nOutputs: 2,
      };

      const segwitOnlyResponse = {
        size: 450,
        fee: 4500,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(segwitOnlyResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, segwitOnlyResponse.size);
      assert.strictEqual(result.body.fee, segwitOnlyResponse.fee);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, segwitOnlyResponse.size);
    });
  });

  // ==========================================
  // ERROR HANDLING TESTS
  // ==========================================

  describe('Error Handling Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should handle calculateMinerFeeInfo SDK method failure', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').rejects(new Error('Failed to calculate miner fee'));

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid parameters error from SDK', async function () {
      const requestBody = {
        nP2shInputs: -1, // Negative value
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').rejects(new Error('Invalid input parameters'));

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle SDK throwing unexpected error', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').throws(new Error('Unexpected internal error'));

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle missing required field in request', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        // Missing nP2shP2wshInputs
        nOutputs: 2,
      };

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should handle invalid type in request field', async function () {
      const requestBody = {
        nP2shInputs: '1', // String instead of number
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should handle malformed JSON request', async function () {
      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      assert.ok(result.status >= 400);
    });

    it('should handle empty request body', async function () {
      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send({});

      assert.ok(result.status >= 400);
    });

    it('should handle invalid feeRate type', async function () {
      const requestBody = {
        feeRate: 'invalid', // String instead of number
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should handle invalid containsUncompressedPublicKeys type', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
        containsUncompressedPublicKeys: 'yes', // String instead of boolean
      };

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should handle SDK returning null or undefined', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(null as any);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // SDK returning null - framework passes it through with 200, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, result.body);
      });
    });

    it('should handle timeout error', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').rejects(new Error('Request timeout'));

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle network error', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').rejects(new Error('Network error'));

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });

  // ==========================================
  // EDGE CASE TESTS
  // ==========================================

  describe('Edge Case Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should handle zero inputs and outputs', async function () {
      const requestBody = {
        nP2shInputs: 0,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 0,
        nOutputs: 0,
      };

      const zeroValuesResponse = {
        size: 10, // Minimal transaction size
        fee: 100,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(zeroValuesResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, zeroValuesResponse.size);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, zeroValuesResponse.size);
    });

    it('should handle very large number of inputs', async function () {
      const requestBody = {
        nP2shInputs: 1000,
        nP2pkhInputs: 500,
        nP2shP2wshInputs: 500,
        nOutputs: 100,
      };

      const largeInputsResponse = {
        size: 200000,
        fee: 2000000,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(largeInputsResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, largeInputsResponse.size);
      assert.strictEqual(result.body.fee, largeInputsResponse.fee);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, largeInputsResponse.size);
    });

    it('should handle very large fee rate', async function () {
      const requestBody = {
        feeRate: 1000000, // Very high fee rate
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const highFeeRateResponse = {
        size: 374,
        fee: 374000,
        feeRate: 1000000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(highFeeRateResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.fee, highFeeRateResponse.fee);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.fee, highFeeRateResponse.fee);
    });

    it('should handle zero fee rate', async function () {
      const requestBody = {
        feeRate: 0,
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const zeroFeeRateResponse = {
        size: 374,
        fee: 0,
        feeRate: 0,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(zeroFeeRateResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.fee, 0);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.fee, 0);
    });

    it('should handle very small fee rate', async function () {
      const requestBody = {
        feeRate: 1, // 1 satoshi per kilobyte
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const smallFeeRateResponse = {
        size: 374,
        fee: 1,
        feeRate: 1,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(smallFeeRateResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.fee, smallFeeRateResponse.fee);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.fee, smallFeeRateResponse.fee);
    });

    it('should handle fractional fee rate', async function () {
      const requestBody = {
        feeRate: 0.5,
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const fractionalFeeRateResponse = {
        size: 374,
        fee: 0,
        feeRate: 0.5,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(fractionalFeeRateResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.feeRate, fractionalFeeRateResponse.feeRate);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.feeRate, fractionalFeeRateResponse.feeRate);
    });

    it('should handle single input and single output', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 0,
        nOutputs: 1,
      };

      const singleIoResponse = {
        size: 200,
        fee: 2000,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(singleIoResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, singleIoResponse.size);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, singleIoResponse.size);
    });

    it('should handle maximum safe integer values', async function () {
      const requestBody = {
        nP2shInputs: Number.MAX_SAFE_INTEGER,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 0,
        nOutputs: 1,
      };

      const maxIntResponse = {
        size: Number.MAX_SAFE_INTEGER,
        fee: Number.MAX_SAFE_INTEGER,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(maxIntResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, maxIntResponse.size);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, maxIntResponse.size);
    });

    it('should handle response with additional unexpected fields', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const responseWithExtraFields = {
        size: 374,
        fee: 3740,
        feeRate: 10000,
        unexpectedField: 'should be ignored',
        anotherField: 12345,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(responseWithExtraFields as any);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      // Response codec validation should still pass with required fields present
      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, {
        size: result.body.size,
        fee: result.body.fee,
        feeRate: result.body.feeRate,
      });
      assert.ok(decodedResponse);
    });

    it('should handle containsUncompressedPublicKeys set to false', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
        containsUncompressedPublicKeys: false,
      };

      const compressedKeysResponse = {
        size: 374,
        fee: 3740,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(compressedKeysResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, compressedKeysResponse.size);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, compressedKeysResponse.size);
    });

    it('should handle mixed input types with various counts', async function () {
      const requestBody = {
        nP2shInputs: 5,
        nP2pkhInputs: 3,
        nP2shP2wshInputs: 2,
        nOutputs: 10,
      };

      const mixedInputsResponse = {
        size: 1500,
        fee: 15000,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(mixedInputsResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, mixedInputsResponse.size);
      assert.strictEqual(result.body.fee, mixedInputsResponse.fee);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, mixedInputsResponse.size);
    });

    it('should handle request with extra unknown fields in body', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
        unknownField: 'should be ignored by codec',
        anotherUnknown: 999,
      };

      const normalResponse = {
        size: 374,
        fee: 3740,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(normalResponse);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should succeed - extra fields are typically ignored
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.size, normalResponse.size);

      const decodedResponse = assertDecode(CalculateMinerFeeInfoResponse, result.body);
      assert.strictEqual(decodedResponse.size, normalResponse.size);
    });
  });

  describe('Response Validation Edge Cases', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should reject response with missing size field', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const invalidResponse = {
        // size is missing
        fee: 3740,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(invalidResponse as any);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, result.body);
      });
    });

    it('should reject response with missing fee field', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const invalidResponse = {
        size: 374,
        // fee is missing
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(invalidResponse as any);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, result.body);
      });
    });

    it('should reject response with missing feeRate field', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const invalidResponse = {
        size: 374,
        fee: 3740,
        // feeRate is missing
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(invalidResponse as any);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, result.body);
      });
    });

    it('should reject response with wrong type for size', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const invalidResponse = {
        size: '374', // String instead of number
        fee: 3740,
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(invalidResponse as any);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, result.body);
      });
    });

    it('should reject response with wrong type for fee', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const invalidResponse = {
        size: 374,
        fee: '3740', // String instead of number
        feeRate: 10000,
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(invalidResponse as any);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, result.body);
      });
    });

    it('should reject response with wrong type for feeRate', async function () {
      const requestBody = {
        nP2shInputs: 1,
        nP2pkhInputs: 0,
        nP2shP2wshInputs: 2,
        nOutputs: 2,
      };

      const invalidResponse = {
        size: 374,
        fee: 3740,
        feeRate: '10000', // String instead of number
      };

      sinon.stub(BitGo.prototype, 'calculateMinerFeeInfo').resolves(invalidResponse as any);

      const result = await agent
        .post('/api/v2/calculateminerfeeinfo')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CalculateMinerFeeInfoResponse, result.body);
      });
    });
  });
});
