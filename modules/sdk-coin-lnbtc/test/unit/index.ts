import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Tlnbtc } from '../../src/index';

describe('LightningBitcoin', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Tlnbtc;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tlnbtc', Tlnbtc.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tlnbtc') as Tlnbtc;
  });

  it('should instantiate the coin', function () {
    basecoin.should.be.an.instanceof(Tlnbtc);
  });

  it('should return full name', function () {
    basecoin.getFullName().should.equal('Testnet LightningBitcoin');
  });
});
