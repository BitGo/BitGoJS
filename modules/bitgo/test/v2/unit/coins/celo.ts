import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { Tcelo } from '../../../../src/v2/coins/tcelo';
import { Celo } from '../../../../src/v2/coins/celo';

describe('Celo Gold', function () {
  let bitgo;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tcelo');
    localBasecoin.should.be.an.instanceof(Tcelo);

    localBasecoin = bitgo.coin('celo');
    localBasecoin.should.be.an.instanceof(Celo);
  });
});
