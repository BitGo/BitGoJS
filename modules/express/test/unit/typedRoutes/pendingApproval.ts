import * as assert from 'assert';
import * as t from 'io-ts';
import {
  pendingApprovalRequestParams,
  pendingApprovalRequestBody,
  PutPendingApproval,
} from '../../../src/typedRoutes/api/v1/pendingApproval';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';
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
        state: 'approved',
        walletPassphrase: 'mySecurePassword',
        otp: '123456',
        tx: 'transactionHexString',
        xprv: 'xprvString',
        previewPendingTxs: true,
        pendingApprovalId: 'pendingApproval123',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.state, validBody.state);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.otp, validBody.otp);
      assert.strictEqual(decoded.tx, validBody.tx);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.previewPendingTxs, validBody.previewPendingTxs);
      assert.strictEqual(decoded.pendingApprovalId, validBody.pendingApprovalId);
    });

    it('should validate body with only state field', function () {
      const validBody = {
        state: 'approved',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.state, validBody.state);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.otp, undefined);
      assert.strictEqual(decoded.tx, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.previewPendingTxs, undefined);
      assert.strictEqual(decoded.pendingApprovalId, undefined);
    });

    it('should validate body with some fields', function () {
      const validBody = {
        state: 'rejected',
        walletPassphrase: 'mySecurePassword',
        otp: '123456',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.state, validBody.state);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.otp, validBody.otp);
      assert.strictEqual(decoded.tx, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.previewPendingTxs, undefined);
      assert.strictEqual(decoded.pendingApprovalId, undefined);
    });

    it('should validate body with missing state field (defaults to rejection)', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassword',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.state, undefined);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate empty body (defaults to rejection)', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.state, undefined);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.otp, undefined);
      assert.strictEqual(decoded.tx, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.previewPendingTxs, undefined);
      assert.strictEqual(decoded.pendingApprovalId, undefined);
    });

    it('should reject body with non-string state', function () {
      const invalidBody = {
        state: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should validate body with state "approved"', function () {
      const validBody = {
        state: 'approved',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.state, 'approved');
    });

    it('should validate body with state "rejected"', function () {
      const validBody = {
        state: 'rejected',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), validBody);
      assert.strictEqual(decoded.state, 'rejected');
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        state: 'approved',
        walletPassphrase: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string otp', function () {
      const invalidBody = {
        state: 'approved',
        otp: 123456, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string tx', function () {
      const invalidBody = {
        state: 'approved',
        tx: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        state: 'approved',
        xprv: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean previewPendingTxs', function () {
      const invalidBody = {
        state: 'approved',
        previewPendingTxs: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(pendingApprovalRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string pendingApprovalId', function () {
      const invalidBody = {
        state: 'approved',
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
        state: '',
        walletPassphrase: '',
        otp: '',
        tx: '',
        xprv: '',
        pendingApprovalId: '',
      };

      const decoded = assertDecode(t.type(pendingApprovalRequestBody), body);
      assert.strictEqual(decoded.state, '');
      assert.strictEqual(decoded.walletPassphrase, '');
      assert.strictEqual(decoded.otp, '');
      assert.strictEqual(decoded.tx, '');
      assert.strictEqual(decoded.xprv, '');
      assert.strictEqual(decoded.pendingApprovalId, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        state: 'approved',
        walletPassphrase: 'mySecurePassword',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(pendingApprovalRequestBody)), body);
      assert.strictEqual(decoded.state, 'approved');
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

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockApprovedResponse = {
      id: 'approval123',
      state: 'approved',
      wallet: 'wallet123',
      enterprise: 'enterprise123',
    };

    const mockRejectedResponse = {
      id: 'approval123',
      state: 'rejected',
      wallet: 'wallet123',
      enterprise: 'enterprise123',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully approve pending approval', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {
        state: 'approved',
        walletPassphrase: 'mySecurePassword',
      };

      const mockPendingApprovalObject = {
        approve: sinon.stub().resolves(mockApprovedResponse),
        reject: sinon.stub().resolves(mockRejectedResponse),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns({
        get: sinon.stub().resolves(mockPendingApprovalObject),
      } as any);

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('id');
      result.body.should.have.property('state');
      assert.strictEqual(result.body.id, mockApprovedResponse.id);
      assert.strictEqual(result.body.state, 'approved');
      assert.strictEqual(result.body.wallet, mockApprovedResponse.wallet);
      assert.strictEqual(result.body.enterprise, mockApprovedResponse.enterprise);
    });

    it('should successfully reject pending approval', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {
        state: 'rejected',
        walletPassphrase: 'mySecurePassword',
      };

      const mockPendingApprovalObject = {
        approve: sinon.stub().resolves(mockApprovedResponse),
        reject: sinon.stub().resolves(mockRejectedResponse),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns({
        get: sinon.stub().resolves(mockPendingApprovalObject),
      } as any);

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('id');
      result.body.should.have.property('state');
      assert.strictEqual(result.body.id, mockRejectedResponse.id);
      assert.strictEqual(result.body.state, 'rejected');
      assert.strictEqual(result.body.wallet, mockRejectedResponse.wallet);
      assert.strictEqual(result.body.enterprise, mockRejectedResponse.enterprise);
    });

    it('should successfully approve with otp', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {
        state: 'approved',
        walletPassphrase: 'mySecurePassword',
        otp: '123456',
      };

      const mockPendingApprovalObject = {
        approve: sinon.stub().resolves(mockApprovedResponse),
        reject: sinon.stub().resolves(mockRejectedResponse),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns({
        get: sinon.stub().resolves(mockPendingApprovalObject),
      } as any);

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.id, mockApprovedResponse.id);
      assert.strictEqual(result.body.state, 'approved');
    });

    it('should successfully approve with xprv', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {
        state: 'approved',
        xprv: 'xprvString',
      };

      const mockPendingApprovalObject = {
        approve: sinon.stub().resolves(mockApprovedResponse),
        reject: sinon.stub().resolves(mockRejectedResponse),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns({
        get: sinon.stub().resolves(mockPendingApprovalObject),
      } as any);

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.id, mockApprovedResponse.id);
      assert.strictEqual(result.body.state, 'approved');
    });

    it('should successfully preview pending transactions', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {
        state: 'approved',
        previewPendingTxs: true,
      };

      const mockPreviewResponse = {
        id: 'approval123',
        txHex: '0x123456789',
        pendingTransactions: [],
      };

      const mockPendingApprovalObject = {
        approve: sinon.stub().resolves(mockPreviewResponse),
        reject: sinon.stub().resolves(mockPreviewResponse),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns({
        get: sinon.stub().resolves(mockPendingApprovalObject),
      } as any);

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.id, mockPreviewResponse.id);
      assert.strictEqual(result.body.txHex, mockPreviewResponse.txHex);
      result.body.should.have.property('pendingTransactions');
    });

    it('should successfully reject with empty body (defaults to reject)', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {};

      const mockPendingApprovalObject = {
        approve: sinon.stub().resolves(mockApprovedResponse),
        reject: sinon.stub().resolves(mockRejectedResponse),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns({
        get: sinon.stub().resolves(mockPendingApprovalObject),
      } as any);

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.id, mockRejectedResponse.id);
      assert.strictEqual(result.body.state, 'rejected');
    });
  });

  describe('Error Handling Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should handle SDK method failure', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {
        state: 'approved',
        walletPassphrase: 'mySecurePassword',
      };

      const mockPendingApprovalObject = {
        approve: sinon.stub().rejects(new Error('Failed to update pending approval')),
        reject: sinon.stub().rejects(new Error('Failed to update pending approval')),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns({
        get: sinon.stub().resolves(mockPendingApprovalObject),
      } as any);

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid type in request field', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {
        state: 'approved',
        walletPassphrase: 12345, // number instead of string
      };

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should handle invalid previewPendingTxs type', async function () {
      const approvalId = '123456789abcdef';
      const requestBody = {
        state: 'approved',
        previewPendingTxs: 'true', // string instead of boolean
      };

      const result = await agent
        .put(`/api/v1/pendingapprovals/${approvalId}/express`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });
  });
});
