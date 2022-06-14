import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { Etc } from '../../../../src/v2/coins/etc';
import { Tetc } from '../../../../src/v2/coins/tetc';

describe('Ethereum Classic', function () {
  let bitgo;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tetc');
    localBasecoin.should.be.an.instanceof(Tetc);

    localBasecoin = bitgo.coin('etc');
    localBasecoin.should.be.an.instanceof(Etc);
  });
});
