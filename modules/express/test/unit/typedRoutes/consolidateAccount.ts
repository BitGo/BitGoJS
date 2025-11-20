import * as assert from 'assert';
import * as t from 'io-ts';
import {
  ConsolidateAccountParams,
  ConsolidateAccountRequestBody,
  ConsolidateAccountResponse,
  ConsolidateAccountErrorResponse,
  PostConsolidateAccount,
} from '../../../src/typedRoutes/api/v2/consolidateAccount';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('Consolidate Account API Tests', function () {
  describe('Codec Validation Tests', function () {
    describe('ConsolidateAccountParams', function () {
      it('should validate valid params', function () {
        const validParams = {
          coin: 'algo',
          id: '68c02f96aa757d9212bd1a536f123456',
        };

        const decoded = assertDecode(t.type(ConsolidateAccountParams), validParams);
        assert.strictEqual(decoded.coin, validParams.coin);
        assert.strictEqual(decoded.id, validParams.id);
      });

      it('should reject params with missing coin', function () {
        const invalidParams = {
          id: '68c02f96aa757d9212bd1a536f123456',
        };

        assert.throws(() => {
          assertDecode(t.type(ConsolidateAccountParams), invalidParams);
        });
      });

      it('should reject params with missing id', function () {
        const invalidParams = {
          coin: 'algo',
        };

        assert.throws(() => {
          assertDecode(t.type(ConsolidateAccountParams), invalidParams);
        });
      });
    });

    describe('ConsolidateAccountRequestBody', function () {
      it('should validate empty body', function () {
        const decoded = assertDecode(t.type(ConsolidateAccountRequestBody), {});
        assert.strictEqual(decoded.consolidateAddresses, undefined);
        assert.strictEqual(decoded.walletPassphrase, undefined);
      });

      it('should validate body with consolidateAddresses', function () {
        const validBody = {
          consolidateAddresses: ['ADDR1ABC', 'ADDR2DEF'],
          walletPassphrase: 'test_passphrase',
        };

        const decoded = assertDecode(t.type(ConsolidateAccountRequestBody), validBody);
        assert.ok(Array.isArray(decoded.consolidateAddresses));
        assert.strictEqual(decoded.consolidateAddresses?.length, 2);
        assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      });

      it('should validate body with all common fields', function () {
        const validBody = {
          consolidateAddresses: ['ADDR1'],
          walletPassphrase: 'test_passphrase',
          xprv: 'xprv123',
          otp: '123456',
          sequenceId: 'seq-123',
          comment: 'Test consolidation',
          nonce: '5',
          preview: true,
        };

        const decoded = assertDecode(t.type(ConsolidateAccountRequestBody), validBody);
        assert.strictEqual(decoded.consolidateAddresses?.[0], 'ADDR1');
        assert.strictEqual(decoded.sequenceId, validBody.sequenceId);
        assert.strictEqual(decoded.comment, validBody.comment);
      });

      it('should reject invalid types', function () {
        assert.throws(() => assertDecode(t.type(ConsolidateAccountRequestBody), { walletPassphrase: 123 }));
        assert.throws(() => assertDecode(t.type(ConsolidateAccountRequestBody), { consolidateAddresses: 'string' }));
        assert.throws(() => assertDecode(t.type(ConsolidateAccountRequestBody), { minConfirms: '2' }));
        assert.throws(() => assertDecode(t.type(ConsolidateAccountRequestBody), { preview: 'true' }));
      });
    });

    describe('ConsolidateAccountResponse', function () {
      it('should validate success response', function () {
        const validResponse = {
          success: [{ txid: 'tx123', status: 'signed' }],
          failure: [],
        };

        const decoded = assertDecode(ConsolidateAccountResponse, validResponse);
        assert.ok(Array.isArray(decoded.success));
        assert.ok(Array.isArray(decoded.failure));
        assert.strictEqual(decoded.success.length, 1);
        assert.strictEqual(decoded.failure.length, 0);
      });

      it('should validate partial success response', function () {
        const validResponse = {
          success: [{ txid: 'tx123' }],
          failure: [{ message: 'Error' }],
        };

        const decoded = assertDecode(ConsolidateAccountResponse, validResponse);
        assert.strictEqual(decoded.success.length, 1);
        assert.strictEqual(decoded.failure.length, 1);
      });
    });

    describe('ConsolidateAccountErrorResponse', function () {
      it('should validate error response with all fields', function () {
        const validResponse = {
          success: [],
          failure: [{ message: 'Insufficient funds' }],
          message: 'All transactions failed',
          name: 'ApiResponseError',
          bitgoJsVersion: '38.0.0',
          bitgoExpressVersion: '10.0.0',
        };

        const decoded = assertDecode(ConsolidateAccountErrorResponse, validResponse);
        assert.strictEqual(decoded.message, validResponse.message);
        assert.strictEqual(decoded.name, validResponse.name);
      });
    });

    describe('Route Definition', function () {
      it('should have correct path and method', function () {
        assert.strictEqual(PostConsolidateAccount.path, '/api/v2/{coin}/wallet/{id}/consolidateAccount');
        assert.strictEqual(PostConsolidateAccount.method, 'POST');
      });

      it('should have correct response types', function () {
        assert.ok(PostConsolidateAccount.response[200]);
        assert.ok(PostConsolidateAccount.response[202]);
        assert.ok(PostConsolidateAccount.response[400]);
      });
    });
  });

  describe('Integration Tests', function () {
    const agent = setupAgent();
    const coin = 'algo';
    const walletId = '68c02f96aa757d9212bd1a536f123456';

    const mockSuccessResponse = {
      success: [
        {
          txid: 'consolidation-tx-1',
          hash: 'hash123',
          status: 'signed',
          walletId: walletId,
        },
      ],
      failure: [],
    };

    afterEach(function () {
      sinon.restore();
    });

    describe('Success Cases', function () {
      it('should successfully consolidate account with walletPassphrase', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase_12345',
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        result.body.should.have.property('success');
        result.body.should.have.property('failure');
        assert.ok(Array.isArray(result.body.success));
        assert.strictEqual(result.body.success.length, 1);
        assert.strictEqual(result.body.failure.length, 0);

        sinon.assert.calledOnce(mockWallet.sendAccountConsolidations);
      });

      it('should successfully consolidate with consolidateAddresses', async function () {
        const requestBody = {
          consolidateAddresses: ['ADDR1ABC', 'ADDR2DEF'],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body.success.length, 1);

        const callArgs = mockWallet.sendAccountConsolidations.firstCall.args[0];
        assert.ok(Array.isArray(callArgs.consolidateAddresses));
        assert.strictEqual(callArgs.consolidateAddresses.length, 2);
      });

      it('should successfully consolidate with xprv', async function () {
        const requestBody = {
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body.success.length, 1);
      });

      it('should successfully consolidate with optional parameters', async function () {
        const requestBody = {
          consolidateAddresses: ['ADDR1'],
          walletPassphrase: 'test_passphrase',
          sequenceId: 'seq-123',
          comment: 'Test consolidation',
          minValue: 10000,
          maxValue: 50000,
          nonce: '5',
          preview: false,
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);

        const callArgs = mockWallet.sendAccountConsolidations.firstCall.args[0];
        assert.strictEqual(callArgs.sequenceId, requestBody.sequenceId);
        assert.strictEqual(callArgs.comment, requestBody.comment);
        assert.strictEqual(callArgs.minValue, requestBody.minValue);
        assert.strictEqual(callArgs.nonce, requestBody.nonce);
      });

      it('should handle multiple successful consolidations', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const mockMultipleSuccess = {
          success: [
            { txid: 'tx1', status: 'signed' },
            { txid: 'tx2', status: 'signed' },
            { txid: 'tx3', status: 'signed' },
          ],
          failure: [],
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockMultipleSuccess),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body.success.length, 3);
        assert.strictEqual(result.body.failure.length, 0);
      });
    });

    describe('Partial Success Cases (Status 202)', function () {
      it('should return 202 when some consolidations succeed and some fail', async function () {
        const requestBody = {
          consolidateAddresses: ['ADDR1', 'ADDR2', 'ADDR3'],
          walletPassphrase: 'test_passphrase',
        };

        const mockPartialSuccess = {
          success: [{ txid: 'tx1', status: 'signed' }],
          failure: [{ message: 'Insufficient funds' }, { message: 'Invalid address' }],
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockPartialSuccess),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 202);
        result.body.should.have.property('success');
        result.body.should.have.property('failure');
        result.body.should.have.property('message');
        assert.strictEqual(result.body.success.length, 1);
        assert.strictEqual(result.body.failure.length, 2);
        assert.ok(result.body.message.includes('Transactions failed:'));
        assert.ok(result.body.message.includes('succeeded:'));
      });
    });

    describe('Complete Failure Cases (Status 400)', function () {
      it('should return 400 when all consolidations fail', async function () {
        const requestBody = {
          consolidateAddresses: ['ADDR1', 'ADDR2'],
          walletPassphrase: 'test_passphrase',
        };

        const mockAllFailed = {
          success: [],
          failure: [{ message: 'Insufficient funds' }, { message: 'Invalid address' }],
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockAllFailed),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 400);
        result.body.should.have.property('success');
        result.body.should.have.property('failure');
        result.body.should.have.property('message');
        assert.strictEqual(result.body.success.length, 0);
        assert.strictEqual(result.body.failure.length, 2);
        assert.strictEqual(result.body.message, 'All transactions failed');
      });
    });

    describe('Error Handling Tests', function () {
      it('should reject unsupported coin', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(false),
          supportsTss: sinon.stub().returns(false),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/btc/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
        assert.ok(result.body.error.includes('invalid coin selected'));
      });

      it('should handle wallet not found error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().rejects(new Error('Wallet not found')),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle sendAccountConsolidations failure', async function () {
        const requestBody = {
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 400);
        result.body.should.have.property('error');
      });

      it('should handle insufficient funds error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().rejects(new Error('Insufficient funds')),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 400);
        result.body.should.have.property('error');
      });

      it('should handle invalid request body types', async function () {
        const requestBody = {
          walletPassphrase: 12345, // Number instead of string
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle missing authorization', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });
    });

    describe('TSS Wallet Tests', function () {
      it('should handle TSS wallet consolidation', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
          _wallet: {
            multisigType: 'tss',
            multisigTypeVersion: 'MPCv2',
          },
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(true),
          getMPCAlgorithm: sinon.stub().returns('eddsa'),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.body.success.length, 1);

        sinon.assert.calledOnce(mockWallet.sendAccountConsolidations);
      });
    });

    describe('Coin-Specific Parameter Tests', function () {
      it('should handle Algorand-specific parameters', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          closeRemainderTo: 'CLOSEADDR123',
          nonParticipation: true,
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/algo/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);

        const callArgs = mockWallet.sendAccountConsolidations.firstCall.args[0];
        assert.strictEqual(callArgs.closeRemainderTo, requestBody.closeRemainderTo);
        assert.strictEqual(callArgs.nonParticipation, requestBody.nonParticipation);
      });

      it('should handle Stellar/XRP ledger sequence parameters', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          lastLedgerSequence: 12345678,
          ledgerSequenceDelta: 100,
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/xlm/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);

        const callArgs = mockWallet.sendAccountConsolidations.firstCall.args[0];
        assert.strictEqual(callArgs.lastLedgerSequence, requestBody.lastLedgerSequence);
        assert.strictEqual(callArgs.ledgerSequenceDelta, requestBody.ledgerSequenceDelta);
      });

      it('should handle memo parameter', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          memo: {
            value: 'Consolidation from receive addresses',
            type: 'text',
          },
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/algo/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);

        const callArgs = mockWallet.sendAccountConsolidations.firstCall.args[0];
        assert.ok(callArgs.memo);
        assert.strictEqual(callArgs.memo.value, requestBody.memo.value);
      });
    });

    describe('Edge Cases', function () {
      it('should handle empty consolidateAddresses array', async function () {
        const requestBody = {
          consolidateAddresses: [],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
      });

      it('should handle minValue and maxValue as strings', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          minValue: '10000',
          maxValue: '50000',
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);

        const callArgs = mockWallet.sendAccountConsolidations.firstCall.args[0];
        assert.strictEqual(callArgs.minValue, '10000');
        assert.strictEqual(callArgs.maxValue, '50000');
      });

      it('should handle preview mode', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          preview: true,
        };

        const mockWallet = {
          sendAccountConsolidations: sinon.stub().resolves(mockSuccessResponse),
        };

        const mockCoin = {
          allowsAccountConsolidations: sinon.stub().returns(true),
          supportsTss: sinon.stub().returns(false),
          wallets: sinon.stub().returns({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateAccount`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);

        const callArgs = mockWallet.sendAccountConsolidations.firstCall.args[0];
        assert.strictEqual(callArgs.preview, true);
      });
    });
  });
});
