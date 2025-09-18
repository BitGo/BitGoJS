import { coins } from '@bitgo/statics';
import { BuildTransactionError } from '@bitgo/sdk-core';
import * as assert from 'assert';
import { TransactionBuilder } from '../../src/lib/transactionBuilder';

describe('TransactionBuilder', function () {
  const coinConfig = coins.get('tflrp');

  // We can't directly instantiate abstract TransactionBuilder,
  // so we test through concrete implementations or static methods
  describe('Class availability', function () {
    it('should be available as a constructor', function () {
      assert.ok(TransactionBuilder);
      assert.ok(typeof TransactionBuilder === 'function');
    });
  });

  describe('Validation methods', function () {
    it('should have validateAmount method', function () {
      // Test through a concrete implementation (we'll use DelegatorTxBuilder)
      const { DelegatorTxBuilder } = require('../../src/lib/delegatorTxBuilder');
      const builder = new DelegatorTxBuilder(coinConfig);

      // Valid amount
      assert.doesNotThrow(() => {
        // Access protected method
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (builder as any).validateAmount(1000000000000000000n);
      });

      // Invalid amount (negative)
      assert.throws(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (builder as any).validateAmount(-1000n);
      }, BuildTransactionError);

      // Invalid amount (zero)
      assert.throws(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (builder as any).validateAmount(0n);
      }, BuildTransactionError);
    });

    it('should validate node IDs through delegator builder', function () {
      const { DelegatorTxBuilder } = require('../../src/lib/delegatorTxBuilder');
      const builder = new DelegatorTxBuilder(coinConfig);

      // Valid node ID
      assert.doesNotThrow(() => {
        builder.nodeID('NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg');
      });

      // Invalid node ID (empty)
      assert.throws(() => {
        builder.nodeID('');
      }, BuildTransactionError);
    });

    it('should validate time values through delegator builder', function () {
      const { DelegatorTxBuilder } = require('../../src/lib/delegatorTxBuilder');
      const builder = new DelegatorTxBuilder(coinConfig);

      // Valid start time
      assert.doesNotThrow(() => {
        builder.startTime(1640995200);
      });

      // Invalid start time (negative)
      assert.throws(() => {
        builder.startTime(-1);
      }, BuildTransactionError);
    });
  });

  describe('Network and Blockchain validation', function () {
    it('should validate through initBuilder method', function () {
      const { DelegatorTxBuilder } = require('../../src/lib/delegatorTxBuilder');
      const builder = new DelegatorTxBuilder(coinConfig);

      // Test with valid transaction data (should not throw)
      const validTx = {
        nodeID: 'NodeID-7Xhw2mDxuDS44j42TCB6U5579esbSt3Lg',
        startTime: 1640995200,
        endTime: 1641081600,
        stakeAmount: '1000000000000000000',
      };

      assert.doesNotThrow(() => {
        builder.initBuilder(validTx);
      });
    });
  });
});
