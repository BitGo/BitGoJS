import * as assert from 'assert';
import * as t from 'io-ts';
import { LoginRequest, PostLogin } from '../../../src/typedRoutes/api/common/login';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('Login codec tests', function () {
  describe('LoginRequest', function () {
    it('should validate body with only required field (password)', function () {
      const validBody = {
        password: 'mySecurePassword123',
      };

      const decoded = assertDecode(t.type(LoginRequest), validBody);
      assert.strictEqual(decoded.password, validBody.password);
      assert.strictEqual(decoded.email, undefined);
      assert.strictEqual(decoded.username, undefined);
      assert.strictEqual(decoded.otp, undefined);
      assert.strictEqual(decoded.trust, undefined);
      assert.strictEqual(decoded.forceSMS, undefined);
      assert.strictEqual(decoded.extensible, undefined);
      assert.strictEqual(decoded.forceV1Auth, undefined);
      assert.strictEqual(decoded.ensureEcdhKeychain, undefined);
      assert.strictEqual(decoded.forReset2FA, undefined);
      assert.strictEqual(decoded.initialHash, undefined);
      assert.strictEqual(decoded.fingerprintHash, undefined);
    });

    it('should validate body with password and email', function () {
      const validBody = {
        password: 'mySecurePassword123',
        email: 'user@example.com',
      };

      const decoded = assertDecode(t.type(LoginRequest), validBody);
      assert.strictEqual(decoded.password, validBody.password);
      assert.strictEqual(decoded.email, validBody.email);
      assert.strictEqual(decoded.username, undefined);
    });

    it('should validate body with password and username', function () {
      const validBody = {
        password: 'mySecurePassword123',
        username: 'testuser',
      };

      const decoded = assertDecode(t.type(LoginRequest), validBody);
      assert.strictEqual(decoded.password, validBody.password);
      assert.strictEqual(decoded.username, validBody.username);
      assert.strictEqual(decoded.email, undefined);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        password: 'mySecurePassword123',
        email: 'user@example.com',
        username: 'testuser',
        otp: '123456',
        trust: 3600,
        forceSMS: true,
        extensible: true,
        forceV1Auth: false,
        ensureEcdhKeychain: true,
        forReset2FA: false,
        initialHash: 'a'.repeat(64),
        fingerprintHash: 'b'.repeat(64),
      };

      const decoded = assertDecode(t.type(LoginRequest), validBody);
      assert.strictEqual(decoded.password, validBody.password);
      assert.strictEqual(decoded.email, validBody.email);
      assert.strictEqual(decoded.username, validBody.username);
      assert.strictEqual(decoded.otp, validBody.otp);
      assert.strictEqual(decoded.trust, validBody.trust);
      assert.strictEqual(decoded.forceSMS, validBody.forceSMS);
      assert.strictEqual(decoded.extensible, validBody.extensible);
      assert.strictEqual(decoded.forceV1Auth, validBody.forceV1Auth);
      assert.strictEqual(decoded.ensureEcdhKeychain, validBody.ensureEcdhKeychain);
      assert.strictEqual(decoded.forReset2FA, validBody.forReset2FA);
      assert.strictEqual(decoded.initialHash, validBody.initialHash);
      assert.strictEqual(decoded.fingerprintHash, validBody.fingerprintHash);
    });

    it('should reject body with missing password', function () {
      const invalidBody = {
        email: 'user@example.com',
      };

      assert.throws(() => {
        assertDecode(t.type(LoginRequest), invalidBody);
      });
    });

    it('should reject body with non-string password', function () {
      const invalidBody = {
        password: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(LoginRequest), invalidBody);
      });
    });

    it('should reject body with non-number trust', function () {
      const invalidBody = {
        password: 'mySecurePassword123',
        trust: '3600', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(LoginRequest), invalidBody);
      });
    });

    it('should reject body with non-boolean forceSMS', function () {
      const invalidBody = {
        password: 'mySecurePassword123',
        forceSMS: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(LoginRequest), invalidBody);
      });
    });
  });

  describe('LoginResponse', function () {
    const LoginResponse = PostLogin.response[200];

    it('should validate response with all required fields', function () {
      const validResponse = {
        email: 'user@example.com',
        password: 'mySecurePassword123',
        forceSMS: false,
      };

      const decoded = assertDecode(LoginResponse, validResponse);
      assert.strictEqual(decoded.email, validResponse.email);
      assert.strictEqual(decoded.password, validResponse.password);
      assert.strictEqual(decoded.forceSMS, validResponse.forceSMS);
      assert.strictEqual(decoded.otp, undefined);
      assert.strictEqual(decoded.trust, undefined);
      assert.strictEqual(decoded.extensible, undefined);
      assert.strictEqual(decoded.extensionAddress, undefined);
      assert.strictEqual(decoded.forceV1Auth, undefined);
      assert.strictEqual(decoded.forReset2FA, undefined);
      assert.strictEqual(decoded.initialHash, undefined);
      assert.strictEqual(decoded.fingerprintHash, undefined);
    });

    it('should validate response with all fields', function () {
      const validResponse = {
        email: 'user@example.com',
        password: 'mySecurePassword123',
        forceSMS: true,
        otp: '123456',
        trust: 3600,
        extensible: true,
        extensionAddress: 'https://extension.example.com',
        forceV1Auth: false,
        forReset2FA: false,
        initialHash: 'a'.repeat(64),
        fingerprintHash: 'b'.repeat(64),
      };

      const decoded = assertDecode(LoginResponse, validResponse);
      assert.strictEqual(decoded.email, validResponse.email);
      assert.strictEqual(decoded.password, validResponse.password);
      assert.strictEqual(decoded.forceSMS, validResponse.forceSMS);
      assert.strictEqual(decoded.otp, validResponse.otp);
      assert.strictEqual(decoded.trust, validResponse.trust);
      assert.strictEqual(decoded.extensible, validResponse.extensible);
      assert.strictEqual(decoded.extensionAddress, validResponse.extensionAddress);
      assert.strictEqual(decoded.forceV1Auth, validResponse.forceV1Auth);
      assert.strictEqual(decoded.forReset2FA, validResponse.forReset2FA);
      assert.strictEqual(decoded.initialHash, validResponse.initialHash);
      assert.strictEqual(decoded.fingerprintHash, validResponse.fingerprintHash);
    });

    it('should reject response with missing email', function () {
      const invalidResponse = {
        password: 'mySecurePassword123',
        forceSMS: false,
      };

      assert.throws(() => {
        assertDecode(LoginResponse, invalidResponse);
      });
    });

    it('should reject response with missing password', function () {
      const invalidResponse = {
        email: 'user@example.com',
        forceSMS: false,
      };

      assert.throws(() => {
        assertDecode(LoginResponse, invalidResponse);
      });
    });

    it('should reject response with missing forceSMS', function () {
      const invalidResponse = {
        email: 'user@example.com',
        password: 'mySecurePassword123',
      };

      assert.throws(() => {
        assertDecode(LoginResponse, invalidResponse);
      });
    });

    it('should reject response with non-boolean forceSMS', function () {
      const invalidResponse = {
        email: 'user@example.com',
        password: 'mySecurePassword123',
        forceSMS: 'false', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(LoginResponse, invalidResponse);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle additional unknown properties', function () {
      const body = {
        password: 'mySecurePassword123',
        email: 'user@example.com',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(LoginRequest)), body);
      assert.strictEqual(decoded.password, body.password);
      assert.strictEqual(decoded.email, body.email);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('PostLogin route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostLogin.path, '/api/v[12]/user/login');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostLogin.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostLogin.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostLogin.response[200]);
      assert.ok(PostLogin.response[404]);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockLoginResponse = {
      email: 'test@example.com',
      password: 'mySecurePassword123',
      forceSMS: false,
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully login with email and password (v1)', async function () {
      const requestBody = {
        email: 'test@example.com',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'authenticate').resolves(mockLoginResponse);

      const result = await agent
        .post('/api/v1/user/login')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('email');
      result.body.should.have.property('password');
      result.body.should.have.property('forceSMS');
      assert.strictEqual(result.body.email, mockLoginResponse.email);
      assert.strictEqual(result.body.forceSMS, mockLoginResponse.forceSMS);

      const decodedResponse = assertDecode(PostLogin.response[200], result.body);
      assert.strictEqual(decodedResponse.email, mockLoginResponse.email);
    });

    it('should successfully login with email and password (v2)', async function () {
      const requestBody = {
        email: 'test@example.com',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'authenticate').resolves(mockLoginResponse);

      const result = await agent
        .post('/api/v2/user/login')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('email');
      result.body.should.have.property('password');
      result.body.should.have.property('forceSMS');
      assert.strictEqual(result.body.email, mockLoginResponse.email);
      assert.strictEqual(result.body.forceSMS, mockLoginResponse.forceSMS);

      const decodedResponse = assertDecode(PostLogin.response[200], result.body);
      assert.strictEqual(decodedResponse.email, mockLoginResponse.email);
    });

    it('should successfully login with all optional parameters (v1)', async function () {
      const requestBody = {
        email: 'test@example.com',
        password: 'mySecurePassword123',
        otp: '123456',
        trust: 3600,
        forceSMS: true,
        extensible: true,
        forceV1Auth: false,
        ensureEcdhKeychain: true,
        forReset2FA: false,
        initialHash: 'a'.repeat(64),
        fingerprintHash: 'b'.repeat(64),
      };

      const mockFullResponse = {
        email: 'test@example.com',
        password: 'mySecurePassword123',
        forceSMS: true,
        otp: '123456',
        trust: 3600,
        extensible: true,
        extensionAddress: 'https://extension.example.com',
        forceV1Auth: false,
        forReset2FA: false,
        initialHash: 'a'.repeat(64),
        fingerprintHash: 'b'.repeat(64),
      };

      sinon.stub(BitGo.prototype, 'authenticate').resolves(mockFullResponse);

      const result = await agent
        .post('/api/v1/user/login')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('email');
      result.body.should.have.property('forceSMS');
      result.body.should.have.property('extensible');

      const decodedResponse = assertDecode(PostLogin.response[200], result.body);
      assert.strictEqual(decodedResponse.email, mockFullResponse.email);
      assert.strictEqual(decodedResponse.extensible, mockFullResponse.extensible);
      assert.strictEqual(decodedResponse.initialHash, mockFullResponse.initialHash);
    });

    it('should successfully login with all optional parameters (v2)', async function () {
      const requestBody = {
        email: 'test@example.com',
        password: 'mySecurePassword123',
        otp: '123456',
        trust: 3600,
        forceSMS: true,
        extensible: true,
        forceV1Auth: false,
        ensureEcdhKeychain: true,
        forReset2FA: false,
        initialHash: 'a'.repeat(64),
        fingerprintHash: 'b'.repeat(64),
      };

      const mockFullResponse = {
        email: 'test@example.com',
        password: 'mySecurePassword123',
        forceSMS: true,
        otp: '123456',
        trust: 3600,
        extensible: true,
        extensionAddress: 'https://extension.example.com',
        forceV1Auth: false,
        forReset2FA: false,
        initialHash: 'a'.repeat(64),
        fingerprintHash: 'b'.repeat(64),
      };

      sinon.stub(BitGo.prototype, 'authenticate').resolves(mockFullResponse);

      const result = await agent
        .post('/api/v2/user/login')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('email');
      result.body.should.have.property('forceSMS');
      result.body.should.have.property('extensible');

      const decodedResponse = assertDecode(PostLogin.response[200], result.body);
      assert.strictEqual(decodedResponse.email, mockFullResponse.email);
      assert.strictEqual(decodedResponse.extensible, mockFullResponse.extensible);
      assert.strictEqual(decodedResponse.initialHash, mockFullResponse.initialHash);
    });

    it('should successfully login with username instead of email (v2)', async function () {
      const requestBody = {
        username: 'testuser',
        password: 'mySecurePassword123',
      };

      sinon.stub(BitGo.prototype, 'authenticate').resolves(mockLoginResponse);

      const result = await agent
        .post('/api/v2/user/login')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('email');
      result.body.should.have.property('forceSMS');

      const decodedResponse = assertDecode(PostLogin.response[200], result.body);
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

    it('should handle authentication failure (v1)', async function () {
      const requestBody = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      sinon.stub(BitGo.prototype, 'authenticate').rejects(new Error('Invalid credentials'));

      const result = await agent
        .post('/api/v1/user/login')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle authentication failure (v2)', async function () {
      const requestBody = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      sinon.stub(BitGo.prototype, 'authenticate').rejects(new Error('Invalid credentials'));

      const result = await agent
        .post('/api/v2/user/login')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
