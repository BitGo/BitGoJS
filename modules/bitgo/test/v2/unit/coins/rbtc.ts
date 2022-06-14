import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { Rbtc, Trbtc } from '../../../../src/v2/coins';

describe('RSK Smart Bitcoin', function () {
  let bitgo;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('trbtc');
    localBasecoin.should.be.an.instanceof(Trbtc);

    localBasecoin = bitgo.coin('rbtc');
    localBasecoin.should.be.an.instanceof(Rbtc);
  });
});
