import assert from 'assert';

import { Descriptor, Psbt, descriptorWallet } from '@bitgo/wasm-utxo';
import * as testutils from '@bitgo/wasm-utxo/testutils';

import {
  ParsedOutputsBigInt,
  toBaseParsedTransactionOutputsFromPsbt,
} from '../../../../src/transaction/descriptor/parse';
import {
  AggregateValidationError,
  assertExpectedOutputDifference,
  ErrorImplicitExternalOutputs,
  ErrorMissingOutputs,
} from '../../../../src/transaction/descriptor/verifyTransaction';
import { toAmountType } from '../../../../src/transaction/descriptor/parseToAmountType';
import { BaseOutput } from '../../../../src/transaction/types';

import { getFixtureRoot } from './fixtures.utils';

const { getDefaultXPubs, getDescriptor, getDescriptorMap, mockPsbtDefault } = testutils.descriptor;
const { toPlainObject } = testutils;
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
    return { value, address: descriptorWallet.createAddressFromDescriptor(descriptor, index, 'btc') };
  }

  function internalRecipient(index: number, value?: number): OutputWithValue {
    return recipient(descriptorSelf, index, value);
  }

  function externalRecipient(index: number, value?: number): OutputWithValue {
    return recipient(descriptorOther, index, value);
  }

  function getBaseParsedTransaction(psbt: Psbt, recipients: OutputWithValue[]): ParsedOutputsBigInt {
    return toBaseParsedTransactionOutputsFromPsbt(
      psbt,
      getDescriptorMap('Wsh2Of3', getDefaultXPubs('a')),
      recipients.map(toBaseOutputString),
      'btc'
    );
  }

  const psbtOutputs = psbt.getOutputsWithAddress('btc');
  const psbtOutput0 = psbtOutputs[0];
  const psbtOutput1 = psbtOutputs[1];

  describe('toBase', function () {
    it('should return the correct BaseParsedTransactionOutputs', async function () {
      await assertEqualFixture('parseWithoutRecipients.json', toPlainObject(getBaseParsedTransaction(psbt, [])));
      await assertEqualFixture(
        'parseWithExternalRecipient.json',
        toPlainObject(getBaseParsedTransaction(psbt, [psbtOutput0]))
      );
      await assertEqualFixture(
        'parseWithInternalRecipient.json',
        toPlainObject(getBaseParsedTransaction(psbt, [psbtOutput1]))
      );
      await assertEqualFixture(
        'parseWithExternalRecipient.json',
        // max recipient: ignore actual value
        toPlainObject(getBaseParsedTransaction(psbt, [toMaxOutput(psbtOutput0)]))
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
        new AggregateValidationError([implicitOutputError(psbtOutput0)])
      );
    });

    it('should throw expected error: only internal recipient requested', function () {
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [psbtOutput1])),
        new AggregateValidationError([implicitOutputError(psbtOutput0)])
      );
    });

    it('should throw expected error: only internal max recipient requested', function () {
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [toMaxOutput(psbtOutput1)])),
        new AggregateValidationError([implicitOutputError(psbtOutput0)])
      );
    });

    it('should throw expected error: swapped recipient', function () {
      const recipient = externalRecipient(99);
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [recipient])),
        new AggregateValidationError([missingOutputError(recipient), implicitOutputError(psbtOutput0)])
      );
    });

    it('should throw expected error: missing internal recipient', function () {
      const recipient = internalRecipient(99);
      assertValidationError(
        () => assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [recipient])),
        new AggregateValidationError([missingOutputError(recipient), implicitOutputError(psbtOutput0)])
      );
    });

    describe('self-payment (recipient address is a wallet address)', function () {
      it('should pass when both the external output and the self-payment are specified as recipients', function () {
        // psbtOutput1 goes to descriptorSelf (own wallet) — this is a self-payment
        // Both outputs are requested, so there are no missing or implicit external outputs
        assert.doesNotThrow(() =>
          assertExpectedOutputDifference(getBaseParsedTransaction(psbt, [psbtOutput0, psbtOutput1]))
        );
      });

      it('should not report the self-payment as missing even though it is classified as an internal (change) output', function () {
        // psbtOutput1 goes to descriptorSelf (own wallet) and is marked as internal/change by the
        // descriptor wallet parser. Specifying it as a recipient should still find it in the PSBT
        // outputs (two-pass approach: all outputs are checked, not just external ones).
        const result = getBaseParsedTransaction(psbt, [psbtOutput0, psbtOutput1]);
        assert.strictEqual(result.missingOutputs.length, 0);
        assert.strictEqual(result.implicitExternalOutputs.length, 0);
      });

      it('should not report an unspecified internal output as an implicit external output', function () {
        // psbtOutput1 goes to descriptorSelf (own wallet). When NOT specified as a recipient,
        // it should NOT appear in implicitExternalOutputs because it is an internal/change output.
        // Only psbtOutput0 (external) is requested, so psbtOutput1 is just unreported change.
        const result = getBaseParsedTransaction(psbt, [psbtOutput0]);
        assert.strictEqual(result.missingOutputs.length, 0);
        assert.strictEqual(result.implicitExternalOutputs.length, 0);
      });
    });
  });
});
