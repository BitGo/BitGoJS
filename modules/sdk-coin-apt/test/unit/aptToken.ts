import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AptToken } from '../../src';

describe('Apt Tokens', function () {
  let bitgo: TestBitGoAPI;
  let aptTokenCoin;
  const tokenName = 'tapt:usdt';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    AptToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    aptTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    aptTokenCoin.getChain().should.equal(tokenName);
    aptTokenCoin.getBaseChain().should.equal('tapt');
    aptTokenCoin.getFullName().should.equal('Apt Token');
    aptTokenCoin.getBaseFactor().should.equal(1e6);
    aptTokenCoin.type.should.equal(tokenName);
    aptTokenCoin.name.should.equal('USD Tether');
    aptTokenCoin.coin.should.equal('tapt');
    aptTokenCoin.network.should.equal('Testnet');
    aptTokenCoin.decimalPlaces.should.equal(6);
  });
});
