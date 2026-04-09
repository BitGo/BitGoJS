import * as assert from 'assert';
import * as t from 'io-ts';
import {
  PendingApprovalParams,
  PendingApprovalRequestBody,
  PutV2PendingApproval,
  PendingApprovalResponse,
  PendingApprovalState,
  PendingApprovalType,
  PendingApprovalInfo,
  TransactionRequestInfo,
  BuildParams,
} from '../../../src/typedRoutes/api/v2/pendingApproval';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('V2 PendingApproval API Tests', function () {
  describe('Codec Validation Tests', function () {
    describe('PendingApprovalParams', function () {
      it('should validate valid params', function () {
        const validParams = {
          coin: 'tbtc',
          id: '123456789abcdef',
        };

        const decoded = assertDecode(t.type(PendingApprovalParams), validParams);
        assert.strictEqual(decoded.coin, validParams.coin);
        assert.strictEqual(decoded.id, validParams.id);
      });

      it('should reject params with missing coin', function () {
        const invalidParams = { id: '123456789abcdef' };
        assert.throws(() => assertDecode(t.type(PendingApprovalParams), invalidParams));
      });

      it('should reject params with missing id', function () {
        const invalidParams = { coin: 'tbtc' };
        assert.throws(() => assertDecode(t.type(PendingApprovalParams), invalidParams));
      });
    });

    describe('PendingApprovalRequestBody', function () {
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

        const decoded = assertDecode(t.type(PendingApprovalRequestBody), validBody);
        assert.strictEqual(decoded.state, validBody.state);
        assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
        assert.strictEqual(decoded.otp, validBody.otp);
        assert.strictEqual(decoded.tx, validBody.tx);
        assert.strictEqual(decoded.xprv, validBody.xprv);
        assert.strictEqual(decoded.previewPendingTxs, validBody.previewPendingTxs);
        assert.strictEqual(decoded.pendingApprovalId, validBody.pendingApprovalId);
      });

      it('should validate empty body', function () {
        const decoded = assertDecode(t.type(PendingApprovalRequestBody), {});
        assert.strictEqual(decoded.state, undefined);
        assert.strictEqual(decoded.walletPassphrase, undefined);
      });

      it('should reject body with invalid types', function () {
        assert.throws(() => assertDecode(t.type(PendingApprovalRequestBody), { state: 123 }));
        assert.throws(() => assertDecode(t.type(PendingApprovalRequestBody), { walletPassphrase: 12345 }));
        assert.throws(() => assertDecode(t.type(PendingApprovalRequestBody), { otp: 123456 }));
        assert.throws(() => assertDecode(t.type(PendingApprovalRequestBody), { previewPendingTxs: 'true' }));
      });
    });

    describe('PendingApprovalState', function () {
      it('should validate all pending approval states', function () {
        const validStates = [
          'pending',
          'awaitingSignature',
          'pendingBitGoAdminApproval',
          'pendingIdVerification',
          'pendingCustodianApproval',
          'pendingFinalApproval',
          'approved',
          'processing',
          'rejected',
        ];

        validStates.forEach((state) => {
          const decoded = assertDecode(PendingApprovalState, state);
          assert.strictEqual(decoded, state);
        });
      });

      it('should reject invalid state', function () {
        assert.throws(() => assertDecode(PendingApprovalState, 'invalid'));
      });
    });

    describe('PendingApprovalType', function () {
      it('should validate all pending approval types', function () {
        const validTypes = [
          'userChangeRequest',
          'transactionRequest',
          'policyRuleRequest',
          'updateApprovalsRequiredRequest',
          'transactionRequestFull',
        ];

        validTypes.forEach((type) => {
          const decoded = assertDecode(PendingApprovalType, type);
          assert.strictEqual(decoded, type);
        });
      });

      it('should reject invalid type', function () {
        assert.throws(() => assertDecode(PendingApprovalType, 'invalid'));
      });
    });

    describe('BuildParams', function () {
      it('should validate buildParams with type', function () {
        const validParams = { type: 'fanout' };
        const decoded = assertDecode(BuildParams, validParams);
        assert.strictEqual(decoded.type, 'fanout');
      });

      it('should validate buildParams with additional properties', function () {
        const validParams = {
          type: 'consolidate',
          minConfirms: 1,
          feeRate: 10000,
        };

        const decoded = assertDecode(BuildParams, validParams);
        assert.strictEqual(decoded.type, 'consolidate');
        assert.strictEqual((decoded as any).minConfirms, 1);
      });
    });

    describe('TransactionRequestInfo', function () {
      it('should validate transactionRequest with all fields', function () {
        const validTransactionRequest = {
          coinSpecific: { fee: 1000, txHex: '0x123' },
          recipients: [{ address: '2N8ryDAob6Qn8uCsWvkkQDhyeCQTqybGUFe', amount: 100000 }],
          buildParams: { type: 'fanout' },
          sourceWallet: 'wallet123',
        };

        const decoded = assertDecode(TransactionRequestInfo, validTransactionRequest);
        assert.ok(decoded.coinSpecific);
        assert.ok(decoded.recipients);
        assert.ok(decoded.buildParams);
        assert.strictEqual(decoded.sourceWallet, 'wallet123');
      });
    });

    describe('PendingApprovalInfo', function () {
      it('should validate info with only type field', function () {
        const validInfo = { type: 'transactionRequest' };
        const decoded = assertDecode(PendingApprovalInfo, validInfo);
        assert.strictEqual(decoded.type, 'transactionRequest');
      });

      it('should validate info with transactionRequest', function () {
        const validInfo = {
          type: 'transactionRequest',
          transactionRequest: {
            coinSpecific: { fee: 1000 },
            recipients: [{ address: '2N8ryDAob6Qn8uCsWvkkQDhyeCQTqybGUFe', amount: 100000 }],
            buildParams: { type: 'fanout' },
          },
        };

        const decoded = assertDecode(PendingApprovalInfo, validInfo);
        assert.strictEqual(decoded.type, 'transactionRequest');
        assert.ok(decoded.transactionRequest);
      });

      it('should reject info with missing type', function () {
        assert.throws(() => assertDecode(PendingApprovalInfo, { transactionRequest: {} }));
      });

      it('should reject info with invalid type', function () {
        assert.throws(() => assertDecode(PendingApprovalInfo, { type: 'invalidType' }));
      });
    });

    describe('PendingApprovalResponse', function () {
      it('should validate response with required fields', function () {
        const validResponse = {
          id: 'approval123',
          state: 'approved',
          creator: 'user123',
          info: { type: 'transactionRequest' },
        };

        const decoded = assertDecode(PendingApprovalResponse, validResponse);
        assert.strictEqual(decoded.id, validResponse.id);
        assert.strictEqual(decoded.state, validResponse.state);
        assert.strictEqual(decoded.creator, validResponse.creator);
      });

      it('should validate response with optional fields', function () {
        const validResponse = {
          id: 'approval123',
          state: 'pending',
          creator: 'user123',
          info: {
            type: 'transactionRequest',
            transactionRequest: {
              coinSpecific: { fee: 1000 },
              recipients: [{ address: '2N8ryDAob6Qn8uCsWvkkQDhyeCQTqybGUFe', amount: 100000 }],
              buildParams: { type: 'fanout' },
            },
          },
          wallet: 'wallet123',
          enterprise: 'enterprise123',
          approvalsRequired: 2,
          txRequestId: 'txreq123',
        };

        const decoded = assertDecode(PendingApprovalResponse, validResponse);
        assert.strictEqual(decoded.wallet, validResponse.wallet);
        assert.strictEqual(decoded.enterprise, validResponse.enterprise);
        assert.strictEqual(decoded.approvalsRequired, validResponse.approvalsRequired);
        assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
      });

      it('should reject response with missing required fields', function () {
        assert.throws(() => assertDecode(PendingApprovalResponse, { state: 'approved' }));
        assert.throws(() =>
          assertDecode(PendingApprovalResponse, {
            id: 'approval123',
            creator: 'user123',
            info: { type: 'transactionRequest' },
          })
        );
      });

      it('should allow additional properties in response', function () {
        const response = {
          id: 'approval123',
          state: 'approved',
          creator: 'user123',
          info: { type: 'transactionRequest' },
          coin: 'tbtc',
          scope: 'wallet',
          createDate: '2024-01-01T00:00:00.000Z',
        };

        const decoded = assertDecode(PendingApprovalResponse, response);
        assert.strictEqual(decoded.id, 'approval123');
      });
    });

    describe('Route Definition', function () {
      it('should have correct path and method', function () {
        assert.strictEqual(PutV2PendingApproval.path, '/api/v2/{coin}/pendingapprovals/{id}');
        assert.strictEqual(PutV2PendingApproval.method, 'PUT');
      });

      it('should have correct response types', function () {
        assert.ok(PutV2PendingApproval.response[200]);
        assert.ok(PutV2PendingApproval.response[400]);
      });
    });
  });

  describe('Integration Tests', function () {
    const agent = setupAgent();

    const mockApprovedResponse = {
      id: 'approval123',
      state: 'approved',
      creator: 'user123',
      info: {
        type: 'transactionRequest',
        transactionRequest: {
          coinSpecific: { btc: { txHex: '0x123' } },
          recipients: [{ address: '2N8ryDAob6Qn8uCsWvkkQDhyeCQTqybGUFe', amount: 100000 }],
          buildParams: { type: 'fanout' },
        },
      },
      wallet: 'wallet123',
      approvalsRequired: 2,
      txRequestId: 'txreq123',
    };

    const mockRejectedResponse = {
      id: 'approval123',
      state: 'rejected',
      creator: 'user123',
      info: { type: 'transactionRequest' },
      wallet: 'wallet123',
    };

    afterEach(function () {
      sinon.restore();
    });

    describe('Success Cases', function () {
      it('should successfully approve pending approval', async function () {
        const coin = 'tbtc';
        const approvalId = '123456789abcdef';
        const requestBody = {
          state: 'approved',
          walletPassphrase: 'mySecurePassword',
        };

        const mockPendingApprovalObject = {
          approve: sinon.stub().resolves(mockApprovedResponse),
          reject: sinon.stub().resolves(mockRejectedResponse),
        };

        const mockCoin = {
          pendingApprovals: sinon.stub().returns({
            get: sinon.stub().resolves(mockPendingApprovalObject),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        result.body.should.have.property('id');
        result.body.should.have.property('state');
        assert.strictEqual(result.body.state, 'approved');
        sinon.assert.calledOnce(mockPendingApprovalObject.approve);
      });

      it('should successfully reject pending approval', async function () {
        const coin = 'tbtc';
        const approvalId = '123456789abcdef';
        const requestBody = { state: 'rejected' };

        const mockPendingApprovalObject = {
          approve: sinon.stub().resolves(mockApprovedResponse),
          reject: sinon.stub().resolves(mockRejectedResponse),
        };

        const mockCoin = {
          pendingApprovals: sinon.stub().returns({
            get: sinon.stub().resolves(mockPendingApprovalObject),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body.state, 'rejected');
        sinon.assert.calledOnce(mockPendingApprovalObject.reject);
      });

      it('should default to rejection with empty body', async function () {
        const coin = 'tbtc';
        const approvalId = '123456789abcdef';

        const mockPendingApprovalObject = {
          approve: sinon.stub().resolves(mockApprovedResponse),
          reject: sinon.stub().resolves(mockRejectedResponse),
        };

        const mockCoin = {
          pendingApprovals: sinon.stub().returns({
            get: sinon.stub().resolves(mockPendingApprovalObject),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send({});

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body.state, 'rejected');
        sinon.assert.calledOnce(mockPendingApprovalObject.reject);
        sinon.assert.notCalled(mockPendingApprovalObject.approve);
      });

      it('should approve with otp', async function () {
        const coin = 'tbtc';
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

        const mockCoin = {
          pendingApprovals: sinon.stub().returns({
            get: sinon.stub().resolves(mockPendingApprovalObject),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        sinon.assert.calledWith(mockPendingApprovalObject.approve, sinon.match({ otp: '123456' }));
      });

      it('should handle transaction request with fanout', async function () {
        const coin = 'tbtc';
        const approvalId = '123456789abcdef';
        const requestBody = {
          state: 'approved',
          walletPassphrase: 'mySecurePassword',
        };

        const mockResponseWithFullTxRequest = {
          id: 'approval123',
          state: 'approved',
          creator: 'user123',
          info: {
            type: 'transactionRequest',
            transactionRequest: {
              coinSpecific: { btc: { txHex: '0x123456' } },
              recipients: [{ address: '2N8ryDAob6Qn8uCsWvkkQDhyeCQTqybGUFe', amount: 100000 }],
              buildParams: { type: 'fanout', minConfirms: 1 },
              sourceWallet: 'wallet123',
            },
          },
          wallet: 'wallet123',
          txRequestId: 'txreq123',
        };

        const mockPendingApprovalObject = {
          approve: sinon.stub().resolves(mockResponseWithFullTxRequest),
          reject: sinon.stub().resolves(mockRejectedResponse),
        };

        const mockCoin = {
          pendingApprovals: sinon.stub().returns({
            get: sinon.stub().resolves(mockPendingApprovalObject),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body.info.type, 'transactionRequest');
        assert.ok(result.body.info.transactionRequest);
        assert.strictEqual(result.body.info.transactionRequest.buildParams.type, 'fanout');
      });
    });

    describe('Error Handling', function () {
      it('should handle SDK approve method failure', async function () {
        const coin = 'tbtc';
        const approvalId = '123456789abcdef';

        const mockPendingApprovalObject = {
          approve: sinon.stub().rejects(new Error('Failed to update pending approval')),
          reject: sinon.stub().resolves(mockRejectedResponse),
        };

        const mockCoin = {
          pendingApprovals: sinon.stub().returns({
            get: sinon.stub().resolves(mockPendingApprovalObject),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .send({ state: 'approved', walletPassphrase: 'mySecurePassword' });

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle SDK reject method failure', async function () {
        const coin = 'tbtc';
        const approvalId = '123456789abcdef';

        const mockPendingApprovalObject = {
          approve: sinon.stub().resolves(mockApprovedResponse),
          reject: sinon.stub().rejects(new Error('Failed to reject')),
        };

        const mockCoin = {
          pendingApprovals: sinon.stub().returns({
            get: sinon.stub().resolves(mockPendingApprovalObject),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .send({ state: 'rejected' });

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle pending approval not found', async function () {
        const coin = 'tbtc';
        const approvalId = 'nonexistent';

        const mockCoin = {
          pendingApprovals: sinon.stub().returns({
            get: sinon.stub().rejects(new Error('Pending approval not found')),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .send({ state: 'approved' });

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle invalid coin', async function () {
        const coin = 'invalidcoin';
        const approvalId = '123456789abcdef';

        sinon.stub(BitGo.prototype, 'coin').throws(new Error('Unsupported coin'));

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .send({ state: 'approved' });

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle invalid request body types', async function () {
        const coin = 'tbtc';
        const approvalId = '123456789abcdef';

        const result = await agent
          .put(`/api/v2/${coin}/pendingapprovals/${approvalId}`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .send({ state: 'approved', walletPassphrase: 12345 });

        assert.ok(result.status >= 400);
      });

      it('should handle missing authorization', async function () {
        const coin = 'tbtc';
        const approvalId = '123456789abcdef';

        const result = await agent.put(`/api/v2/${coin}/pendingapprovals/${approvalId}`).send({ state: 'approved' });

        assert.ok(result.status >= 400);
      });
    });
  });
});
