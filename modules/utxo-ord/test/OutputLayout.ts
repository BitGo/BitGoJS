import * as assert from 'assert';

import { SatRange, findOutputLayout, OutputLayout, getOrdOutputsForLayout, toParameters, toArray } from '../src';

import { output, range } from './util';

function layout(
  firstChangeOutput: number | bigint,
  inscriptionOutput: number | bigint,
  secondChangeOutput: number | bigint,
  feeOutput: number | bigint
) {
  return toParameters(
    BigInt(firstChangeOutput),
    BigInt(inscriptionOutput),
    BigInt(secondChangeOutput),
    BigInt(feeOutput)
  );
}

describe('Ordinal Transaction Layout', function () {
  const constraints = {
    minChangeOutput: BigInt(10),
    minInscriptionOutput: BigInt(10),
    maxInscriptionOutput: BigInt(20),
    feeFixed: BigInt(10),
    feePerOutput: BigInt(5),
  };

  describe('findOrdOutputs', function () {
    function testNoPadding(r: SatRange, expectedResult: OutputLayout | undefined) {
      it(`has expectedResult for simple inscription input without padding (SatRange=${r} expectedResult=${expectedResult})`, function () {
        assert.deepStrictEqual(findOutputLayout(output(30, r), constraints), expectedResult);
      });
    }

    for (let i = 0; i < 30; i++) {
      testNoPadding(
        range(i),
        /*
          If the input inscription is within maxInscriptionOutput and leaves enough room for fees,
          we can find a result.
         */

        /* inscriptionOutput has always 10 sats */
        i < 15 ? layout(0, 15, 0, 15) : /* If there is no room for fees we do not have a result */ undefined
      );
    }

    function testEndPadding(r: SatRange, expectedResult: OutputLayout | undefined) {
      it(`has expectedResult for inscription input with end padding (SatRange=${r}, expectedResult=${
        expectedResult ? toArray(expectedResult) : undefined
      })`, function () {
        const result = findOutputLayout(output(1000, r), constraints);
        assert.deepStrictEqual(result, expectedResult);
      });
    }

    function values(r: SatRange): number[] {
      return Array.from({ length: Number(r.size()) }).map((_, i) => i + Number(r.start));
    }

    [...values(range(0, 30)), ...values(range(500, 530)), ...values(range(950, 999))].forEach((i) => {
      let expectedResult;
      if (i < 10) {
        // inscriptions at the very start of the range are put into inscriptionOutput with a minimal size
        expectedResult = layout(0, 10, 1000 - 10 - 20, 20);
      } else if (i < 20) {
        // the inscription output grows as needed
        expectedResult = layout(0, i + 1, 1000 - (i + 1) - 20, 20);
      } else if (i <= 955) {
        // if the inscription is outside the maxInscription size, we insert a leading change output that ends just before
        // the inscription and a second change output to pad the nd
        expectedResult = layout(i, 10, 1000 - i - 10 - 25, 25);
      } else if (i <= 960) {
        // If the inscription is close to the end of the input, we omit the secondChangeOutput and
        // grow the inscriptionOutput instead. If it is maxed out, we grow the feeOutput.
        expectedResult = layout(i, 20, 0, 1000 - 20 - i);
      } else if (i <= 970) {
        expectedResult = layout(i, 1000 - 20 - i, 0, 20);
      } else if (970 < i) {
        // if the inscription is at the very far end, we cannot construct a layout
        expectedResult = undefined;
      } else {
        throw new Error(`i=${i}`);
      }
      testEndPadding(range(i), expectedResult);
    });
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
