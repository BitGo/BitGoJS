import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { XrpToken } from '../../src';

describe('Xrp Tokens', function () {
  let bitgo: TestBitGoAPI;
  let xrpTokenCoin;
  const tokenName = 'txrp:rlusd';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    XrpToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    xrpTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    xrpTokenCoin.getChain().should.equal(tokenName);
    xrpTokenCoin.getBaseChain().should.equal('txrp');
    xrpTokenCoin.getFullName().should.equal('Xrp Token');
    xrpTokenCoin.getBaseFactor().should.equal(1000000000000000);
    xrpTokenCoin.type.should.equal(tokenName);
    xrpTokenCoin.name.should.equal('RLUSD');
    xrpTokenCoin.coin.should.equal('txrp');
    xrpTokenCoin.network.should.equal('Testnet');
    xrpTokenCoin.decimalPlaces.should.equal(15);
  });
});
