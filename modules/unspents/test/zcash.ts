import 'should';
import { Dimensions } from '../src';
import { getConventionalFeeForDimensions } from '../src/zcash';

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

  function testFeeDifference(zatPerKilobyte: number, zatPerAction: number, signum: -1 | 0 | 1) {
    const signumStr = signum < 0 ? 'negative' : 0 < signum ? 'positive' : 'mixed';
    it(`difference between feePerByte and feePerAction is ${signumStr} (zatPerKb=${zatPerKilobyte})`, function () {
      [
        getDims(1, 1),
        getDims(1, 2),
        getDims(2, 1),
        getDims(2, 2),
        getDims(10, 1),
        getDims(10, 10),
        getDims(100, 100),
      ].forEach((d) => {
        const feePerSize = getFeeForZatPerKB(d, zatPerKilobyte);
        const feePerAction = getConventionalFeeForDimensions(d, {
          marginalFeeZatPerAction: zatPerAction,
        });
        if (signum === 1) {
          feePerSize.should.be.greaterThan(feePerAction);
        } else if (signum === -1) {
          feePerSize.should.be.lessThan(feePerAction);
        }
      });
    });
  }
  testFeeDifference(20_000, 5_000, -1);
  testFeeDifference(30_000, 5_000, 0);
  testFeeDifference(40_000, 5_000, 1);
});
