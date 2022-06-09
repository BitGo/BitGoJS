import { TestBitGo } from '@bitgo/sdk-test';
import { Etc } from '../../../../src/v2/coins/etc';
import { Tetc } from '../../../../src/v2/coins/tetc';

describe('Ethereum Classic', function () {
  let bitgo;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tetc');
    localBasecoin.should.be.an.instanceof(Tetc);

    localBasecoin = bitgo.coin('etc');
    localBasecoin.should.be.an.instanceof(Etc);
  });
});
