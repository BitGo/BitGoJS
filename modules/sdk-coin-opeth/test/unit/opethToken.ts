import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { OpethToken } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Opeth Token:', function () {
  let bitgo: TestBitGoAPI;
  let opethTokenCoin;
  const tokenName = 'topeth:link';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    OpethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    opethTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    opethTokenCoin.getChain().should.equal('tarbeth:link');
    opethTokenCoin.getBaseChain().should.equal('tarbeth');
    opethTokenCoin.getFullName().should.equal('Arbeth Token');
    opethTokenCoin.getBaseFactor().should.equal(1e18);
    opethTokenCoin.type.should.equal(tokenName);
    opethTokenCoin.name.should.equal('Arbitrum Test LINK');
    opethTokenCoin.coin.should.equal('tarbeth');
    opethTokenCoin.network.should.equal('Testnet');
    opethTokenCoin.decimalPlaces.should.equal(18);
  });
});
