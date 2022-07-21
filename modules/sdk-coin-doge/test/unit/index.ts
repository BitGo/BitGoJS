import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Doge, Tdoge } from '../../src';

describe('Doge', function () {
  const coinName = 'tdoge';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('doge', Doge.createInstance);
    bitgo.safeRegister('tdoge', Tdoge.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tdoge');
    localBasecoin.should.be.an.instanceof(Tdoge);

    localBasecoin = bitgo.coin('doge');
    localBasecoin.should.be.an.instanceof(Doge);
  });

  it('should return tdoge', function () {
    basecoin.getChain().should.equal('tdoge');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Dogecoin');
  });
});
