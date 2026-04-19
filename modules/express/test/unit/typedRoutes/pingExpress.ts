import * as assert from 'assert';
import { GetV1PingExpress } from '../../../src/typedRoutes/api/v1/pingExpress';
import { GetV2PingExpress } from '../../../src/typedRoutes/api/v2/pingExpress';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import { setupAgent } from '../../lib/testutil';

describe('PingExpress route tests', function () {
  describe('PostV1PingExpress route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(GetV1PingExpress.path, '/api/v1/pingexpress');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(GetV1PingExpress.method, 'GET');
    });

    it('should have the correct response types', function () {
      assert.ok(GetV1PingExpress.response[200]);
      assert.ok(GetV1PingExpress.response[404]);
    });
  });

  describe('PostV2PingExpress route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(GetV2PingExpress.path, '/api/v2/pingexpress');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(GetV2PingExpress.method, 'GET');
    });

    it('should have the correct response types', function () {
      assert.ok(GetV2PingExpress.response[200]);
      assert.ok(GetV2PingExpress.response[404]);
    });
  });

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const expectedStatus = 'express server is ok!';

    it('should resolve GET /api/v1/pingexpress with the expected payload', async function () {
      const result = await agent.get('/api/v1/pingexpress');

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      assert.strictEqual(result.body.status, expectedStatus);

      const decodedResponse = assertDecode(GetV1PingExpress.response[200], result.body);
      assert.strictEqual(decodedResponse.status, expectedStatus);
    });

    it('should resolve GET /api/v2/pingexpress with the expected payload', async function () {
      const result = await agent.get('/api/v2/pingexpress');

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      assert.strictEqual(result.body.status, expectedStatus);

      const decodedResponse = assertDecode(GetV2PingExpress.response[200], result.body);
      assert.strictEqual(decodedResponse.status, expectedStatus);
    });
  });
});
