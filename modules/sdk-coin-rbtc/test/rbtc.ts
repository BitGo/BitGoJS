import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Rbtc, Trbtc } from '../src';

describe('Rootstock RSK', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('rbtc', Rbtc.createInstance);
    bitgo.safeRegister('trbtc', Trbtc.createInstance);
    bitgo.initializeTestVars();
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('trbtc');
    localBasecoin.should.be.an.instanceof(Trbtc);

    localBasecoin = bitgo.coin('rbtc');
    localBasecoin.should.be.an.instanceof(Rbtc);
  });
});
