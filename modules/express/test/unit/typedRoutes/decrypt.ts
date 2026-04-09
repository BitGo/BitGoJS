import * as assert from 'assert';
import * as t from 'io-ts';
import { DecryptRequestBody, PostDecrypt } from '../../../src/typedRoutes/api/common/decrypt';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('Decrypt codec tests', function () {
  describe('DecryptRequestBody', function () {
    it('should validate body with only required field (input)', function () {
      const validBody = {
        input: 'encryptedString123',
      };

      const decoded = assertDecode(t.type(DecryptRequestBody), validBody);
      assert.strictEqual(decoded.input, validBody.input);
      assert.strictEqual(decoded.password, undefined);
    });

    it('should validate body with input and password', function () {
      const validBody = {
        input: 'encryptedString123',
        password: 'mySecurePassword123',
      };

      const decoded = assertDecode(t.type(DecryptRequestBody), validBody);
      assert.strictEqual(decoded.input, validBody.input);
      assert.strictEqual(decoded.password, validBody.password);
    });

    it('should reject body with missing input', function () {
      const invalidBody = {
        password: 'mySecurePassword123',
      };

      assert.throws(() => {
        assertDecode(t.type(DecryptRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string input', function () {
      const invalidBody = {
        input: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(DecryptRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string password', function () {
      const invalidBody = {
        input: 'encryptedString123',
        password: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(DecryptRequestBody), invalidBody);
      });
    });
  });

  describe('DecryptResponse', function () {
    const DecryptResponse = PostDecrypt.response[200];

    it('should validate response with required field', function () {
      const validResponse = {
        decrypted: 'myDecryptedString',
      };

      const decoded = assertDecode(DecryptResponse, validResponse);
      assert.strictEqual(decoded.decrypted, validResponse.decrypted);
    });

    it('should reject response with missing decrypted field', function () {
      const invalidResponse = {};

      assert.throws(() => {
        assertDecode(DecryptResponse, invalidResponse);
      });
    });

    it('should reject response with non-string decrypted field', function () {
      const invalidResponse = {
        decrypted: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(DecryptResponse, invalidResponse);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle additional unknown properties', function () {
      const body = {
        input: 'encryptedString123',
        password: 'mySecurePassword123',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(DecryptRequestBody)), body);
      assert.strictEqual(decoded.input, body.input);
      assert.strictEqual(decoded.password, body.password);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('PostDecrypt route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostDecrypt.path, '/api/v[12]/decrypt');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostDecrypt.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostDecrypt.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostDecrypt.response[200]);
      assert.ok(PostDecrypt.response[404]);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockDecryptResponse = 'myDecryptedString';

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully decrypt with input and password (v1)', async function () {
      const requestBody = {
        input: 'encryptedString123',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'decrypt').returns(mockDecryptResponse);

      const result = await agent
        .post('/api/v1/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('decrypted');
      assert.strictEqual(result.body.decrypted, mockDecryptResponse);

      const decodedResponse = assertDecode(PostDecrypt.response[200], result.body);
      assert.strictEqual(decodedResponse.decrypted, mockDecryptResponse);
    });

    it('should successfully decrypt with input and password (v2)', async function () {
      const requestBody = {
        input: 'encryptedString123',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'decrypt').returns(mockDecryptResponse);

      const result = await agent
        .post('/api/v2/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('decrypted');
      assert.strictEqual(result.body.decrypted, mockDecryptResponse);

      const decodedResponse = assertDecode(PostDecrypt.response[200], result.body);
      assert.strictEqual(decodedResponse.decrypted, mockDecryptResponse);
    });

    it('should successfully decrypt long encrypted string (v1)', async function () {
      const requestBody = {
        input: 'a'.repeat(1000), // Long encrypted string
        password: 'mySecurePassword123',
      };

      const mockLongDecrypted = 'b'.repeat(500);
      sinon.stub(BitGo.prototype, 'decrypt').returns(mockLongDecrypted);

      const result = await agent
        .post('/api/v1/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.decrypted, mockLongDecrypted);

      const decodedResponse = assertDecode(PostDecrypt.response[200], result.body);
      assert.strictEqual(decodedResponse.decrypted, mockLongDecrypted);
    });

    it('should successfully decrypt with special characters in password (v2)', async function () {
      const requestBody = {
        input: 'encryptedString123',
        password: 'p@ssw0rd!#$%^&*()',
      };

      sinon.stub(BitGo.prototype, 'decrypt').returns(mockDecryptResponse);

      const result = await agent
        .post('/api/v2/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.decrypted, mockDecryptResponse);

      const decodedResponse = assertDecode(PostDecrypt.response[200], result.body);
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

    it('should handle decryption failure with wrong password (v1)', async function () {
      const requestBody = {
        input: 'encryptedString123',
        password: 'wrongPassword',
      };

      sinon.stub(BitGo.prototype, 'decrypt').throws(new Error("password error - ccm: tag doesn't match"));

      const result = await agent
        .post('/api/v1/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle decryption failure with wrong password (v2)', async function () {
      const requestBody = {
        input: 'encryptedString123',
        password: 'wrongPassword',
      };

      sinon.stub(BitGo.prototype, 'decrypt').throws(new Error("password error - ccm: tag doesn't match"));

      const result = await agent
        .post('/api/v2/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle missing password error (v1)', async function () {
      const requestBody = {
        input: 'encryptedString123',
        password: '',
      };

      sinon.stub(BitGo.prototype, 'decrypt').throws(new Error('cannot decrypt without password'));

      const result = await agent
        .post('/api/v1/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid encrypted input format (v2)', async function () {
      const requestBody = {
        input: 'invalidEncryptedFormat',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'decrypt').throws(new Error('Invalid encrypted input format'));

      const result = await agent
        .post('/api/v2/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle decrypt method not available (v1)', async function () {
      const requestBody = {
        input: 'encryptedString123',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'decrypt').throws(new Error('Decrypt method not available'));

      const result = await agent
        .post('/api/v1/decrypt')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
