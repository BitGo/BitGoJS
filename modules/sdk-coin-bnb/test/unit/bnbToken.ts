import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BnbToken } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Bnb Token:', function () {
  let bitgo: TestBitGoAPI;
  let bnbTokenCoin;
  const tokenName = 'tbnb:busd';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    BnbToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    bnbTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    bnbTokenCoin.getChain().should.equal('tbnb:busd');
    bnbTokenCoin.getBaseChain().should.equal('tbnb');
    bnbTokenCoin.getFullName().should.equal('Bnb Token');
    bnbTokenCoin.getBaseFactor().should.equal(1e18);
    bnbTokenCoin.type.should.equal(tokenName);
    bnbTokenCoin.name.should.equal('Test BNB USD Token');
    bnbTokenCoin.coin.should.equal('tbnb');
    bnbTokenCoin.network.should.equal('Testnet');
    bnbTokenCoin.decimalPlaces.should.equal(18);
  });
});
