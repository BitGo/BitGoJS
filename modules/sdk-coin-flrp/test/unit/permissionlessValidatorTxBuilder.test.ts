import { coins } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { PermissionlessValidatorTxBuilder } from '../../src/lib/permissionlessValidatorTxBuilder';

describe('PermissionlessValidatorTxBuilder', function () {
  const coinConfig = coins.get('tflrp');
  let builder: PermissionlessValidatorTxBuilder;

  beforeEach(function () {
    builder = new PermissionlessValidatorTxBuilder(coinConfig);
  });

  describe('Constructor', function () {
    it('should create a permissionless validator transaction builder', function () {
      assert.ok(builder);
      assert.ok(builder instanceof PermissionlessValidatorTxBuilder);
    });

    it('should set transaction type to AddPermissionlessValidator', function () {
      assert.strictEqual(builder['transactionType'], TransactionType.AddPermissionlessValidator);
    });

    it('should initialize with default values', function () {
      assert.strictEqual(builder['_nodeID'], undefined);
      assert.strictEqual(builder['_blsPublicKey'], undefined);
      assert.strictEqual(builder['_blsSignature'], undefined);
      assert.strictEqual(builder['_startTime'], undefined);
      assert.strictEqual(builder['_endTime'], undefined);
      assert.strictEqual(builder['_stakeAmount'], undefined);
      assert.strictEqual(builder['recoverSigner'], undefined); // AtomicTransactionBuilder doesn't inherit this
      assert.strictEqual(builder['_delegationFeeRate'], undefined);
    });
  });

  describe('nodeID management', function () {
    it('should set valid node ID', function () {
      const nodeID = 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg';
      const result = builder.nodeID(nodeID);
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_nodeID'], nodeID);
    });

    it('should reject empty node ID', function () {
      assert.throws(() => {
        builder.nodeID('');
      }, BuildTransactionError);
    });
  });

  describe('BLS key management', function () {
    it('should set valid BLS public key', function () {
      const blsKey = '0x' + 'a'.repeat(96); // 48 bytes = 96 hex chars
      const result = builder.blsPublicKey(blsKey);
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_blsPublicKey'], blsKey);
    });

    it('should reject invalid BLS public key', function () {
      assert.throws(() => {
        builder.blsPublicKey('invalid-key');
      }, BuildTransactionError);
    });

    it('should set valid BLS signature', function () {
      const blsSignature = '0x' + 'b'.repeat(192); // 96 bytes = 192 hex chars
      const result = builder.blsSignature(blsSignature);
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_blsSignature'], blsSignature);
    });

    it('should reject invalid BLS signature', function () {
      assert.throws(() => {
        builder.blsSignature('invalid-signature');
      }, BuildTransactionError);
    });
  });

  describe('time management', function () {
    describe('startTime', function () {
      it('should set valid start time with bigint', function () {
        const time = 1640995200n;
        const result = builder.startTime(time);
        assert.strictEqual(result, builder);
        assert.strictEqual(builder['_startTime'], time);
      });

      it('should set valid start time with number', function () {
        const time = 1640995200;
        const result = builder.startTime(time);
        assert.strictEqual(result, builder);
        assert.strictEqual(builder['_startTime'], BigInt(time));
      });

      it('should reject negative start time', function () {
        assert.throws(() => {
          builder.startTime(-1n);
        }, BuildTransactionError);
      });
    });

    describe('endTime', function () {
      it('should set valid end time with bigint', function () {
        const time = 1641081600n;
        const result = builder.endTime(time);
        assert.strictEqual(result, builder);
        assert.strictEqual(builder['_endTime'], time);
      });

      it('should set valid end time with number', function () {
        const time = 1641081600;
        const result = builder.endTime(time);
        assert.strictEqual(result, builder);
        assert.strictEqual(builder['_endTime'], BigInt(time));
      });

      it('should reject negative end time', function () {
        assert.throws(() => {
          builder.endTime(-1n);
        }, BuildTransactionError);
      });
    });
  });

  describe('stake amount management', function () {
    it('should set valid stake amount with bigint', function () {
      const amount = 1000000000000000000n;
      const result = builder.stakeAmount(amount);
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_stakeAmount'], amount);
    });

    it('should set valid stake amount with number', function () {
      const amount = 1000000;
      const result = builder.stakeAmount(amount);
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_stakeAmount'], BigInt(amount));
    });

    it('should reject negative stake amount', function () {
      assert.throws(() => {
        builder.stakeAmount(-1n);
      }, BuildTransactionError);
    });
  });

  describe('delegation fee rate management', function () {
    it('should set valid delegation fee rate', function () {
      const feeRate = 25000; // 2.5% in basis points
      const result = builder.delegationFeeRate(feeRate);
      assert.strictEqual(result, builder);
      assert.strictEqual(builder['_delegationFeeRate'], feeRate);
    });

    it('should reject delegation fee rate below minimum', function () {
      // Test with a value below the expected minimum
      assert.throws(() => {
        builder.delegationFeeRate(10000); // 1% - should be too low
      }, BuildTransactionError);
    });
  });

  describe('validation through methods', function () {
    it('should validate through constructor and methods', function () {
      // Test that the builder accepts valid values
      assert.doesNotThrow(() => {
        builder
          .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
          .startTime(1640995200n)
          .endTime(1641081600n)
          .stakeAmount(1000000000000000000n)
          .delegationFeeRate(25000);
      });
    });

    it('should reject invalid values through methods', function () {
      // Test that invalid values are rejected
      assert.throws(() => {
        builder.nodeID('');
      }, BuildTransactionError);

      assert.throws(() => {
        builder.startTime(-1n);
      }, BuildTransactionError);

      assert.throws(() => {
        builder.endTime(-1n);
      }, BuildTransactionError);

      assert.throws(() => {
        builder.stakeAmount(-1n);
      }, BuildTransactionError);
    });
  });

  describe('Method chaining', function () {
    it('should support full method chaining', function () {
      const blsKey = '0x' + 'a'.repeat(96);
      const blsSignature = '0x' + 'b'.repeat(192);

      const result = builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .blsPublicKey(blsKey)
        .blsSignature(blsSignature)
        .startTime(1640995200n)
        .endTime(1641081600n)
        .stakeAmount(1000000000000000000n)
        .delegationFeeRate(25000);

      assert.strictEqual(result, builder);
    });

    it('should support chaining in different order', function () {
      const blsKey = '0x' + 'a'.repeat(96);
      const blsSignature = '0x' + 'b'.repeat(192);

      const result = builder
        .delegationFeeRate(30000)
        .stakeAmount(2000000000000000000n)
        .endTime(1641081600n)
        .startTime(1640995200n)
        .blsSignature(blsSignature)
        .blsPublicKey(blsKey)
        .nodeID('NodeID-8Yhx3nExvDS55k53UDC7V6680ftdSu4Mh');

      assert.strictEqual(result, builder);
    });
  });

  describe('Edge cases and validation', function () {
    it('should handle minimum valid values', function () {
      const blsKey = '0x' + 'a'.repeat(96);
      const blsSignature = '0x' + 'b'.repeat(192);
      const minFee = 20000; // Default minimum delegation fee

      assert.doesNotThrow(() => {
        builder
          .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
          .blsPublicKey(blsKey)
          .blsSignature(blsSignature)
          .startTime(0n)
          .endTime(1n)
          .stakeAmount(1n)
          .delegationFeeRate(minFee);
      });
    });

    it('should maintain state correctly after multiple operations', function () {
      const nodeID1 = 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg';
      const nodeID2 = 'NodeID-8Yhx3nExvDS55k53UDC7V6680ftdSu4Mh';

      builder.nodeID(nodeID1);
      assert.strictEqual(builder['_nodeID'], nodeID1);

      builder.nodeID(nodeID2);
      assert.strictEqual(builder['_nodeID'], nodeID2);
    });

    it('should handle BLS key format validation edge cases', function () {
      // Too short
      assert.throws(() => {
        builder.blsPublicKey('0x' + 'a'.repeat(95));
      }, BuildTransactionError);

      // Too long
      assert.throws(() => {
        builder.blsPublicKey('0x' + 'a'.repeat(97));
      }, BuildTransactionError);

      // No 0x prefix
      assert.throws(() => {
        builder.blsPublicKey('a'.repeat(96));
      }, BuildTransactionError);
    });
  });
});
