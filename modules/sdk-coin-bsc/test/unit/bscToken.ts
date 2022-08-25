import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BscToken } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Bsc Token:', function () {
  let bitgo: TestBitGoAPI;
  let bscTokenCoin;
  const tokenName = 'tbsc:busd';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    BscToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    bscTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    bscTokenCoin.getChain().should.equal('tbsc:busd');
    bscTokenCoin.getBaseChain().should.equal('tbsc');
    bscTokenCoin.getFullName().should.equal('Bsc Token');
    bscTokenCoin.getBaseFactor().should.equal(1e18);
    bscTokenCoin.type.should.equal(tokenName);
    bscTokenCoin.name.should.equal('Test Binance USD Token');
    bscTokenCoin.coin.should.equal('tbsc');
    bscTokenCoin.network.should.equal('Testnet');
    bscTokenCoin.decimalPlaces.should.equal(18);
  });
});
