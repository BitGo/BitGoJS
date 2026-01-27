import assert from 'assert';

import {
  ActualOutput,
  ExpectedOutput,
  getMissingOutputs,
  matchingOutput,
  outputDifference,
  outputDifferencesWithExpected,
} from '../../../src/transaction/outputDifference';

describe('outputDifference', function () {
  function output(script: string, value: bigint | number, optional?: boolean): ActualOutput;
  function output(script: string, value: 'max', optional?: boolean): ExpectedOutput;
  function output(script: string, value: bigint | number | 'max', optional?: boolean): ActualOutput | ExpectedOutput {
    const scriptBuffer = Buffer.from(script, 'hex');
    if (scriptBuffer.toString('hex') !== script) {
      throw new Error('invalid script');
    }
    return {
      script: Buffer.from(script, 'hex'),
      value: value === 'max' ? 'max' : BigInt(value),
      ...(optional !== undefined ? { optional } : {}),
    };
  }

  function expectedOutput(script: string, value: bigint | number | 'max', optional?: boolean): ExpectedOutput {
    return output(script, value as 'max', optional) as ExpectedOutput;
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

  describe('getMissingOutputs', function () {
    it('returns missing non-optional outputs', function () {
      const aOptional = expectedOutput('aa', 1, true);
      const bOptional = expectedOutput('bb', 1, true);

      // No expected outputs means no missing outputs
      assert.deepStrictEqual(getMissingOutputs([a], []), []);

      // Missing required output is returned
      assert.deepStrictEqual(getMissingOutputs([], [a]), [a]);
      assert.deepStrictEqual(getMissingOutputs([b], [a]), [a]);

      // Missing optional output is filtered out
      assert.deepStrictEqual(getMissingOutputs([], [aOptional]), []);
      assert.deepStrictEqual(getMissingOutputs([b], [aOptional]), []);

      // Mix of optional and required: only required missing outputs returned
      assert.deepStrictEqual(getMissingOutputs([], [a, bOptional]), [a]);
      assert.deepStrictEqual(getMissingOutputs([], [aOptional, b]), [b]);

      // Present outputs are not returned regardless of optional flag
      assert.deepStrictEqual(getMissingOutputs([a], [a]), []);
      assert.deepStrictEqual(getMissingOutputs([a], [aOptional]), []);
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
        explicitOutputs: expected.explicit,
        implicitOutputs: expected.implicit,
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

    it('handles optional expected outputs', function () {
      const aOptional = expectedOutput('aa', 1, true);
      const bOptional = expectedOutput('bb', 1, true);

      // Missing optional output is not reported as missing
      test([], [aOptional], { missing: [], explicit: [], implicit: [] });
      test([b], [aOptional], { missing: [], explicit: [], implicit: [b] });

      // Present optional output is still explicit
      test([a], [aOptional], { missing: [], explicit: [a], implicit: [] });

      // Mix of required and optional outputs
      test([], [a, bOptional], { missing: [a], explicit: [], implicit: [] });
      test([a], [a, bOptional], { missing: [], explicit: [a], implicit: [] });
      test([a, b], [a, bOptional], { missing: [], explicit: [a, b], implicit: [] });

      // Multiple optional outputs
      test([], [aOptional, bOptional], { missing: [], explicit: [], implicit: [] });
      test([a], [aOptional, bOptional], { missing: [], explicit: [a], implicit: [] });
      test([a, b], [aOptional, bOptional], { missing: [], explicit: [a, b], implicit: [] });
    });
  });
});
