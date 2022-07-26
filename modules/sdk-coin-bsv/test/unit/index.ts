import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Bsv, Tbsv } from '../../src';

describe('Bsv', function () {
  const coinName = 'tbsv';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('bsv', Bsv.createInstance);
    bitgo.safeRegister('tbsv', Tbsv.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tbsv');
    localBasecoin.should.be.an.instanceof(Tbsv);

    localBasecoin = bitgo.coin('bsv');
    localBasecoin.should.be.an.instanceof(Bsv);
  });

  it('should return tbsv', function () {
    basecoin.getChain().should.equal('tbsv');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Bitcoin SV');
  });
});
