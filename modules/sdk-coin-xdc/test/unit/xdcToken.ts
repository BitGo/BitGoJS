import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { register } from '../../src';

describe('XDC Token:', function () {
  let bitgo: TestBitGoAPI;
  let xdcTokenCoin;
  const tokenName = 'xdc:usdc';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'prod' });
    register(bitgo);
    bitgo.initializeTestVars();
    xdcTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    xdcTokenCoin.getChain().should.equal('xdc:usdc');
    xdcTokenCoin.getBaseChain().should.equal('xdc');
    xdcTokenCoin.getFullName().should.equal('XDC Token');
    xdcTokenCoin.getBaseFactor().should.equal(1e6);
    xdcTokenCoin.type.should.equal(tokenName);
    xdcTokenCoin.name.should.equal('USD Coin');
    xdcTokenCoin.coin.should.equal('xdc');
    xdcTokenCoin.network.should.equal('Mainnet');
    xdcTokenCoin.decimalPlaces.should.equal(6);
  });
});
