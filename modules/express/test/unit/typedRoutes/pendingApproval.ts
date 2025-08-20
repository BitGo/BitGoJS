import * as assert from 'assert';
import * as t from 'io-ts';
import {
  pendingApprovalRequestParams,
  pendingApprovalRequestBody,
  PutPendingApproval,
} from '../../../src/typedRoutes/api/v1/pendingApproval';
import { assertDecode } from './common';
/**
 * Helper function to test io-ts codec decoding
 */

describe('PendingApproval codec tests', function () {
  describe('pendingApprovalRequestParams', function () {
    it('should validate valid params', function () {
      const validParams = {
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestParams), validParams);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing id', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        id: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestParams), invalidParams);
      });
    });
  });

  describe('pendingApprovalRequestBody', function () {
    it('should validate body with all fields', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassword',
        otp: '123456',
        tx: 'transactionHexString',
        xprv: 'xprvString',
        previewPendingTxs: true,
        pendingApprovalId: 'pendingApproval123',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.otp, validBody.otp);
      assert.strictEqual(decoded.tx, validBody.tx);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.previewPendingTxs, validBody.previewPendingTxs);
      assert.strictEqual(decoded.pendingApprovalId, validBody.pendingApprovalId);
    });

    it('should validate body with no fields (all optional)', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.otp, undefined);
      assert.strictEqual(decoded.tx, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.previewPendingTxs, undefined);
      assert.strictEqual(decoded.pendingApprovalId, undefined);
    });

    it('should validate body with some fields', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassword',
        otp: '123456',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.otp, validBody.otp);
      assert.strictEqual(decoded.tx, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.previewPendingTxs, undefined);
      assert.strictEqual(decoded.pendingApprovalId, undefined);
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletPassphrase: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string otp', function () {
      const invalidBody = {
        otp: 123456, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string tx', function () {
      const invalidBody = {
        tx: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        xprv: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean previewPendingTxs', function () {
      const invalidBody = {
        previewPendingTxs: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string pendingApprovalId', function () {
      const invalidBody = {
        pendingApprovalId: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle empty strings for string fields', function () {
      const body = {
        walletPassphrase: '',
        otp: '',
        tx: '',
        xprv: '',
        pendingApprovalId: '',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), body);
      assert.strictEqual(decoded.walletPassphrase, '');
      assert.strictEqual(decoded.otp, '');
      assert.strictEqual(decoded.tx, '');
      assert.strictEqual(decoded.xprv, '');
      assert.strictEqual(decoded.pendingApprovalId, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        walletPassphrase: 'mySecurePassword',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(pendingApprovalRequestBody)), body);
      assert.strictEqual(decoded.walletPassphrase, 'mySecurePassword');
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('PutPendingApproval route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PutPendingApproval.path, '/api/v1/pendingapprovals/{id}/express');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PutPendingApproval.method, 'PUT');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PutPendingApproval.request);

      // The request is created using httpRequest which takes params and body
      // We can't directly access these properties in the test, but we can verify
      // the request exists
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PutPendingApproval.response[200]);
      assert.ok(PutPendingApproval.response[400]);
    });
  });
});
