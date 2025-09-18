import { coins } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { ValidatorTxBuilder } from '../../src/lib/validatorTxBuilder';
import { DelegatorTxBuilder } from '../../src/lib/delegatorTxBuilder';

describe('ValidatorTxBuilder', function () {
  const coinConfig = coins.get('tflrp');
  let builder: ValidatorTxBuilder;

  beforeEach(function () {
    builder = new ValidatorTxBuilder(coinConfig);
  });

  describe('Constructor', function () {
    it('should initialize with coin config', function () {
      assert.ok(builder);
      assert.ok(builder instanceof ValidatorTxBuilder);
      assert.ok(builder instanceof DelegatorTxBuilder);
    });

    it('should have correct transaction type', function () {
      assert.strictEqual(builder['transactionType'], TransactionType.AddValidator);
    });

    it('should initialize with undefined delegation fee rate', function () {
      assert.strictEqual(builder['_delegationFeeRate'], undefined);
    });
  });

  describe('delegationFeeRate', function () {
    it('should set valid delegation fee rate', function () {
      const result = builder.delegationFeeRate(25000); // 2.5%
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_delegationFeeRate'], 25000);
    });

    it('should reject negative delegation fee rate', function () {
      assert.throws(() => {
        builder.delegationFeeRate(-1000);
      }, BuildTransactionError);
    });

    it('should reject delegation fee rate below minimum (2%)', function () {
      assert.throws(() => {
        builder.delegationFeeRate(19999); // Below 2%
      }, BuildTransactionError);
    });

    it('should accept minimum delegation fee rate (2%)', function () {
      assert.doesNotThrow(() => {
        builder.delegationFeeRate(20000); // Exactly 2%
      });
    });

    it('should accept delegation fee rate above minimum', function () {
      assert.doesNotThrow(() => {
        builder.delegationFeeRate(30000); // 3%
      });
    });

    it('should handle maximum possible delegation fee rate', function () {
      assert.doesNotThrow(() => {
        builder.delegationFeeRate(1000000); // 100%
      });
    });

    it('should update delegation fee rate when called multiple times', function () {
      builder.delegationFeeRate(25000);
      assert.strictEqual(builder['_delegationFeeRate'], 25000);

      builder.delegationFeeRate(30000);
      assert.strictEqual(builder['_delegationFeeRate'], 30000);
    });
  });

  describe('Method chaining', function () {
    it('should allow method chaining with delegation fee rate', function () {
      const result = builder
        .delegationFeeRate(25000) // 2.5%
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .endTime(1641081600)
        .stakeAmount('1000000000000000000');

      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_delegationFeeRate'], 25000);
      assert.strictEqual(builder['_nodeID'], 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');
      assert.strictEqual(builder['_startTime'], 1640995200n);
      assert.strictEqual(builder['_endTime'], 1641081600n);
      assert.strictEqual(builder['_stakeAmount'], 1000000000000000000n);
    });

    it('should chain with all delegator methods', function () {
      const result = builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .endTime(1641081600)
        .stakeAmount('1000000000000000000')
        .delegationFeeRate(25000) // 2.5%
        .rewardAddresses(['P-flare1x0r5h0l8w6nj3k2p0d5g9t5b8v3a9k1m']);

      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_delegationFeeRate'], 25000);
    });

    it('should work when delegation fee rate is set first', function () {
      const result = builder
        .delegationFeeRate(30000) // 3%
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');

      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_delegationFeeRate'], 30000);
      assert.strictEqual(builder['_nodeID'], 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');
    });

    it('should work when delegation fee rate is set last', function () {
      const result = builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .delegationFeeRate(25000); // 2.5%

      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_delegationFeeRate'], 25000);
      assert.strictEqual(builder['_nodeID'], 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');
    });
  });

  describe('Inheritance from DelegatorTxBuilder', function () {
    it('should inherit nodeID method', function () {
      const result = builder.nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_nodeID'], 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');
    });

    it('should inherit startTime method', function () {
      const result = builder.startTime(1640995200);
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_startTime'], 1640995200n);
    });

    it('should inherit endTime method', function () {
      const result = builder.endTime(1641081600);
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_endTime'], 1641081600n);
    });

    it('should inherit stakeAmount method', function () {
      const result = builder.stakeAmount('1000000000000000000');
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_stakeAmount'], 1000000000000000000n);
    });

    it('should inherit rewardAddresses method', function () {
      const addresses = ['P-flare1x0r5h0l8w6nj3k2p0d5g9t5b8v3a9k1m'];
      const result = builder.rewardAddresses(addresses);
      assert.strictEqual(result, builder);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.deepStrictEqual((builder as any).transaction._rewardAddresses, addresses);
    });

    it('should inherit validation from delegator methods', function () {
      // Should inherit node ID validation - empty node ID should throw
      assert.throws(() => {
        builder.nodeID('');
      }, BuildTransactionError);

      // Should inherit time validation - negative time should throw
      assert.throws(() => {
        builder.startTime(-1);
      }, BuildTransactionError);

      // Should inherit stake amount validation - negative amount should throw
      assert.throws(() => {
        builder.stakeAmount(-1000);
      }, BuildTransactionError);
    });
  });

  describe('Transaction building validation', function () {
    it('should require delegation fee rate for validation', async function () {
      builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .endTime(1641081600)
        .stakeAmount('1000000000000000000')
        .rewardAddresses(['P-flare1x0r5h0l8w6nj3k2p0d5g9t5b8v3a9k1m']);

      // Validator builder should fail validation without delegation fee rate (0 is invalid)
      await assert.rejects(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (builder as any).buildFlareTransaction();
      }, BuildTransactionError);
    });

    it('should pass validation with delegation fee rate', async function () {
      builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .endTime(1641081600)
        .stakeAmount('1000000000000000000')
        .delegationFeeRate(25000) // 2.5%
        .rewardAddresses(['P-flare1x0r5h0l8w6nj3k2p0d5g9t5b8v3a9k1m']);

      await assert.doesNotReject(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (builder as any).buildFlareTransaction();
      });
    });

    it('should require all delegator fields', async function () {
      builder.delegationFeeRate(25000); // 2.5%

      // Should still fail without other required fields
      await assert.rejects(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (builder as any).buildFlareTransaction();
      }, BuildTransactionError);
    });
  });

  describe('buildFlareTransaction', function () {
    it('should reject building without delegation fee rate', async function () {
      builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .endTime(1641081600)
        .stakeAmount('1000000000000000000')
        .rewardAddresses(['P-flare1x0r5h0l8w6nj3k2p0d5g9t5b8v3a9k1m']);

      await assert.rejects(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (builder as any).buildFlareTransaction();
      }, BuildTransactionError);
    });

    it('should reject building without required delegator fields', async function () {
      builder.delegationFeeRate(25000); // 2.5%

      await assert.rejects(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (builder as any).buildFlareTransaction();
      }, BuildTransactionError);
    });

    it('should build transaction with all required fields', async function () {
      builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .endTime(1641081600)
        .stakeAmount('1000000000000000000')
        .delegationFeeRate(25000) // 2.5%
        .rewardAddresses(['P-flare1x0r5h0l8w6nj3k2p0d5g9t5b8v3a9k1m']);

      await assert.doesNotReject(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (builder as any).buildFlareTransaction();
      });
    });

    it('should inherit time validation from delegator builder', function () {
      // This test verifies that time validation happens immediately when setting values
      assert.throws(() => {
        builder
          .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
          .startTime(1641081600)
          .endTime(1640995200) // End time before start time
          .stakeAmount('1000000000000000000')
          .delegationFeeRate(25000); // 2.5%
      }, BuildTransactionError);
    });
  });

  describe('Edge cases and validation', function () {
    it('should handle minimum delegation fee rate (2%)', function () {
      assert.doesNotThrow(() => {
        builder.delegationFeeRate(20000); // 2%
      });
      assert.strictEqual(builder['_delegationFeeRate'], 20000);
    });

    it('should handle higher delegation fee rates', function () {
      assert.doesNotThrow(() => {
        builder.delegationFeeRate(50000); // 5%
      });
      assert.strictEqual(builder['_delegationFeeRate'], 50000);
    });

    it('should handle fee rate validation edge cases', function () {
      // Just below minimum (2%)
      assert.throws(() => builder.delegationFeeRate(19999), BuildTransactionError);

      // Just at minimum
      assert.doesNotThrow(() => builder.delegationFeeRate(20000));
    });

    it('should maintain validator-specific properties after operations', function () {
      builder.delegationFeeRate(25000); // 2.5%
      builder.nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');

      assert.strictEqual(builder['_delegationFeeRate'], 25000);
      assert.strictEqual(builder['_nodeID'], 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');
    });
  });
});
