import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { ArbethToken } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Arbeth Token:', function () {
  let bitgo: TestBitGoAPI;
  let arbethTokenCoin;
  const tokenName = 'tarbeth:link';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    ArbethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    arbethTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    arbethTokenCoin.getChain().should.equal('tarbeth:link');
    arbethTokenCoin.getBaseChain().should.equal('tarbeth');
    arbethTokenCoin.getFullName().should.equal('Arbeth Token');
    arbethTokenCoin.getBaseFactor().should.equal(1e18);
    arbethTokenCoin.type.should.equal(tokenName);
    arbethTokenCoin.name.should.equal('Arbitrum Test LINK');
    arbethTokenCoin.coin.should.equal('tarbeth');
    arbethTokenCoin.network.should.equal('Testnet');
    arbethTokenCoin.decimalPlaces.should.equal(18);
  });
});
