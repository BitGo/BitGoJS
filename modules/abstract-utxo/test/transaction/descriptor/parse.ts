import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { mockPsbtDefault } from '../../core/descriptor/psbt/mock.utils';
import { ParsedOutputsBigInt, toBaseParsedTransactionOutputsFromPsbt } from '../../../src/transaction/descriptor/parse';
import { getDefaultXPubs, getDescriptor, getDescriptorMap } from '../../core/descriptor/descriptor.utils';
import { toPlainObject } from '../../core/toPlainObject.utils';
import {
  AggregateValidationError,
  assertExpectedOutputDifference,
  ErrorImplicitExternalOutputs,
  ErrorMissingOutputs,
} from '../../../src/transaction/descriptor/verifyTransaction';
import { toAmountType } from '../../../src/transaction/descriptor/parseToAmountType';
import { BaseOutput } from '../../../src';
import { createAddressFromDescriptor } from '../../../src/core/descriptor';

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
  const descriptorSelf = getDescriptor('Wsh2Of3', getDefaultXPubs('a'));
  const descriptorOther = getDescriptor('Wsh2Of3', getDefaultXPubs('b'));
  const psbt = mockPsbtDefault({ descriptorSelf, descriptorOther });

  function recipient(descriptor: Descriptor, index: number, value = 1000) {
    return { value, address: createAddressFromDescriptor(descriptor, index, utxolib.networks.bitcoin) };
  }

  function internalRecipient(index: number, value?: number): OutputWithValue {
    return recipient(descriptorSelf, index, value);
  }

  function externalRecipient(index: number, value?: number): OutputWithValue {
    return recipient(descriptorOther, index, value);
  }

  function getBaseParsedTransaction(psbt: utxolib.bitgo.UtxoPsbt, recipients: OutputWithValue[]): ParsedOutputsBigInt {
    return toBaseParsedTransactionOutputsFromPsbt(
      psbt,
      getDescriptorMap('Wsh2Of3', getDefaultXPubs('a')),
      recipients.map(toBaseOutputString),
      psbt.network
    );
  }

  describe('toBase', function () {
    it('should return the correct BaseParsedTransactionOutputs', async function () {
      await assertEqualFixture('parseWithoutRecipients.json', toPlainObject(getBaseParsedTransaction(psbt, [])));
      await assertEqualFixture(
        'parseWithExternalRecipient.json',
        toPlainObject(getBaseParsedTransaction(psbt, [psbt.txOutputs[0]]))
      );
      await assertEqualFixture(
        'parseWithInternalRecipient.json',
        toPlainObject(getBaseParsedTransaction(psbt, [psbt.txOutputs[1]]))
      );
      await assertEqualFixture(
        'parseWithExternalRecipient.json',
        // max recipient: ignore actual value
        toPlainObject(getBaseParsedTransaction(psbt, [toMaxOutput(psbt.txOutputs[0])]))
      );
    });

    function assertEqualValidationError(actual: unknown, expected: AggregateValidationError) {
      function normErrors(e: Error[]): Error[] {
        return e.map((e) => ({ ...e, stack: undefined }));
      }
      if (actual instanceof AggregateValidationError) {
        assert.deepStrictEqual(normErrors(actual.errors), normErrors(expected.errors));
      } else {
        throw new Error('unexpected error type: ' + actual);
      }
    }

    function assertValidationError(f: () => void, expected: AggregateValidationError) {
      assert.throws(f, (err) => {
        assertEqualValidationError(err, expected);
        return true;
      });
    }

    function implicitOutputError(output: OutputWithValue, { external = true } = {}): ErrorImplicitExternalOutputs {
      return new ErrorImplicitExternalOutputs([{ ...toBaseOutputBigInt(output), external }]);
    }

    function missingOutputError(output: OutputWithValue, { external = true } = {}): ErrorMissingOutputs {
      return new ErrorMissingOutputs([{ ...toBaseOutputBigInt(output), external }]);
    }

    it('should throw expected error: no recipient requested', function () {
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [])),
        new AggregateValidationError([implicitOutputError(psbt.txOutputs[0])])
      );
    });

    it('should throw expected error: only internal recipient requested', function () {
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [psbt.txOutputs[1]])),
        new AggregateValidationError([implicitOutputError(psbt.txOutputs[0])])
      );
    });

    it('should throw expected error: only internal max recipient requested', function () {
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [toMaxOutput(psbt.txOutputs[1])])),
        new AggregateValidationError([implicitOutputError(psbt.txOutputs[0])])
      );
    });

    it('should throw expected error: swapped recipient', function () {
      const recipient = externalRecipient(99);
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [recipient])),
        new AggregateValidationError([missingOutputError(recipient), implicitOutputError(psbt.txOutputs[0])])
      );
    });

    it('should throw expected error: missing internal recipient', function () {
      const recipient = internalRecipient(99);
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [recipient])),
        new AggregateValidationError([missingOutputError(recipient), implicitOutputError(psbt.txOutputs[0])])
      );
    });
  });
});
