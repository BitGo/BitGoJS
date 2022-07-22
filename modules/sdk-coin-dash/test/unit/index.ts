import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Dash, Tdash } from '../../src';

describe('Dash', function () {
  const coinName = 'tdash';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('dash', Dash.createInstance);
    bitgo.safeRegister('tdash', Tdash.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tdash');
    localBasecoin.should.be.an.instanceof(Tdash);

    localBasecoin = bitgo.coin('dash');
    localBasecoin.should.be.an.instanceof(Dash);
  });

  it('should return tdash', function () {
    basecoin.getChain().should.equal('tdash');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Dash');
  });
});
