import * as assert from 'assert';
import * as t from 'io-ts';
import { PostSweep, SweepRequestParams, SweepRequestBody } from '../../../src/typedRoutes/api/v2/sweep';

/**
 * Helper function to test io-ts codec decoding
 */
export function assertDecode<T>(codec: t.Type<T, unknown>, input: unknown): T {
  const result = codec.decode(input);
  if (result._tag === 'Left') {
    const errors = JSON.stringify(result.left, null, 2);
    assert.fail(`Decode failed with errors:\n${errors}`);
  }
  return result.right;
}

describe('Sweep Typed Route', function () {
  describe('SweepRequestParams', function () {
    it('should validate valid params', function () {
      const validParams = {
        coin: 'btc',
        id: 'wallet123',
      };

      const decoded = assertDecode(t.type(SweepRequestParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: 'wallet123',
      };

      assert.throws(() => {
        assertDecode(t.type(SweepRequestParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'btc',
      };

      assert.throws(() => {
        assertDecode(t.type(SweepRequestParams), invalidParams);
      });
    });
  });

  describe('SweepRequestBody', function () {
    it('should validate body with all fields', function () {
      const validBody = {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        walletPassphrase: 'test-passphrase',
        xprv: 'xprv-key',
        otp: '123456',
        feeRate: 10000,
        maxFeeRate: 50000,
        feeTxConfirmTarget: 2,
        allowPartialSweep: true,
      };

      const decoded = assertDecode(t.partial(SweepRequestBody), validBody);
      assert.strictEqual(decoded.address, validBody.address);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.otp, validBody.otp);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
      assert.strictEqual(decoded.maxFeeRate, validBody.maxFeeRate);
      assert.strictEqual(decoded.feeTxConfirmTarget, validBody.feeTxConfirmTarget);
      assert.strictEqual(decoded.allowPartialSweep, validBody.allowPartialSweep);
    });

    it('should validate empty body since all fields are optional', function () {
      const validBody = {};

      const decoded = assertDecode(t.partial(SweepRequestBody), validBody);
      assert.strictEqual(decoded.address, undefined);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.otp, undefined);
      assert.strictEqual(decoded.feeRate, undefined);
      assert.strictEqual(decoded.maxFeeRate, undefined);
      assert.strictEqual(decoded.feeTxConfirmTarget, undefined);
      assert.strictEqual(decoded.allowPartialSweep, undefined);
    });

    it('should reject body with invalid types', function () {
      const invalidBody = {
        feeRate: 'not-a-number', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.partial(SweepRequestBody), invalidBody);
      });
    });
  });

  describe('PostSweep route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostSweep.path, '/api/v2/{coin}/wallet/{id}/sweep');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostSweep.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      assert.ok(PostSweep.request);
    });

    it('should have the correct response types', function () {
      assert.ok(PostSweep.response[200]);
      assert.ok(PostSweep.response[400]);
      assert.ok(PostSweep.response[404]);
    });
  });
});
