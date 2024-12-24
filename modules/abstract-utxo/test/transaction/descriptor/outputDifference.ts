import assert from 'assert';

import {
  ActualOutput,
  ExpectedOutput,
  matchingOutput,
  outputDifference,
  outputDifferencesWithExpected,
} from '../../../src/transaction/outputDifference';

describe('outputDifference', function () {
  function output(script: string, value: bigint | number): ActualOutput;
  function output(script: string, value: 'max'): ExpectedOutput;
  function output(script: string, value: bigint | number | 'max'): ActualOutput | ExpectedOutput {
    const scriptBuffer = Buffer.from(script, 'hex');
    if (scriptBuffer.toString('hex') !== script) {
      throw new Error('invalid script');
    }
    return {
      script: Buffer.from(script, 'hex'),
      value: value === 'max' ? 'max' : BigInt(value),
    };
  }

  const a = output('aa', 1);
  const a2 = output('aa', 2);
  const aMax = output('aa', 'max');
  const b = output('bb', 1);
  const c = output('cc', 1);

  describe('equalOutput', function () {
    it('has expected result', function () {
      assert.deepStrictEqual(matchingOutput(a, a), true);
      assert.deepStrictEqual(matchingOutput(a, a2), false);
      assert.deepStrictEqual(matchingOutput(a, b), false);
      assert.deepStrictEqual(matchingOutput(aMax, b), false);

      assert.deepStrictEqual(matchingOutput(aMax, a), true);
      assert.deepStrictEqual(matchingOutput(a, aMax), true);
      // this one does not appear in practice but is a valid comparison
      assert.deepStrictEqual(matchingOutput(aMax, aMax), true);
    });
  });

  describe('outputDifference', function () {
    it('has expected result', function () {
      assert.deepStrictEqual(outputDifference([], []), []);
      assert.deepStrictEqual(outputDifference([a], []), [a]);
      assert.deepStrictEqual(outputDifference([aMax], []), [aMax]);
      assert.deepStrictEqual(outputDifference([], [a]), []);
      assert.deepStrictEqual(outputDifference([], [aMax]), []);
      assert.deepStrictEqual(outputDifference([a], [a]), []);
      assert.deepStrictEqual(outputDifference([a], [aMax]), []);
      assert.deepStrictEqual(outputDifference([aMax], [a]), []);
      assert.deepStrictEqual(outputDifference([a, a], [a]), [a]);
      assert.deepStrictEqual(outputDifference([a, a], [aMax]), [a]);
      assert.deepStrictEqual(outputDifference([a, a, a], [a]), [a, a]);
      assert.deepStrictEqual(outputDifference([a, b, c], [a, b]), [c]);
      assert.deepStrictEqual(outputDifference([a, b, c], [aMax, b]), [c]);
      assert.deepStrictEqual(outputDifference([a, b, c, a], [a, b]), [c, a]);

      assert.deepStrictEqual(outputDifference([a], [a2]), [a]);
      assert.deepStrictEqual(outputDifference([a2], [a]), [a2]);
    });
  });

  describe('outputDifferencesWithExpected', function () {
    function test(
      outputs: ActualOutput[],
      recipients: ExpectedOutput[],
      expected: {
        missing: ExpectedOutput[];
        explicit: ActualOutput[];
        implicit: ActualOutput[];
      }
    ) {
      const result = outputDifferencesWithExpected(outputs, recipients);
      assert.deepStrictEqual(result, {
        explicitExternalOutputs: expected.explicit,
        implicitExternalOutputs: expected.implicit,
        missingOutputs: expected.missing,
      });
    }

    it('has expected result', function () {
      test([a], [], { missing: [], explicit: [], implicit: [a] });
      test([], [a], { missing: [a], explicit: [], implicit: [] });
      test([a], [a], { missing: [], explicit: [a], implicit: [] });
      test([a], [a2], { missing: [a2], explicit: [], implicit: [a] });
      test([b], [a], { missing: [a], explicit: [], implicit: [b] });
      test([a, a], [a], { missing: [], explicit: [a], implicit: [a] });
      test([a, b], [a], { missing: [], explicit: [a], implicit: [b] });
    });
  });
});
