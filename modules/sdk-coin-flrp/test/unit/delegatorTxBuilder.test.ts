import { coins } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { DelegatorTxBuilder } from '../../src/lib/delegatorTxBuilder';

describe('DelegatorTxBuilder', function () {
  const coinConfig = coins.get('tflrp');
  let builder: DelegatorTxBuilder;

  beforeEach(function () {
    builder = new DelegatorTxBuilder(coinConfig);
  });

  describe('Constructor', function () {
    it('should initialize with coin config', function () {
      assert.ok(builder);
      assert.ok(builder instanceof DelegatorTxBuilder);
    });

    it('should initialize with default values', function () {
      assert.strictEqual(builder['_nodeID'], '');
      assert.strictEqual(builder['_startTime'], 0n);
      assert.strictEqual(builder['_endTime'], 0n);
      assert.strictEqual(builder['_stakeAmount'], 0n);
    });

    it('should set transaction type to AddDelegator', function () {
      assert.strictEqual(builder['transactionType'], TransactionType.AddDelegator);
    });
  });

  describe('nodeID', function () {
    it('should set node ID correctly', function () {
      const nodeID = 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg';
      const result = builder.nodeID(nodeID);
      assert.strictEqual(builder['_nodeID'], nodeID);
      assert.strictEqual(result, builder);
    });

    it('should throw error for empty node ID', function () {
      assert.throws(() => builder.nodeID(''), BuildTransactionError);
    });
  });

  describe('startTime', function () {
    it('should set start time from number', function () {
      const time = 1640995200;
      const result = builder.startTime(time);
      assert.strictEqual(builder['_startTime'], BigInt(time));
      assert.strictEqual(result, builder);
    });

    it('should set start time from string', function () {
      const time = '1640995200';
      const result = builder.startTime(time);
      assert.strictEqual(builder['_startTime'], BigInt(time));
      assert.strictEqual(result, builder);
    });

    it('should set start time from bigint', function () {
      const time = 1640995200n;
      const result = builder.startTime(time);
      assert.strictEqual(builder['_startTime'], time);
      assert.strictEqual(result, builder);
    });

    it('should throw error for zero start time', function () {
      assert.throws(() => builder.startTime(0), BuildTransactionError);
    });

    it('should throw error for negative start time', function () {
      assert.throws(() => builder.startTime(-1), BuildTransactionError);
    });

    it('should throw error when start time is after end time', function () {
      builder.endTime(1640995200); // Set end time first
      assert.throws(() => builder.startTime(1672531200), BuildTransactionError); // Start time after end time
    });

    it('should allow start time before end time', function () {
      builder.endTime(1672531200); // Set end time first
      const result = builder.startTime(1640995200); // Start time before end time
      assert.strictEqual(result, builder);
    });
  });

  describe('endTime', function () {
    it('should set end time from number', function () {
      const time = 1672531200;
      const result = builder.endTime(time);
      assert.strictEqual(builder['_endTime'], BigInt(time));
      assert.strictEqual(result, builder);
    });

    it('should set end time from string', function () {
      const time = '1672531200';
      const result = builder.endTime(time);
      assert.strictEqual(builder['_endTime'], BigInt(time));
      assert.strictEqual(result, builder);
    });

    it('should set end time from bigint', function () {
      const time = 1672531200n;
      const result = builder.endTime(time);
      assert.strictEqual(builder['_endTime'], time);
      assert.strictEqual(result, builder);
    });

    it('should throw error for zero end time', function () {
      assert.throws(() => builder.endTime(0), BuildTransactionError);
    });

    it('should throw error for negative end time', function () {
      assert.throws(() => builder.endTime(-1), BuildTransactionError);
    });

    it('should throw error when end time is before start time', function () {
      builder.startTime(1672531200); // Set start time first
      assert.throws(() => builder.endTime(1640995200), BuildTransactionError); // End time before start time
    });

    it('should allow end time after start time', function () {
      builder.startTime(1640995200); // Set start time first
      const result = builder.endTime(1672531200); // End time after start time
      assert.strictEqual(result, builder);
    });
  });

  describe('stakeAmount', function () {
    it('should set stake amount from number', function () {
      const amount = 50000000000000000000n;
      const result = builder.stakeAmount(amount);
      assert.strictEqual(builder['_stakeAmount'], amount);
      assert.strictEqual(result, builder);
    });

    it('should set stake amount from string', function () {
      const amount = '50000000000000000000';
      const result = builder.stakeAmount(amount);
      assert.strictEqual(builder['_stakeAmount'], BigInt(amount));
      assert.strictEqual(result, builder);
    });

    it('should throw error for zero stake amount', function () {
      assert.throws(() => builder.stakeAmount(0), BuildTransactionError);
    });

    it('should throw error for negative stake amount', function () {
      assert.throws(() => builder.stakeAmount(-1), BuildTransactionError);
    });
  });

  describe('rewardAddresses', function () {
    it('should set reward addresses correctly', function () {
      const addresses = ['P-flare1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpk7kph'];
      const result = builder.rewardAddresses(addresses);
      assert.strictEqual(result, builder);
    });

    it('should throw error for empty addresses array', function () {
      assert.throws(() => builder.rewardAddresses([]), BuildTransactionError);
    });
  });

  describe('verifyTxType', function () {
    it('should return true for valid delegator transaction', function () {
      const tx = {
        nodeID: 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg',
        stakeAmount: '50000000000000000000',
      };
      assert.strictEqual(DelegatorTxBuilder.verifyTxType(tx), true);
      assert.strictEqual(builder.verifyTxType(tx), true);
    });

    it('should return false for invalid transaction', function () {
      const tx = { stakeAmount: '50000000000000000000' };
      assert.strictEqual(DelegatorTxBuilder.verifyTxType(tx), false);
    });

    it('should return false for empty transaction', function () {
      assert.strictEqual(DelegatorTxBuilder.verifyTxType({}), false);
    });
  });

  describe('buildFlareTransaction', function () {
    beforeEach(function () {
      builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .endTime(1672531200)
        .stakeAmount(50000000000000000000n)
        .rewardAddresses(['P-flare1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpk7kph']);
    });

    it('should throw error if nodeID is missing', async function () {
      builder['_nodeID'] = '';
      await assert.rejects(builder['buildFlareTransaction'](), BuildTransactionError);
    });

    it('should throw error if startTime is missing', async function () {
      builder['_startTime'] = 0n;
      await assert.rejects(builder['buildFlareTransaction'](), BuildTransactionError);
    });

    it('should throw error if endTime is missing', async function () {
      builder['_endTime'] = 0n;
      await assert.rejects(builder['buildFlareTransaction'](), BuildTransactionError);
    });

    it('should throw error if stakeAmount is missing', async function () {
      builder['_stakeAmount'] = 0n;
      await assert.rejects(builder['buildFlareTransaction'](), BuildTransactionError);
    });

    it('should throw error if end time is before start time', function () {
      // This test verifies that time validation happens immediately when setting values
      assert.throws(() => {
        builder.startTime(1672531200).endTime(1640995200);
      }, BuildTransactionError);
    });
  });

  describe('method chaining', function () {
    it('should support method chaining', function () {
      const result = builder
        .nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg')
        .startTime(1640995200)
        .endTime(1672531200)
        .stakeAmount(50000000000000000000n)
        .rewardAddresses(['P-flare1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpk7kph']);

      assert.strictEqual(result, builder);
    });
  });
});
