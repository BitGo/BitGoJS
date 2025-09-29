import * as assert from 'assert';
import * as t from 'io-ts';
import {
  ConstructPendingApprovalTxRequestParams,
  ConstructPendingApprovalTxRequestBody,
  ConstructPendingApprovalTxResponse,
  PutConstructPendingApprovalTx,
} from '../../../src/typedRoutes/api/v1/constructPendingApprovalTx';
import { assertDecode } from './common';

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
    it('should validate response with required tx field', function () {
      const validResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      const decoded = assertDecode(ConstructPendingApprovalTxResponse, validResponse);
      assert.strictEqual(decoded.tx, validResponse.tx);
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

    it('should reject response with non-number fee', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        fee: '10000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });

    it('should reject response with non-number feeRate', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        feeRate: '20000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });

    it('should reject response with non-boolean instant', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        instant: 'false', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(ConstructPendingApprovalTxResponse, invalidResponse);
      });
    });
    it('should reject response with non-number estimatedSize', function () {
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
      assert.strictEqual(PutConstructPendingApprovalTx.path, '/api/v1/pendingapprovals/:id/constructTx');
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
});
