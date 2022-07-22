import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Btg } from '../../src';

describe('Btg', function () {
  const coinName = 'btg';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('btg', Btg.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    basecoin = bitgo.coin('btg');
    basecoin.should.be.an.instanceof(Btg);
  });

  it('should return btg', function () {
    basecoin.getChain().should.equal('btg');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Bitcoin Gold');
  });
});
