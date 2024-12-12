import assert from 'assert';

import {
  ComparableOutput,
  equalOutput,
  outputDifference,
  outputDifferencesWithExpected,
} from '../../../src/transaction/descriptor/outputDifference';

describe('outputDifference', function () {
  function output(script: string, value: bigint | number) {
    const scriptBuffer = Buffer.from(script, 'hex');
    if (scriptBuffer.toString('hex') !== script) {
      throw new Error('invalid script');
    }
    return {
      script: Buffer.from(script, 'hex'),
      value: BigInt(value),
    };
  }

  const a = output('aa', 1);
  const a2 = output('aa', 2);
  const b = output('bb', 2);
  const c = output('cc', 3);

  describe('equalOutput', function () {
    it('has expected result', function () {
      assert.deepStrictEqual(equalOutput(a, a), true);
      assert.deepStrictEqual(equalOutput(a, a2), false);
      assert.deepStrictEqual(equalOutput(a, b), false);
    });
  });

  describe('outputDifference', function () {
    assert.deepStrictEqual(outputDifference([], []), []);
    assert.deepStrictEqual(outputDifference([a], []), [a]);
    assert.deepStrictEqual(outputDifference([], [a]), []);
    assert.deepStrictEqual(outputDifference([a], [a]), []);
    assert.deepStrictEqual(outputDifference([a, a], [a]), [a]);
    assert.deepStrictEqual(outputDifference([a, a, a], [a]), [a, a]);
    assert.deepStrictEqual(outputDifference([a, b, c], [a, b]), [c]);
    assert.deepStrictEqual(outputDifference([a, b, c, a], [a, b]), [c, a]);

    assert.deepStrictEqual(outputDifference([a], [a2]), [a]);
    assert.deepStrictEqual(outputDifference([a2], [a]), [a2]);
  });

  describe('outputDifferencesWithExpected', function () {
    function test(
      outputs: ComparableOutput[],
      recipients: ComparableOutput[],
      expected: {
        missing: ComparableOutput[];
        explicit: ComparableOutput[];
        implicit: ComparableOutput[];
      }
    ) {
      const result = outputDifferencesWithExpected(outputs, recipients);
      assert.deepStrictEqual(result, {
        explicitExternalOutputs: expected.explicit,
        implicitExternalOutputs: expected.implicit,
        missingOutputs: expected.missing,
      });
    }

    test([a], [], { missing: [], explicit: [], implicit: [a] });
    test([], [a], { missing: [a], explicit: [], implicit: [] });
    test([a], [a], { missing: [], explicit: [a], implicit: [] });
    test([a], [a2], { missing: [a2], explicit: [], implicit: [a] });
    test([b], [a], { missing: [a], explicit: [], implicit: [b] });
    test([a, a], [a], { missing: [], explicit: [a], implicit: [a] });
    test([a, b], [a], { missing: [], explicit: [a], implicit: [b] });
  });
});
