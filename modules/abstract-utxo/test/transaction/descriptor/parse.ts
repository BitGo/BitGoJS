import assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import { mockPsbtDefaultWithDescriptorTemplate } from '../../core/descriptor/psbt/mock.utils';
import { ParsedOutputsBigInt, toBaseParsedTransactionOutputsFromPsbt } from '../../../src/transaction/descriptor/parse';
import { getDefaultXPubs, getDescriptorMap } from '../../core/descriptor/descriptor.utils';
import { assertEqualFixture } from './fixtures.utils';
import { toPlainObject } from '../../core/toPlainObject.utils';
import {
  AggregateValidationError,
  assertExpectedOutputDifference,
  ErrorImplicitExternalOutputs,
  ErrorMissingOutputs,
} from '../../../src/transaction/descriptor/verifyTransaction';
import { toAmountType } from '../../../src/transaction/descriptor/parseToAmountType';
import { BaseOutput } from '../../../src';

function toBaseOutput<TNumber>(output: utxolib.PsbtTxOutput, amountType: 'bigint' | 'string'): BaseOutput<TNumber> {
  assert(output.address);
  return {
    address: output.address,
    amount: toAmountType(output.value, amountType) as TNumber,
  };
}

function toBaseOutputBigInt(output: utxolib.PsbtTxOutput): BaseOutput<bigint> {
  return toBaseOutput(output, 'bigint');
}

function toBaseOutputString(output: utxolib.PsbtTxOutput): BaseOutput<string> {
  return toBaseOutput(output, 'string');
}

describe('parse', function () {
  const psbt = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');

  function getBaseParsedTransaction(recipients: utxolib.PsbtTxOutput[]): ParsedOutputsBigInt {
    return toBaseParsedTransactionOutputsFromPsbt(
      psbt,
      getDescriptorMap('Wsh2Of3', getDefaultXPubs('a')),
      recipients.map(toBaseOutputString),
      psbt.network
    );
  }

  describe('toBase', function () {
    it('should return the correct BaseParsedTransactionOutputs', async function () {
      await assertEqualFixture('parseWithoutRecipients.json', toPlainObject(getBaseParsedTransaction([])));
      await assertEqualFixture('parseWithRecipient.json', toPlainObject(getBaseParsedTransaction([psbt.txOutputs[0]])));
    });

    function assertEqualValidationError(actual: unknown, expected: AggregateValidationError) {
      if (actual instanceof AggregateValidationError) {
        assert.deepStrictEqual(actual.errors, expected.errors);
      } else {
        throw new Error('unexpected error type');
      }
    }

    function assertValidationError(f: () => void, expected: AggregateValidationError) {
      assert.throws(f, (err) => {
        assertEqualValidationError(err, expected);
        return true;
      });
    }

    it('should throw expected errors', function () {
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction([])),
        new AggregateValidationError([
          new ErrorImplicitExternalOutputs([{ ...toBaseOutputBigInt(psbt.txOutputs[0]), external: true }]),
        ])
      );

      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction([])),
        new AggregateValidationError([
          new ErrorImplicitExternalOutputs([{ ...toBaseOutputBigInt(psbt.txOutputs[0]), external: true }]),
        ])
      );

      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction([psbt.txOutputs[1]])),
        new AggregateValidationError([
          new ErrorMissingOutputs([{ ...toBaseOutputBigInt(psbt.txOutputs[1]), external: true }]),
          new ErrorImplicitExternalOutputs([{ ...toBaseOutputBigInt(psbt.txOutputs[0]), external: true }]),
        ])
      );
    });
  });
});
