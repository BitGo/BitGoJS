import { TestBitGo } from '@bitgo/sdk-test';
import { Tcelo } from '../../../../src/v2/coins/tcelo';
import { Celo } from '../../../../src/v2/coins/celo';

describe('Celo Gold', function () {
  let bitgo;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('celo', Celo.createInstance);
    bitgo.safeRegister('Tcelo', Tcelo.createInstance);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tcelo');
    localBasecoin.should.be.an.instanceof(Tcelo);

    localBasecoin = bitgo.coin('celo');
    localBasecoin.should.be.an.instanceof(Celo);
  });
});
