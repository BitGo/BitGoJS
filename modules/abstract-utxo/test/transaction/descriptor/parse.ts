import assert from 'assert';

import { mockPsbtDefaultWithDescriptorTemplate } from '../../core/descriptor/psbt/mock.utils';
import { ParsedOutputsBigInt, toBaseParsedTransactionOutputsFromPsbt } from '../../../src/transaction/descriptor/parse';
import { getDefaultXPubs, getDescriptorMap } from '../../core/descriptor/descriptor.utils';
import { toPlainObject } from '../../core/toPlainObject.utils';
import {
  AggregateValidationError,
  assertExpectedOutputDifference,
  ErrorImplicitExternalOutputs,
  ErrorMissingOutputs,
} from '../../../src/transaction/descriptor/verifyTransaction';
import { toAmountType } from '../../../src/transaction/descriptor/parseToAmountType';
import { BaseOutput } from '../../../src';

import { getFixtureRoot } from './fixtures.utils';

const { assertEqualFixture } = getFixtureRoot(__dirname + '/fixtures');

type OutputWithValue<T = number | bigint | string> = {
  address?: string;
  value: T;
};

function toBaseOutput<TNumber>(output: OutputWithValue, amountType: 'bigint' | 'string'): BaseOutput<TNumber> {
  assert(output.address);
  return {
    address: output.address,
    amount: toAmountType(output.value, amountType) as TNumber,
  };
}

function toBaseOutputBigInt(output: OutputWithValue): BaseOutput<bigint> {
  return toBaseOutput(output, 'bigint');
}

function toBaseOutputString(output: OutputWithValue): BaseOutput<string> {
  return toBaseOutput(output, 'string');
}

function toMaxOutput(output: OutputWithValue): OutputWithValue<'max'> {
  return {
    ...output,
    value: 'max',
  };
}

describe('parse', function () {
  const psbt = mockPsbtDefaultWithDescriptorTemplate('Wsh2Of3');

  function getBaseParsedTransaction(recipients: OutputWithValue[]): ParsedOutputsBigInt {
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
      await assertEqualFixture(
        'parseWithExternalRecipient.json',
        toPlainObject(getBaseParsedTransaction([psbt.txOutputs[0]]))
      );
      await assertEqualFixture(
        'parseWithInternalRecipient.json',
        toPlainObject(getBaseParsedTransaction([psbt.txOutputs[1]]))
      );
      await assertEqualFixture(
        'parseWithExternalRecipient.json',
        // max recipient: ignore actual value
        toPlainObject(getBaseParsedTransaction([toMaxOutput(psbt.txOutputs[0])]))
      );
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

      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction([toMaxOutput(psbt.txOutputs[1])])),
        new AggregateValidationError([
          new ErrorMissingOutputs([{ ...toBaseOutputBigInt(toMaxOutput(psbt.txOutputs[1])), external: true }]),
          new ErrorImplicitExternalOutputs([{ ...toBaseOutputBigInt(psbt.txOutputs[0]), external: true }]),
        ])
      );
    });
  });
});
