import * as assert from 'assert';
import * as t from 'io-ts';
import {
  OFCSignPayloadRequestBody,
  OFCSignPayloadResponse,
  PostOFCSignPayload,
} from '../../../src/typedRoutes/api/v2/ofcSignPayload';
import { assertDecode } from './common';

describe('OFCSignPayload codec tests', function () {
  describe('OFCSignPayloadRequestBody', function () {
    it('should validate body with required fields', function () {
      const validBody = {
        walletId: '123456789abcdef',
        payload: '{"key": "value"}',
      };

      const decoded = assertDecode(t.type(OFCSignPayloadRequestBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      assert.strictEqual(decoded.payload, validBody.payload);
      assert.strictEqual(decoded.walletPassphrase, undefined);
    });

    it('should validate body with all fields including optional ones', function () {
      const validBody = {
        walletId: '123456789abcdef',
        payload: '{"key": "value"}',
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(OFCSignPayloadRequestBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      assert.strictEqual(decoded.payload, validBody.payload);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with string JSON payload', function () {
      const validBody = {
        walletId: '123456789abcdef',
        payload: '{"transaction": "data", "amount": 100}',
      };

      const decoded = assertDecode(t.type(OFCSignPayloadRequestBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      assert.strictEqual(decoded.payload, validBody.payload);
    });

    it('should validate body with simple string payload', function () {
      const validBody = {
        walletId: '123456789abcdef',
        payload: 'message to sign',
      };

      const decoded = assertDecode(t.type(OFCSignPayloadRequestBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      assert.strictEqual(decoded.payload, validBody.payload);
    });

    it('should reject body with missing walletId', function () {
      const invalidBody = {
        payload: '{"key": "value"}',
      };

      assert.throws(() => {
        assertDecode(t.type(OFCSignPayloadRequestBody), invalidBody);
      });
    });

    it('should reject body with missing payload', function () {
      const invalidBody = {
        walletId: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(OFCSignPayloadRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string walletId', function () {
      const invalidBody = {
        walletId: 123456, // number instead of string
        payload: '{"key": "value"}',
      };

      assert.throws(() => {
        assertDecode(t.type(OFCSignPayloadRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string payload', function () {
      const invalidBody = {
        walletId: '123456789abcdef',
        payload: { key: 'value' }, // object instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(OFCSignPayloadRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletId: '123456789abcdef',
        payload: '{"key": "value"}',
        walletPassphrase: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(OFCSignPayloadRequestBody), invalidBody);
      });
    });
  });

  describe('OFCSignPayloadResponse', function () {
    it('should validate response with required fields', function () {
      const validResponse = {
        payload: '{"key": "value"}',
        signature:
          '3045022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      };

      const decoded = assertDecode(OFCSignPayloadResponse, validResponse);
      assert.strictEqual(decoded.payload, validResponse.payload);
      assert.strictEqual(decoded.signature, validResponse.signature);
    });

    it('should validate response with string JSON payload', function () {
      const validResponse = {
        payload: '{"transaction": "data", "amount": 100}',
        signature:
          '3045022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      };

      const decoded = assertDecode(OFCSignPayloadResponse, validResponse);
      assert.strictEqual(decoded.payload, validResponse.payload);
      assert.strictEqual(decoded.signature, validResponse.signature);
    });

    it('should validate response with simple string payload', function () {
      const validResponse = {
        payload: 'message to sign',
        signature:
          '3045022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      };

      const decoded = assertDecode(OFCSignPayloadResponse, validResponse);
      assert.strictEqual(decoded.payload, validResponse.payload);
      assert.strictEqual(decoded.signature, validResponse.signature);
    });

    it('should reject response with missing payload', function () {
      const invalidResponse = {
        signature:
          '3045022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      };

      assert.throws(() => {
        assertDecode(OFCSignPayloadResponse, invalidResponse);
      });
    });

    it('should reject response with missing signature', function () {
      const invalidResponse = {
        payload: '{"key": "value"}',
      };

      assert.throws(() => {
        assertDecode(OFCSignPayloadResponse, invalidResponse);
      });
    });

    it('should reject response with non-string payload', function () {
      const invalidResponse = {
        payload: { key: 'value' }, // object instead of string
        signature:
          '3045022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2022100a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      };

      assert.throws(() => {
        assertDecode(OFCSignPayloadResponse, invalidResponse);
      });
    });

    it('should reject response with non-string signature', function () {
      const invalidResponse = {
        payload: '{"key": "value"}',
        signature: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(OFCSignPayloadResponse, invalidResponse);
      });
    });
  });

  describe('PostOFCSignPayload route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostOFCSignPayload.path, '/api/v2/ofc/signPayload');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostOFCSignPayload.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostOFCSignPayload.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostOFCSignPayload.response[200]);
      assert.ok(PostOFCSignPayload.response[400]);
      assert.ok(PostOFCSignPayload.response[404]);
      assert.ok(PostOFCSignPayload.response[500]);
    });
  });
});
