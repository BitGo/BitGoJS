import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { Ada, Tada } from '../../src';

describe('Ada', function () {
  const coinName = 'tada';
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, {
      env: 'mock',
    });
    bitgo.initializeTestVars();
    bitgo.safeRegister('ada', Ada.createInstance);
    bitgo.safeRegister('tada', Tada.createInstance);
    basecoin = bitgo.coin(coinName);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tada');
    localBasecoin.should.be.an.instanceof(Tada);

    localBasecoin = bitgo.coin('ada');
    localBasecoin.should.be.an.instanceof(Ada);
  });

  it('should return tada', function () {
    basecoin.getChain().should.equal('tada');
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet Ada');
  });
});
