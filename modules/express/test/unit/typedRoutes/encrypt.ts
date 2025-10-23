import * as assert from 'assert';
import * as t from 'io-ts';
import { EncryptRequestBody, PostEncrypt } from '../../../src/typedRoutes/api/common/encrypt';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('Encrypt codec tests', function () {
  describe('EncryptRequestBody', function () {
    it('should validate body with only required field (input)', function () {
      const validBody = {
        input: 'myPlainTextString',
      };

      const decoded = assertDecode(t.type(EncryptRequestBody), validBody);
      assert.strictEqual(decoded.input, validBody.input);
      assert.strictEqual(decoded.password, undefined);
      assert.strictEqual(decoded.adata, undefined);
    });

    it('should validate body with input and password', function () {
      const validBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
      };

      const decoded = assertDecode(t.type(EncryptRequestBody), validBody);
      assert.strictEqual(decoded.input, validBody.input);
      assert.strictEqual(decoded.password, validBody.password);
      assert.strictEqual(decoded.adata, undefined);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
        adata: 'additionalAuthData',
      };

      const decoded = assertDecode(t.type(EncryptRequestBody), validBody);
      assert.strictEqual(decoded.input, validBody.input);
      assert.strictEqual(decoded.password, validBody.password);
      assert.strictEqual(decoded.adata, validBody.adata);
    });

    it('should reject body with missing input', function () {
      const invalidBody = {
        password: 'mySecurePassword123',
      };

      assert.throws(() => {
        assertDecode(t.type(EncryptRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string input', function () {
      const invalidBody = {
        input: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(EncryptRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string password', function () {
      const invalidBody = {
        input: 'myPlainTextString',
        password: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(EncryptRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string adata', function () {
      const invalidBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
        adata: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(EncryptRequestBody), invalidBody);
      });
    });
  });

  describe('EncryptResponse', function () {
    const EncryptResponse = PostEncrypt.response[200];

    it('should validate response with required field', function () {
      const validResponse = {
        encrypted: 'encryptedString123',
      };

      const decoded = assertDecode(EncryptResponse, validResponse);
      assert.strictEqual(decoded.encrypted, validResponse.encrypted);
    });

    it('should reject response with missing encrypted field', function () {
      const invalidResponse = {};

      assert.throws(() => {
        assertDecode(EncryptResponse, invalidResponse);
      });
    });

    it('should reject response with non-string encrypted field', function () {
      const invalidResponse = {
        encrypted: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(EncryptResponse, invalidResponse);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle additional unknown properties', function () {
      const body = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(EncryptRequestBody)), body);
      assert.strictEqual(decoded.input, body.input);
      assert.strictEqual(decoded.password, body.password);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('PostEncrypt route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostEncrypt.path, '/api/v[12]/encrypt');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostEncrypt.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostEncrypt.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostEncrypt.response[200]);
      assert.ok(PostEncrypt.response[404]);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockEncryptResponse = 'encryptedString123';

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully encrypt with input and password (v1)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'encrypt').returns(mockEncryptResponse);

      const result = await agent
        .post('/api/v1/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('encrypted');
      assert.strictEqual(result.body.encrypted, mockEncryptResponse);

      const decodedResponse = assertDecode(PostEncrypt.response[200], result.body);
      assert.strictEqual(decodedResponse.encrypted, mockEncryptResponse);
    });

    it('should successfully encrypt with input and password (v2)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'encrypt').returns(mockEncryptResponse);

      const result = await agent
        .post('/api/v2/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('encrypted');
      assert.strictEqual(result.body.encrypted, mockEncryptResponse);

      const decodedResponse = assertDecode(PostEncrypt.response[200], result.body);
      assert.strictEqual(decodedResponse.encrypted, mockEncryptResponse);
    });

    it('should successfully encrypt with input, password, and adata (v1)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
        adata: 'additionalAuthData',
      };

      sinon.stub(BitGo.prototype, 'encrypt').returns(mockEncryptResponse);

      const result = await agent
        .post('/api/v1/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.encrypted, mockEncryptResponse);

      const decodedResponse = assertDecode(PostEncrypt.response[200], result.body);
      assert.strictEqual(decodedResponse.encrypted, mockEncryptResponse);
    });

    it('should successfully encrypt with input, password, and adata (v2)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
        adata: 'additionalAuthData',
      };

      sinon.stub(BitGo.prototype, 'encrypt').returns(mockEncryptResponse);

      const result = await agent
        .post('/api/v2/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.encrypted, mockEncryptResponse);

      const decodedResponse = assertDecode(PostEncrypt.response[200], result.body);
      assert.strictEqual(decodedResponse.encrypted, mockEncryptResponse);
    });

    it('should successfully encrypt long plaintext string (v1)', async function () {
      const requestBody = {
        input: 'a'.repeat(1000), // Long plaintext string
        password: 'mySecurePassword123',
      };

      const mockLongEncrypted = 'b'.repeat(1500);
      sinon.stub(BitGo.prototype, 'encrypt').returns(mockLongEncrypted);

      const result = await agent
        .post('/api/v1/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.encrypted, mockLongEncrypted);

      const decodedResponse = assertDecode(PostEncrypt.response[200], result.body);
      assert.strictEqual(decodedResponse.encrypted, mockLongEncrypted);
    });

    it('should successfully encrypt with special characters in password (v2)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: 'p@ssw0rd!#$%^&*()',
      };

      sinon.stub(BitGo.prototype, 'encrypt').returns(mockEncryptResponse);

      const result = await agent
        .post('/api/v2/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.encrypted, mockEncryptResponse);

      const decodedResponse = assertDecode(PostEncrypt.response[200], result.body);
      assert.ok(decodedResponse);
    });

    it('should successfully encrypt JSON object as string (v1)', async function () {
      const requestBody = {
        input: JSON.stringify({ key: 'value', nested: { data: 'test' } }),
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'encrypt').returns(mockEncryptResponse);

      const result = await agent
        .post('/api/v1/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.encrypted, mockEncryptResponse);

      const decodedResponse = assertDecode(PostEncrypt.response[200], result.body);
      assert.ok(decodedResponse);
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

    it('should handle encryption failure with missing password (v1)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: '',
      };

      sinon.stub(BitGo.prototype, 'encrypt').throws(new Error('cannot encrypt without password'));

      const result = await agent
        .post('/api/v1/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle encryption failure with missing password (v2)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: '',
      };

      sinon.stub(BitGo.prototype, 'encrypt').throws(new Error('cannot encrypt without password'));

      const result = await agent
        .post('/api/v2/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid input format (v1)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'encrypt').throws(new Error('Invalid input format'));

      const result = await agent
        .post('/api/v1/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle encryption method not available (v2)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'encrypt').throws(new Error('Encrypt method not available'));

      const result = await agent
        .post('/api/v2/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle encryption failure with invalid adata (v1)', async function () {
      const requestBody = {
        input: 'myPlainTextString',
        password: 'mySecurePassword123',
        adata: 'invalidAdataFormat',
      };

      sinon.stub(BitGo.prototype, 'encrypt').throws(new Error('Invalid adata format'));

      const result = await agent
        .post('/api/v1/encrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
