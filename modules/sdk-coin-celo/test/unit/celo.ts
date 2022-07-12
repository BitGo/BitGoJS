import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Celo, Tcelo } from '../../src';

describe('Celo Gold', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tcelo', Tcelo.createInstance);
    bitgo.safeRegister('celo', Celo.createInstance);
    bitgo.initializeTestVars();
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tcelo');
    localBasecoin.should.be.an.instanceof(Tcelo);

    localBasecoin = bitgo.coin('celo');
    localBasecoin.should.be.an.instanceof(Celo);
  });
});
