import 'should';
import { Dimensions } from '../src';
import { getConventionalFeeForDimensions, getLogicalActions } from '../src/zcash';

describe('ZCash', function () {
  function getDims(nP2shInputs: number, nOutputs: number): Dimensions {
    return new Dimensions()
      .plus(Dimensions.SingleInput.p2sh.times(nP2shInputs))
      .plus(Dimensions.SingleOutput.p2sh.times(nOutputs));
  }

  it('implements ZIP-0317', function () {
    getConventionalFeeForDimensions(getDims(1, 1)).should.equal(10_000);
    getConventionalFeeForDimensions(getDims(1, 2)).should.equal(10_000);
    getConventionalFeeForDimensions(getDims(2, 1)).should.equal(20_000);
    getConventionalFeeForDimensions(getDims(2, 2)).should.equal(20_000);
    getConventionalFeeForDimensions(getDims(10, 1)).should.equal(100_000);
  });

  function getFeeForZatPerKB(d: Dimensions, zatPerKB: number): number {
    return Math.ceil((d.getVSize() * zatPerKB) / 1000);
  }

  function testFeeDifference(
    zatPerKilobyte: number,
    zatPerAction: number,
    expectedDiffs: number[],
    expectedEffectiveFeePerAction?: number[]
  ) {
    it(`difference between feePerByte and feePerAction (zatPerKb=${zatPerKilobyte}, zatPerAction=${zatPerAction})`, function () {
      const dims = [
        getDims(1, 1),
        getDims(2, 1),
        getDims(2, 2),
        getDims(10, 1),
        getDims(10, 10),
        getDims(100, 1),
        getDims(100, 100),
        getDims(1, 100),
        getDims(1, 200),
        getDims(1, 1000),
      ];
      const diffs = dims.map((d) => {
        const feePerSize = getFeeForZatPerKB(d, zatPerKilobyte);
        const feePerAction = getConventionalFeeForDimensions(d, {
          marginalFeeZatPerAction: zatPerAction,
        });
        return feePerSize - feePerAction;
      });

      diffs.should.eql(expectedDiffs);
      if (expectedEffectiveFeePerAction) {
        const effectiveFeePerAction = dims.map((d) =>
          Math.ceil(getFeeForZatPerKB(d, zatPerKilobyte) / getLogicalActions(d))
        );
        effectiveFeePerAction.should.eql(expectedEffectiveFeePerAction);
      }
    });
  }
  // with a feeRate of 40_000 zat/kB, we are underpaying for fanouts larger than 1:100
  testFeeDifference(40_000, 5_000, [3600, 5520, 6800, 20880, 32400, 198680, 325400, -334680, -676680, -3417680]);

  // with a fee of 140_000 zat/kB, we are still not paying for fanouts larger than 1:200
  testFeeDifference(140_000, 5_000, [37600, 69320, 73800, 323080, 363400, 3182880, 3626400, 16120, -5880, -186880]);

  // with a fee of 150_000 zat/kB, we are paying for a 1:200 fanout
  testFeeDifference(
    150_000,
    5_000,
    [41000, 75700, 80500, 353300, 396500, 3481300, 3956500, 51200, 61200, 136200],
    // the effective per-action fee-rate is 25_000 zat/action for smaller transactions and
    // for fanouts we asymptotically approach 5_000 zat/action
    [25500, 23925, 25125, 22665, 24825, 22494, 24882, 5539, 5324, 5145]
  );
});
