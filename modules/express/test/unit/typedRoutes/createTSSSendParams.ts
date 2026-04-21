import * as assert from 'assert';
import { CreateTSSSendParamsBody } from '../../../src/typedRoutes/api/common/createTSSSendParams';
import { assertDecode } from './common';
import 'should';

describe('CreateTSSSendParamsBody codec', function () {
  it('should accept an empty body (all fields optional)', function () {
    const decoded = assertDecode(CreateTSSSendParamsBody, {});
    assert.deepStrictEqual(decoded, {});
  });

  it('should preserve unknown fields passed through', function () {
    const body = { walletPassphrase: 'pw', someUnknownField: 'hello' };
    const decoded = assertDecode(CreateTSSSendParamsBody, body) as Record<string, unknown>;
    assert.strictEqual(decoded.walletPassphrase, 'pw');
    assert.strictEqual(decoded.someUnknownField, 'hello');
  });

  describe('walletTxSignTSS-style bodies', function () {
    it('should accept a minimal TSS sign-tx body', function () {
      const body = {
        walletPassphrase: 'pw',
        txRequestId: 'req-123',
        apiVersion: 'full',
      };
      const decoded = assertDecode(CreateTSSSendParamsBody, body);
      assert.strictEqual(decoded.walletPassphrase, 'pw');
      assert.strictEqual(decoded.txRequestId, 'req-123');
      assert.strictEqual(decoded.apiVersion, 'full');
    });

    it('should accept MPCv2 multisigTypeVersion', function () {
      const body = { multisigTypeVersion: 'MPCv2' as const };
      const decoded = assertDecode(CreateTSSSendParamsBody, body);
      assert.strictEqual(decoded.multisigTypeVersion, 'MPCv2');
    });

    it('should reject non-MPCv2 multisigTypeVersion', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { multisigTypeVersion: 'MPCv1' }));
    });

    it('should accept signingStep enum values', function () {
      for (const step of ['signerNonce', 'signerSignature', 'cosignerNonce']) {
        const decoded = assertDecode(CreateTSSSendParamsBody, { signingStep: step });
        assert.strictEqual(decoded.signingStep, step);
      }
    });

    it('should reject an invalid signingStep', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { signingStep: 'notAStep' }));
    });
  });

  describe('consolidateAccount-style bodies', function () {
    it('should accept a minimal consolidation body', function () {
      const body = {
        walletPassphrase: 'pw',
        consolidateAddresses: ['addr1', 'addr2'],
        type: 'consolidate',
      };
      const decoded = assertDecode(CreateTSSSendParamsBody, body);
      assert.deepStrictEqual(decoded.consolidateAddresses, ['addr1', 'addr2']);
      assert.strictEqual(decoded.type, 'consolidate');
    });

    it('should reject consolidateAddresses when not an array', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { consolidateAddresses: 'addr1' }));
    });
  });

  describe('sendMany-style bodies', function () {
    it('should accept a body with recipients', function () {
      const body = {
        walletPassphrase: 'pw',
        recipients: [
          { address: 'addr1', amount: '100' },
          { address: 'addr2', amount: 200 },
        ],
        comment: 'batch payout',
        sequenceId: 'abc-123',
      };
      const decoded = assertDecode(CreateTSSSendParamsBody, body);
      assert.strictEqual(decoded.recipients?.length, 2);
      assert.strictEqual(decoded.recipients?.[0].address, 'addr1');
      assert.strictEqual(decoded.comment, 'batch payout');
    });

    it('should accept numeric sequenceId', function () {
      const decoded = assertDecode(CreateTSSSendParamsBody, { sequenceId: 42 });
      assert.strictEqual(decoded.sequenceId, 42);
    });

    it('should reject a recipient missing address', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { recipients: [{ amount: '100' }] }));
    });

    it('should reject a recipient missing amount', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { recipients: [{ address: 'addr1' }] }));
    });

    it('should accept eip1559 fee params', function () {
      const body = {
        eip1559: { maxFeePerGas: '1000', maxPriorityFeePerGas: '100' },
      };
      const decoded = assertDecode(CreateTSSSendParamsBody, body);
      assert.strictEqual(decoded.eip1559?.maxFeePerGas, '1000');
    });
  });

  describe('sendCoins-style bodies', function () {
    it('should accept a single address/amount body', function () {
      const body = {
        walletPassphrase: 'pw',
        address: 'addr1',
        amount: '12345',
      };
      const decoded = assertDecode(CreateTSSSendParamsBody, body);
      assert.strictEqual(decoded.address, 'addr1');
      assert.strictEqual(decoded.amount, '12345');
    });

    it('should accept a numeric amount', function () {
      const decoded = assertDecode(CreateTSSSendParamsBody, { amount: 12345 });
      assert.strictEqual(decoded.amount, 12345);
    });
  });

  describe('type rejections', function () {
    it('should reject non-string walletPassphrase', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { walletPassphrase: 123 }));
    });

    it('should reject non-boolean isLastSignature', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { isLastSignature: 'true' }));
    });

    it('should reject non-array pubs', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { pubs: 'pub1' }));
    });

    it('should reject invalid txFormat literal', function () {
      assert.throws(() => assertDecode(CreateTSSSendParamsBody, { txFormat: 'segwit' }));
    });
  });
});
