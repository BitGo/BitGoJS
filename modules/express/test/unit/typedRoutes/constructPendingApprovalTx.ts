import * as assert from 'assert';
import * as t from 'io-ts';
import {
  ConstructPendingApprovalTxRequestParams,
  ConstructPendingApprovalTxRequestBody,
  ConstructPendingApprovalTxResponse,
  PutConstructPendingApprovalTx,
} from '../../../src/typedRoutes/api/v1/constructPendingApprovalTx';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('ConstructPendingApprovalTx codec tests', function () {
  describe('ConstructPendingApprovalTxRequestParams', function () {
    it('should validate params with required id', function () {
      const validParams = {
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestParams), validParams);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing id', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(ConstructPendingApprovalTxRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        id: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConstructPendingApprovalTxRequestParams), invalidParams);
      });
    });
  });

  describe('ConstructPendingApprovalTxRequestBody', function () {
    it('should validate empty body', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.useOriginalFee, undefined);
      assert.strictEqual(decoded.fee, undefined);
      assert.strictEqual(decoded.feeRate, undefined);
      assert.strictEqual(decoded.feeTxConfirmTarget, undefined);
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with xprv', function () {
      const validBody = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), validBody);
      assert.strictEqual(decoded.xprv, validBody.xprv);
    });

    it('should validate body with useOriginalFee', function () {
      const validBody = {
        useOriginalFee: true,
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), validBody);
      assert.strictEqual(decoded.useOriginalFee, validBody.useOriginalFee);
    });

    it('should validate body with fee', function () {
      const validBody = {
        fee: 10000,
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), validBody);
      assert.strictEqual(decoded.fee, validBody.fee);
    });

    it('should validate body with feeRate', function () {
      const validBody = {
        feeRate: 20000,
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), validBody);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
    });

    it('should validate body with feeTxConfirmTarget', function () {
      const validBody = {
        feeTxConfirmTarget: 2,
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), validBody);
      assert.strictEqual(decoded.feeTxConfirmTarget, validBody.feeTxConfirmTarget);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        useOriginalFee: true,
        fee: 10000,
        feeRate: 20000,
        feeTxConfirmTarget: 2,
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.useOriginalFee, validBody.useOriginalFee);
      assert.strictEqual(decoded.fee, validBody.fee);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
      assert.strictEqual(decoded.feeTxConfirmTarget, validBody.feeTxConfirmTarget);
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConstructPendingApprovalTxRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConstructPendingApprovalTxRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean useOriginalFee', function () {
      const invalidBody = {
        useOriginalFee: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(ConstructPendingApprovalTxRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number fee', function () {
      const invalidBody = {
        fee: '10000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConstructPendingApprovalTxRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number feeRate', function () {
      const invalidBody = {
        feeRate: '20000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConstructPendingApprovalTxRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number feeTxConfirmTarget', function () {
      const invalidBody = {
        feeTxConfirmTarget: '2', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConstructPendingApprovalTxRequestBody), invalidBody);
      });
    });
  });

  describe('ConstructPendingApprovalTxResponse', function () {
    it('should validate response with only required tx field', function () {
      const validResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      const decoded = assertDecode(ConstructPendingApprovalTxResponse, validResponse);
      assert.strictEqual(decoded.tx, validResponse.tx);
      assert.strictEqual(decoded.fee, undefined);
      assert.strictEqual(decoded.feeRate, undefined);
      assert.strictEqual(decoded.instant, undefined);
      assert.strictEqual(decoded.bitgoFee, undefined);
      assert.strictEqual(decoded.travelInfos, undefined);
      assert.strictEqual(decoded.estimatedSize, undefined);
      assert.strictEqual(decoded.unspents, undefined);
    });

    it('should validate response with all fields', function () {
      const validResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        fee: 10000,
        feeRate: 20000,
        instant: false,
        bitgoFee: { amount: 5000, address: '1BitGo...' },
        travelInfos: [{ fromAddress: '1From...', toAddress: '1To...', amount: 1000000 }],
        estimatedSize: 256,
        unspents: [{ id: 'unspent1', value: 1000000 }],
      };

      const decoded = assertDecode(ConstructPendingApprovalTxResponse, validResponse);
      assert.strictEqual(decoded.tx, validResponse.tx);
      assert.strictEqual(decoded.fee, validResponse.fee);
      assert.strictEqual(decoded.feeRate, validResponse.feeRate);
      assert.strictEqual(decoded.instant, validResponse.instant);
      assert.deepStrictEqual(decoded.bitgoFee, validResponse.bitgoFee);
      assert.deepStrictEqual(decoded.travelInfos, validResponse.travelInfos);
      assert.strictEqual(decoded.estimatedSize, validResponse.estimatedSize);
      assert.deepStrictEqual(decoded.unspents, validResponse.unspents);
    });

    it('should reject response with missing tx', function () {
      const invalidResponse = {
        fee: 10000,
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });

    it('should reject response with non-string tx', function () {
      const invalidResponse = {
        tx: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });

    it('should reject response with non-number fee (optional field, but must be number if provided)', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        fee: '10000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });

    it('should reject response with non-number feeRate (optional field, but must be number if provided)', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        feeRate: '20000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });

    it('should reject response with non-boolean instant (optional field, but must be boolean if provided)', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        instant: 'false', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });

    it('should reject response with non-number estimatedSize (optional field, but must be number if provided)', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        estimatedSize: '256', // string instead of number
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });
  });

  describe('PutConstructPendingApprovalTx route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PutConstructPendingApprovalTx.path, '/api/v1/pendingapprovals/{id}/constructTx');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PutConstructPendingApprovalTx.method, 'PUT');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PutConstructPendingApprovalTx.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PutConstructPendingApprovalTx.response[200]);
      assert.ok(PutConstructPendingApprovalTx.response[400]);
    });
  });

  describe('Edge cases', function () {
    it('should handle empty strings for string fields', function () {
      const body = {
        walletPassphrase: '',
        xprv: '',
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), body);
      assert.strictEqual(decoded.walletPassphrase, '');
      assert.strictEqual(decoded.xprv, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        walletPassphrase: 'mySecurePassphrase',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(ConstructPendingApprovalTxRequestBody)), body);
      assert.strictEqual(decoded.walletPassphrase, body.walletPassphrase);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });

    it('should handle zero values for numeric fields', function () {
      const body = {
        fee: 0,
        feeRate: 0,
        feeTxConfirmTarget: 0,
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), body);
      assert.strictEqual(decoded.fee, 0);
      assert.strictEqual(decoded.feeRate, 0);
      assert.strictEqual(decoded.feeTxConfirmTarget, 0);
    });

    it('should handle negative values for numeric fields', function () {
      const body = {
        fee: -100,
        feeRate: -200,
        feeTxConfirmTarget: -1,
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), body);
      assert.strictEqual(decoded.fee, -100);
      assert.strictEqual(decoded.feeRate, -200);
      assert.strictEqual(decoded.feeTxConfirmTarget, -1);
    });

    it('should handle very large numeric values', function () {
      const body = {
        fee: Number.MAX_SAFE_INTEGER,
        feeRate: Number.MAX_SAFE_INTEGER,
        feeTxConfirmTarget: 1000000,
      };

      const decoded = assertDecode(t.type(ConstructPendingApprovalTxRequestBody), body);
      assert.strictEqual(decoded.fee, Number.MAX_SAFE_INTEGER);
      assert.strictEqual(decoded.feeRate, Number.MAX_SAFE_INTEGER);
      assert.strictEqual(decoded.feeTxConfirmTarget, 1000000);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockConstructedTx = {
      tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      fee: 10000,
      feeRate: 20000,
      instant: false,
      estimatedSize: 256,
      unspents: [{ id: 'unspent1', value: 1000000 }],
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully construct a pending approval transaction with walletPassphrase', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(mockConstructedTx),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');
      result.body.should.have.property('fee');
      result.body.should.have.property('feeRate');
      assert.strictEqual(result.body.tx, mockConstructedTx.tx);
      assert.strictEqual(result.body.fee, mockConstructedTx.fee);
      assert.strictEqual(result.body.feeRate, mockConstructedTx.feeRate);

      // Verify response can be decoded
      const decodedResponse = assertDecode(ConstructPendingApprovalTxResponse, result.body);
      assert.strictEqual(decodedResponse.tx, mockConstructedTx.tx);
      assert.strictEqual(decodedResponse.fee, mockConstructedTx.fee);
      assert.strictEqual(decodedResponse.feeRate, mockConstructedTx.feeRate);

      assert.strictEqual(mockPendingApprovals.get.calledOnceWith({ id: 'test-approval-id-123' }), true);
      assert.strictEqual(mockPendingApproval.constructApprovalTx.calledOnceWith(requestBody), true);
    });

    it('should successfully construct a pending approval transaction with xprv', async function () {
      const requestBody = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(mockConstructedTx),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');
      assert.strictEqual(result.body.tx, mockConstructedTx.tx);

      const decodedResponse = assertDecode(ConstructPendingApprovalTxResponse, result.body);
      assert.strictEqual(decodedResponse.tx, mockConstructedTx.tx);
    });

    it('should successfully construct a pending approval transaction with useOriginalFee', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
        useOriginalFee: true,
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(mockConstructedTx),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');

      const decodedResponse = assertDecode(ConstructPendingApprovalTxResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should successfully construct a pending approval transaction with custom fee', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
        fee: 15000,
      };

      const mockResponse = {
        ...mockConstructedTx,
        fee: 15000,
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(mockResponse),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.fee, 15000);

      const decodedResponse = assertDecode(ConstructPendingApprovalTxResponse, result.body);
      assert.strictEqual(decodedResponse.fee, 15000);
    });

    it('should successfully construct a pending approval transaction with minimal response (only tx)', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const minimalMockResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(minimalMockResponse),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');
      assert.strictEqual(result.body.tx, minimalMockResponse.tx);

      const decodedResponse = assertDecode(ConstructPendingApprovalTxResponse, result.body);
      assert.strictEqual(decodedResponse.tx, minimalMockResponse.tx);
      assert.strictEqual(decodedResponse.fee, undefined);
      assert.strictEqual(decodedResponse.feeRate, undefined);
      assert.strictEqual(decodedResponse.instant, undefined);
      assert.strictEqual(decodedResponse.bitgoFee, undefined);
      assert.strictEqual(decodedResponse.travelInfos, undefined);
      assert.strictEqual(decodedResponse.estimatedSize, undefined);
      assert.strictEqual(decodedResponse.unspents, undefined);
    });

    it('should successfully construct a pending approval transaction with all optional response fields', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const fullMockResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        fee: 10000,
        feeRate: 20000,
        instant: true,
        bitgoFee: { amount: 5000, address: '1BitGoAddress123' },
        travelInfos: [{ fromAddress: '1From123', toAddress: '1To456', amount: 1000000 }],
        estimatedSize: 256,
        unspents: [
          { id: 'unspent1', value: 500000 },
          { id: 'unspent2', value: 500000 },
        ],
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(fullMockResponse),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('tx');
      result.body.should.have.property('fee');
      result.body.should.have.property('feeRate');
      result.body.should.have.property('instant');
      result.body.should.have.property('bitgoFee');
      result.body.should.have.property('travelInfos');
      result.body.should.have.property('estimatedSize');
      result.body.should.have.property('unspents');

      const decodedResponse = assertDecode(ConstructPendingApprovalTxResponse, result.body);
      assert.strictEqual(decodedResponse.tx, fullMockResponse.tx);
      assert.strictEqual(decodedResponse.fee, fullMockResponse.fee);
      assert.strictEqual(decodedResponse.feeRate, fullMockResponse.feeRate);
      assert.strictEqual(decodedResponse.instant, fullMockResponse.instant);
      assert.deepStrictEqual(decodedResponse.bitgoFee, fullMockResponse.bitgoFee);
      assert.deepStrictEqual(decodedResponse.travelInfos, fullMockResponse.travelInfos);
      assert.strictEqual(decodedResponse.estimatedSize, fullMockResponse.estimatedSize);
      assert.deepStrictEqual(decodedResponse.unspents, fullMockResponse.unspents);
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

    it('should handle constructApprovalTx() failure', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().rejects(new Error('Failed to construct transaction')),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle pending approval not found error', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const mockPendingApprovals = {
        get: sinon.stub().rejects(new Error('Pending approval not found')),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/non-existent-id/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle missing walletPassphrase and xprv for transactionRequest', async function () {
      const requestBody = {};

      const mockPendingApproval = {
        constructApprovalTx: sinon
          .stub()
          .rejects(new Error('wallet passphrase or xprv required to approve a transactionRequest')),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid walletPassphrase error', async function () {
      const requestBody = {
        walletPassphrase: 'wrongPassphrase',
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().rejects(new Error('Invalid wallet passphrase')),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle useOriginalFee conflict with fee parameter', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
        useOriginalFee: true,
        fee: 10000,
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon
          .stub()
          .rejects(new Error('cannot specify a fee/feerate/feeTxConfirmTarget as well as useOriginalFee')),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle SDK returning null or undefined', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(null),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with null, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, result.body);
      });
    });

    it('should reject request with invalid body type for walletPassphrase', async function () {
      const requestBody = {
        walletPassphrase: 123, // number instead of string
      };

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should reject request with invalid body type for useOriginalFee', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
        useOriginalFee: 'true', // string instead of boolean
      };

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should reject request with invalid body type for fee', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
        fee: '10000', // string instead of number
      };

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });
  });

  // ==========================================
  // RESPONSE VALIDATION EDGE CASES
  // ==========================================

  describe('Response Validation Edge Cases', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should reject response with missing tx field', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const invalidResponse = {
        fee: 10000,
        feeRate: 20000,
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(invalidResponse),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, result.body);
      });
    });

    it('should reject response with wrong type for tx', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const invalidResponse = {
        tx: 123, // number instead of string
        fee: 10000,
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(invalidResponse),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, result.body);
      });
    });

    it('should reject response with wrong type for fee (optional but must be number if provided)', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        fee: '10000', // string instead of number
      };

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(invalidResponse),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, result.body);
      });
    });

    it('should reject response with empty object', async function () {
      const requestBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const invalidResponse = {};

      const mockPendingApproval = {
        constructApprovalTx: sinon.stub().resolves(invalidResponse),
      };

      const mockPendingApprovals = {
        get: sinon.stub().resolves(mockPendingApproval),
      };

      sinon.stub(BitGo.prototype, 'pendingApprovals').returns(mockPendingApprovals as any);

      const result = await agent
        .put('/api/v1/pendingapprovals/test-approval-id-123/constructTx')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, result.body);
      });
    });
  });
});
