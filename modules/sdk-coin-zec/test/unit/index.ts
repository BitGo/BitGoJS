import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Zec, Tzec } from '../../src';

describe('Zec', function () {
  const coinName = 'tzec';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('zec', Zec.createInstance);
    bitgo.safeRegister('tzec', Tzec.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tzec');
    localBasecoin.should.be.an.instanceof(Tzec);

    localBasecoin = bitgo.coin('zec');
    localBasecoin.should.be.an.instanceof(Zec);
  });

  it('should return tzec', function () {
    basecoin.getChain().should.equal('tzec');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet ZCash');
  });
});
