import { TestBitGo } from '../../../lib/test_bitgo';
import { Polygon } from '../../../../src/v2/coins/polygon';
import { Tpolygon } from '../../../../src/v2/coins/tpolygon';

describe('Polygon', function () {
  let bitgo;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tpolygon');
    localBasecoin.should.be.an.instanceof(Tpolygon);

    localBasecoin = bitgo.coin('polygon');
    localBasecoin.should.be.an.instanceof(Polygon);
  });
});
