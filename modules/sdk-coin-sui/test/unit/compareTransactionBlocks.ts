import assert from 'assert';
import { assertEqualTransactionBlocks } from '../../src/lib/compareTransactionBlocks';
import { UnstakingBuilder } from '../../src';
import * as testData from '../resources/sui';
import { SuiObjectRef } from '../../src/lib/mystenlab/types';

describe('compareTransactionBlocks', function () {
  function runTest(tag: string, objRef: SuiObjectRef, amount: bigint, expectedError: string | null) {
    it(`compares two transaction blocks: ${tag}`, function () {
      const f = () => {
        assertEqualTransactionBlocks(
          UnstakingBuilder.getTransactionBlockData(testData.requestWithdrawStakedSui.stakedSui, BigInt(100)),
          UnstakingBuilder.getTransactionBlockData(objRef, amount)
        );
      };

      if (expectedError === null) {
        f();
      } else {
        assert.throws(f, new RegExp(expectedError));
      }
    });
  }

  runTest('equal', testData.requestWithdrawStakedSui.stakedSui, BigInt(100), null);
  runTest('different amount', testData.requestWithdrawStakedSui.stakedSui, BigInt(101), 'Different inputs');
  runTest(
    'different objRef',
    {
      ...testData.requestWithdrawStakedSui.stakedSui,
      objectId: '0x' + Buffer.alloc(32, 0xff).toString('hex'),
    },
    BigInt(101),
    'Different inputs'
  );
});
