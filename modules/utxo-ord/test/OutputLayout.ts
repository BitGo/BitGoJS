import * as assert from 'assert';

import { SatRange, Constraint, findOutputLayout, SearchParams, OutputLayout, getOrdOutputsForLayout } from '../src';

import { output, range } from './util';

describe('Ordinal Transaction Layout', function () {
  const params: SearchParams = {
    minChangeOutput: BigInt(10),
    maxChangeOutput: Constraint.MAXSAT,
    minInscriptionOutput: BigInt(10),
    maxInscriptionOutput: BigInt(20),
    feeFixed: BigInt(10),
    feePerOutput: BigInt(5),
  };

  describe('findOrdOutputs', function () {
    function testNoPadding(r: SatRange, expectedResult: OutputLayout | undefined) {
      it(`finds solution for simple inscription input without padding (SatRange=${r})`, function () {
        assert.deepStrictEqual(findOutputLayout(output(30, r), params), expectedResult);
      });
    }

    for (let i = 0; i < 30; i++) {
      testNoPadding(
        range(i),
        /*
          If the input inscription is within maxInscriptionOutput and leaves enough room for fees,
          we can find a result.
         */
        i < 15
          ? {
              firstChangeOutput: BigInt(0),
              inscriptionOutput: BigInt(15),
              secondChangeOutput: BigInt(0),
              feeOutput: BigInt(15),
            }
          : undefined
      );
    }

    function testEndPadding(r: SatRange, expectedResult: OutputLayout | undefined) {
      it(`finds solution for simple inscription input with end padding (SatRange=${r})`, function () {
        const result = findOutputLayout(output(1000, r), params);
        assert.deepStrictEqual(result, expectedResult);
      });
    }

    for (let i = 0; i < 30; i++) {
      testEndPadding(
        range(i),
        /* if the inscription is within maxInscriptionOutput there will always be solution */
        i < 20
          ? {
              firstChangeOutput: BigInt(0),
              /* if the inscription is below minInscriptionOutput we prefer that branch */
              inscriptionOutput: i < 10 ? BigInt(10) : BigInt(20),
              secondChangeOutput: i < 10 ? BigInt(970) : BigInt(960),
              feeOutput: BigInt(20),
            }
          : undefined
      );
    }
  });

  describe('getOutputsForResult', function () {
    it('maps input to outputs', function () {
      assert.deepStrictEqual(
        getOrdOutputsForLayout(output(1000, range(10)), {
          firstChangeOutput: BigInt(0),
          inscriptionOutput: BigInt(20),
          secondChangeOutput: BigInt(960),
          feeOutput: BigInt(20),
        }),
        {
          firstChangeOutput: null,
          inscriptionOutput: output(20, range(10)),
          secondChangeOutput: output(960),
          feeOutput: output(20),
        }
      );
    });
  });
});
