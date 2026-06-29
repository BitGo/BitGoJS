import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { BeraToken } from '../../src';

describe('Bera Token:', function () {
  let bitgo: TestBitGoAPI;
  let bgtTokenCoin;
  const tokenName = 'tbera:bgt';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    BeraToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    bgtTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    bgtTokenCoin.getChain().should.equal('tbera:bgt');
    bgtTokenCoin.getBaseChain().should.equal('tbera');
    bgtTokenCoin.getFullName().should.equal('Bera Token');
    bgtTokenCoin.getBaseFactor().should.equal(1e18);
    bgtTokenCoin.type.should.equal(tokenName);
    bgtTokenCoin.name.should.equal('Bera Testnet BGT');
    bgtTokenCoin.coin.should.equal('tbera');
    bgtTokenCoin.network.should.equal('Testnet');
    bgtTokenCoin.decimalPlaces.should.equal(18);
  });
});
