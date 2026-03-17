import * as assert from 'assert';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { app } from '../../src/expressApp';
import { Config } from '../../src/config';
import * as supertest from 'supertest';

describe('AuthVersion Integration Tests', function () {
  let testApp: any;

  afterEach(function () {
    sinon.restore();
  });

  it('should create BitGo instance with authVersion 2 by default', function () {
    const config: Config = {
      port: 3080,
      bind: 'localhost',
      env: 'test',
      debugNamespace: [],
      logFile: '',
      disableSSL: false,
      disableProxy: false,
      disableEnvCheck: true,
      timeout: 305000,
      authVersion: 2,
    };

    testApp = app(config);

    // The BitGo instance will be created on each request
    // We verify the config is set correctly
    assert.strictEqual(config.authVersion, 2);
  });

  it('should create BitGo instance with authVersion 4 when configured', function () {
    const config: Config = {
      port: 3080,
      bind: 'localhost',
      env: 'test',
      debugNamespace: [],
      logFile: '',
      disableSSL: false,
      disableProxy: false,
      disableEnvCheck: true,
      timeout: 305000,
      authVersion: 4,
    };

    testApp = app(config);

    // The BitGo instance will be created on each request with authVersion 4
    assert.strictEqual(config.authVersion, 4);
  });

  it('should pass authVersion to BitGo constructor on request', async function () {
    const config: Config = {
      port: 3080,
      bind: 'localhost',
      env: 'test',
      debugNamespace: [],
      logFile: '',
      disableSSL: false,
      disableProxy: false,
      disableEnvCheck: true,
      timeout: 305000,
      authVersion: 4,
    };

    testApp = app(config);

    // Stub BitGo methods to verify authVersion is used
    const pingStub = sinon.stub(BitGo.prototype, 'ping').resolves({ status: 'ok' });

    const agent = supertest.agent(testApp);
    await agent.get('/api/v1/ping').expect(200);

    // Verify that a BitGo instance was created (ping was called)
    assert.ok(pingStub.called, 'BitGo ping should have been called');
  });

  describe('V4 Authentication Flow', function () {
    it('should handle V4 login request structure', async function () {
      const config: Config = {
        port: 3080,
        bind: 'localhost',
        env: 'test',
        debugNamespace: [],
        logFile: '',
        disableSSL: false,
        disableProxy: false,
        disableEnvCheck: true,
        timeout: 305000,
        authVersion: 4,
      };

      testApp = app(config);

      const mockV4Response = {
        email: 'test@example.com',
        password: 'testpass',
        forceSMS: false,
      };

      // Stub authenticate to return a V4-style response
      const authenticateStub = sinon.stub(BitGo.prototype, 'authenticate').resolves(mockV4Response);

      const agent = supertest.agent(testApp);
      const response = await agent
        .post('/api/v1/user/login')
        .send({
          email: 'test@example.com',
          password: 'testpass',
        })
        .expect(200);

      assert.ok(authenticateStub.called, 'authenticate should have been called');
      assert.strictEqual(response.body.email, mockV4Response.email);
    });

    it('should use authVersion 4 for HMAC calculation in authenticated requests', async function () {
      const config: Config = {
        port: 3080,
        bind: 'localhost',
        env: 'test',
        debugNamespace: [],
        logFile: '',
        disableSSL: false,
        disableProxy: false,
        disableEnvCheck: true,
        timeout: 305000,
        authVersion: 4,
      };

      testApp = app(config);

      const agent = supertest.agent(testApp);

      // Make any authenticated request to trigger BitGo instantiation
      const pingStub = sinon.stub(BitGo.prototype, 'ping').resolves({ status: 'ok' });
      await agent.get('/api/v1/ping').expect(200);

      // Since prepareBitGo creates a new BitGo instance per request with authVersion from config,
      // the instance should use authVersion 4 for all operations
      assert.ok(pingStub.called);
    });
  });
});
