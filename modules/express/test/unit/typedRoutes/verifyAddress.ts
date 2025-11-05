import * as assert from 'assert';
import * as t from 'io-ts';
import { VerifyAddressBody, PostVerifyAddress } from '../../../src/typedRoutes/api/common/verifyAddress';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('VerifyAddress codec tests', function () {
  describe('VerifyAddressBody', function () {
    it('should validate body with required field (address)', function () {
      const validBody = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      const decoded = assertDecode(t.type(VerifyAddressBody), validBody);
      assert.strictEqual(decoded.address, validBody.address);
    });

    it('should reject body with missing address', function () {
      const invalidBody = {};

      assert.throws(() => {
        assertDecode(t.type(VerifyAddressBody), invalidBody);
      });
    });

    it('should reject body with non-string address', function () {
      const invalidBody = {
        address: 12345,
      };

      assert.throws(() => {
        assertDecode(t.type(VerifyAddressBody), invalidBody);
      });
    });
  });

  describe('VerifyAddressResponse', function () {
    const VerifyAddressResponse = PostVerifyAddress.response[200];

    it('should validate response with verified=true', function () {
      const validResponse = {
        verified: true,
      };

      const decoded = assertDecode(VerifyAddressResponse, validResponse);
      assert.strictEqual(decoded.verified, true);
    });

    it('should validate response with verified=false', function () {
      const validResponse = {
        verified: false,
      };

      const decoded = assertDecode(VerifyAddressResponse, validResponse);
      assert.strictEqual(decoded.verified, false);
    });

    it('should reject response with missing verified field', function () {
      const invalidResponse = {};

      assert.throws(() => {
        assertDecode(VerifyAddressResponse, invalidResponse);
      });
    });

    it('should reject response with non-boolean verified field', function () {
      const invalidResponse = {
        verified: 'true',
      };

      assert.throws(() => {
        assertDecode(VerifyAddressResponse, invalidResponse);
      });
    });
  });

  describe('PostVerifyAddress route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostVerifyAddress.path, '/api/v[12]/verifyaddress');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostVerifyAddress.method, 'POST');
    });

    it('should have the correct response types', function () {
      assert.ok(PostVerifyAddress.response[200]);
      assert.ok(PostVerifyAddress.response[404]);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully verify valid address (v1)', async function () {
      const requestBody = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      sinon.stub(BitGo.prototype, 'verifyAddress').returns(true);

      const result = await agent
        .post('/api/v1/verifyaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('verified');
      assert.strictEqual(result.body.verified, true);

      const decodedResponse = assertDecode(PostVerifyAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.verified, true);
    });

    it('should successfully verify valid address (v2)', async function () {
      const requestBody = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      sinon.stub(BitGo.prototype, 'verifyAddress').returns(true);

      const result = await agent
        .post('/api/v2/verifyaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.verified, true);

      const decodedResponse = assertDecode(PostVerifyAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.verified, true);
    });

    it('should return verified=false for invalid address', async function () {
      const requestBody = {
        address: 'invalid_address_123',
      };

      sinon.stub(BitGo.prototype, 'verifyAddress').returns(false);

      const result = await agent
        .post('/api/v1/verifyaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('verified');
      assert.strictEqual(result.body.verified, false);

      const decodedResponse = assertDecode(PostVerifyAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.verified, false);
    });

    it('should pass entire body to verifyAddress method', async function () {
      const requestBody = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      const verifyAddressStub = sinon.stub(BitGo.prototype, 'verifyAddress').returns(true);

      await agent
        .post('/api/v1/verifyaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      sinon.assert.calledOnce(verifyAddressStub);
      sinon.assert.calledWith(verifyAddressStub, requestBody);
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

    it('should return 400 for missing address field', async function () {
      const requestBody = {};

      const result = await agent
        .post('/api/v1/verifyaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(Array.isArray(result.body));
      assert.ok(result.body.length > 0);
    });

    it('should return 400 for non-string address field', async function () {
      const requestBody = {
        address: 12345,
      };

      const result = await agent
        .post('/api/v1/verifyaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(Array.isArray(result.body));
      assert.ok(result.body.length > 0);
    });

    it('should handle verifyAddress method throwing error', async function () {
      const requestBody = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      };

      sinon.stub(BitGo.prototype, 'verifyAddress').throws(new Error('Address verification failed'));

      const result = await agent
        .post('/api/v1/verifyaddress')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
