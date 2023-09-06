import { getConventionalFeeForDimensions } from '../src/zcash';
import { Dimensions } from '../src';

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
});
