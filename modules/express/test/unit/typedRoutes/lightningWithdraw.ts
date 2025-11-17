import * as assert from 'assert';
import * as t from 'io-ts';
import {
  LightningWithdrawParams,
  LightningWithdrawRequestBody,
  LightningWithdrawResponseType,
} from '../../../src/typedRoutes/api/v2/lightningWithdraw';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('Lightning Withdraw codec tests', function () {
  describe('Path Parameters Validation', function () {
    it('should correctly decode valid path parameters', function () {
      const validParams = {
        coin: 'tlnbtc',
        id: '68c02f96aa757d9212bd1a536f123456',
      };

      const params = t.type(LightningWithdrawParams);
      const decoded = assertDecode(params, validParams);

      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject path parameters with missing coin', function () {
      const invalidParams = {
        id: '68c02f96aa757d9212bd1a536f123456',
      };

      const params = t.type(LightningWithdrawParams);
      const result = params.decode(invalidParams);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should reject path parameters with missing id', function () {
      const invalidParams = {
        coin: 'tlnbtc',
      };

      const params = t.type(LightningWithdrawParams);
      const result = params.decode(invalidParams);

      assert.strictEqual(result._tag, 'Left');
    });
  });

  describe('Request Body Validation', function () {
    it('should correctly decode valid request body with all fields', function () {
      const validBody = {
        recipients: [
          {
            amountSat: '500000',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
          {
            amountSat: '250000',
            address: 'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080',
          },
        ],
        passphrase: 'test-passphrase-12345',
        satsPerVbyte: '15',
        numBlocks: 3,
        sequenceId: 'test-sequence-123',
        comment: 'Test withdrawal',
      };

      const body = t.type(LightningWithdrawRequestBody);
      const decoded = assertDecode(body, validBody);

      assert.strictEqual(decoded.recipients.length, 2);
      assert.strictEqual(decoded.recipients[0].amountSat, BigInt('500000'));
      assert.strictEqual(decoded.recipients[0].address, validBody.recipients[0].address);
      assert.strictEqual(decoded.recipients[1].amountSat, BigInt('250000'));
      assert.strictEqual(decoded.recipients[1].address, validBody.recipients[1].address);
      assert.strictEqual(decoded.passphrase, validBody.passphrase);
      assert.strictEqual(decoded.satsPerVbyte, BigInt('15'));
      assert.strictEqual(decoded.numBlocks, 3);
      assert.strictEqual(decoded.sequenceId, validBody.sequenceId);
      assert.strictEqual(decoded.comment, validBody.comment);
    });

    it('should correctly decode valid request body with only required fields', function () {
      const validBody = {
        recipients: [
          {
            amountSat: '1000000',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        passphrase: 'test-passphrase-12345',
      };

      const body = t.type(LightningWithdrawRequestBody);
      const decoded = assertDecode(body, validBody);

      assert.strictEqual(decoded.recipients.length, 1);
      assert.strictEqual(decoded.recipients[0].amountSat, BigInt('1000000'));
      assert.strictEqual(decoded.passphrase, validBody.passphrase);
      assert.strictEqual(decoded.satsPerVbyte, undefined);
      assert.strictEqual(decoded.numBlocks, undefined);
      assert.strictEqual(decoded.sequenceId, undefined);
      assert.strictEqual(decoded.comment, undefined);
    });

    it('should reject request body with missing recipients', function () {
      const invalidBody = {
        passphrase: 'test-passphrase-12345',
        satsPerVbyte: '15',
      };

      const body = t.type(LightningWithdrawRequestBody);
      const result = body.decode(invalidBody);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should reject request body with missing passphrase', function () {
      const invalidBody = {
        recipients: [
          {
            amountSat: '500000',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        satsPerVbyte: '15',
      };

      const body = t.type(LightningWithdrawRequestBody);
      const result = body.decode(invalidBody);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should reject recipient with missing amountSat', function () {
      const invalidBody = {
        recipients: [
          {
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        passphrase: 'test-passphrase-12345',
      };

      const body = t.type(LightningWithdrawRequestBody);
      const result = body.decode(invalidBody);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should reject recipient with missing address', function () {
      const invalidBody = {
        recipients: [
          {
            amountSat: '500000',
          },
        ],
        passphrase: 'test-passphrase-12345',
      };

      const body = t.type(LightningWithdrawRequestBody);
      const result = body.decode(invalidBody);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should reject recipient with invalid amountSat format', function () {
      const invalidBody = {
        recipients: [
          {
            amountSat: 'invalid-number',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        passphrase: 'test-passphrase-12345',
      };

      const body = t.type(LightningWithdrawRequestBody);
      const result = body.decode(invalidBody);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should correctly decode satsPerVbyte as BigInt', function () {
      const validBody = {
        recipients: [
          {
            amountSat: '500000',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        passphrase: 'test-passphrase-12345',
        satsPerVbyte: '25',
      };

      const body = t.type(LightningWithdrawRequestBody);
      const decoded = assertDecode(body, validBody);

      assert.strictEqual(typeof decoded.satsPerVbyte, 'bigint');
      assert.strictEqual(decoded.satsPerVbyte, BigInt('25'));
    });
  });

  describe('Response Validation', function () {
    it('should correctly decode successful withdrawal response', function () {
      const validResponse = {
        txRequestId: 'txreq-123456',
        txRequestState: 'delivered',
        withdrawStatus: {
          status: 'delivered',
          txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      };

      const response = LightningWithdrawResponseType[200];
      const decoded = assertDecode(response, validResponse);

      assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
      assert.strictEqual(decoded.txRequestState, validResponse.txRequestState);
      assert.strictEqual(decoded.withdrawStatus?.status, 'delivered');
      assert.strictEqual(decoded.withdrawStatus?.txid, validResponse.withdrawStatus.txid);
    });

    it('should correctly decode response with pending approval', function () {
      const validResponse = {
        txRequestId: 'txreq-123456',
        txRequestState: 'pendingApproval',
        pendingApproval: {
          id: 'approval-789',
          state: 'pending',
          creator: 'user-123',
          info: {
            type: 'transactionRequest',
          },
          wallet: 'wallet-456',
          approvalsRequired: 2,
        },
      };

      const response = LightningWithdrawResponseType[200];
      const decoded = assertDecode(response, validResponse);

      assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
      assert.strictEqual(decoded.txRequestState, validResponse.txRequestState);
      assert.strictEqual(decoded.pendingApproval?.id, validResponse.pendingApproval.id);
      assert.strictEqual(decoded.pendingApproval?.state, validResponse.pendingApproval.state);
      assert.strictEqual(decoded.pendingApproval?.creator, validResponse.pendingApproval.creator);
      assert.strictEqual(decoded.pendingApproval?.info.type, validResponse.pendingApproval.info.type);
    });

    it('should correctly decode response with failed withdrawal', function () {
      const validResponse = {
        txRequestId: 'txreq-123456',
        txRequestState: 'delivered',
        withdrawStatus: {
          status: 'failed',
          failureReason: 'Insufficient funds',
        },
      };

      const response = LightningWithdrawResponseType[200];
      const decoded = assertDecode(response, validResponse);

      assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
      assert.strictEqual(decoded.withdrawStatus?.status, 'failed');
      assert.strictEqual(decoded.withdrawStatus?.failureReason, validResponse.withdrawStatus.failureReason);
    });

    it('should correctly decode response with minimal fields', function () {
      const validResponse = {
        txRequestId: 'txreq-123456',
        txRequestState: 'initialized',
      };

      const response = LightningWithdrawResponseType[200];
      const decoded = assertDecode(response, validResponse);

      assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
      assert.strictEqual(decoded.txRequestState, validResponse.txRequestState);
      assert.strictEqual(decoded.pendingApproval, undefined);
      assert.strictEqual(decoded.withdrawStatus, undefined);
    });

    it('should reject response with missing txRequestId', function () {
      const invalidResponse = {
        txRequestState: 'delivered',
      };

      const response = LightningWithdrawResponseType[200];
      const result = response.decode(invalidResponse);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should reject response with missing txRequestState', function () {
      const invalidResponse = {
        txRequestId: 'txreq-123456',
      };

      const response = LightningWithdrawResponseType[200];
      const result = response.decode(invalidResponse);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should reject response with invalid txRequestState', function () {
      const invalidResponse = {
        txRequestId: 'txreq-123456',
        txRequestState: 'invalid-state',
      };

      const response = LightningWithdrawResponseType[200];
      const result = response.decode(invalidResponse);

      assert.strictEqual(result._tag, 'Left');
    });

    it('should validate all TxRequestState values', function () {
      const validStates = [
        'pendingCommitment',
        'pendingApproval',
        'canceled',
        'rejected',
        'initialized',
        'pendingDelivery',
        'delivered',
        'pendingUserSignature',
        'signed',
      ];

      const response = LightningWithdrawResponseType[200];

      validStates.forEach((state) => {
        const validResponse = {
          txRequestId: 'txreq-123456',
          txRequestState: state,
        };

        const decoded = assertDecode(response, validResponse);
        assert.strictEqual(decoded.txRequestState, state);
      });
    });

    it('should validate all PendingApproval states', function () {
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

      const response = LightningWithdrawResponseType[200];

      validStates.forEach((state) => {
        const validResponse = {
          txRequestId: 'txreq-123456',
          txRequestState: 'pendingApproval',
          pendingApproval: {
            id: 'approval-789',
            state: state,
            creator: 'user-123',
            info: {
              type: 'transactionRequest',
            },
          },
        };

        const decoded = assertDecode(response, validResponse);
        assert.strictEqual(decoded.pendingApproval?.state, state);
      });
    });
  });

  /**
   * Integration Tests for Lightning Withdraw
   */
  describe('Lightning Withdraw Integration Tests', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tlnbtc';

    const mockWithdrawResponse = {
      txRequestId: 'txreq-123456789',
      txRequestState: 'delivered',
      withdrawStatus: {
        status: 'delivered',
        txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully withdraw to onchain address', async function () {
      const requestBody = {
        recipients: [
          {
            amountSat: '500000',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        passphrase: 'test-passphrase-12345',
        satsPerVbyte: '15',
        numBlocks: 3,
      };

      // Mock wallet object
      const mockWallet = {
        id: () => walletId,
        baseCoin: {
          getFamily: () => 'lnbtc',
        },
        subType: () => 'lightningSelfCustody',
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      const mockCoin = {
        wallets: () => mockWallets,
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Stub the SelfCustodialLightningWallet prototype method
      const lightningWallet = require('@bitgo/abstract-lightning');
      sinon
        .stub(lightningWallet.SelfCustodialLightningWallet.prototype, 'withdrawOnchain')
        .resolves(mockWithdrawResponse);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/lightning/withdraw`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txRequestId');
      result.body.should.have.property('txRequestState');
      assert.strictEqual(result.body.txRequestId, mockWithdrawResponse.txRequestId);
      assert.strictEqual(result.body.txRequestState, mockWithdrawResponse.txRequestState);

      // Validate response against codec
      const response = LightningWithdrawResponseType[200];
      const decodedResponse = assertDecode(response, result.body);
      assert.strictEqual(decodedResponse.txRequestId, mockWithdrawResponse.txRequestId);
      assert.strictEqual(decodedResponse.txRequestState, mockWithdrawResponse.txRequestState);
    });

    it('should return 400 error for missing recipients', async function () {
      const invalidRequestBody = {
        passphrase: 'test-passphrase-12345',
      };

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/lightning/withdraw`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(invalidRequestBody);

      assert.strictEqual(result.status, 400);
      // The error response structure from io-ts validation
      result.body.should.be.Array();
      result.body[0].should.match(/recipients/);
    });

    it('should return 400 error for missing passphrase', async function () {
      const invalidRequestBody = {
        recipients: [
          {
            amountSat: '500000',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
      };

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/lightning/withdraw`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(invalidRequestBody);

      assert.strictEqual(result.status, 400);
      // The error response structure from io-ts validation
      result.body.should.be.Array();
      result.body[0].should.match(/passphrase/);
    });

    it('should return 400 error for invalid amountSat format', async function () {
      const invalidRequestBody = {
        recipients: [
          {
            amountSat: 'not-a-number',
            address: 'bcrt1qjq48cqk2u80hewdcndf539m8nnnvt845nl68x7',
          },
        ],
        passphrase: 'test-passphrase-12345',
      };

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/lightning/withdraw`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(invalidRequestBody);

      assert.strictEqual(result.status, 400);
      result.body.should.be.Array();
      result.body[0].should.match(/amountSat/);
    });
  });
});
