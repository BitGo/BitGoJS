import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';
import { BitGoAPI } from '@bitgo-beta/sdk-api';

import { FlrToken } from '../../src/flrToken';

describe('Flare Token:', function () {
  let bitgo: TestBitGoAPI;
  let flrTokenCoin;
  const tokenName = 'tflr:wflr';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    FlrToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    flrTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    flrTokenCoin.getChain().should.equal('tflr:wflr');
    flrTokenCoin.getBaseChain().should.equal('tflr');
    flrTokenCoin.getFullName().should.equal('Flare Token');
    flrTokenCoin.getBaseFactor().should.equal(1e18);
    flrTokenCoin.type.should.equal(tokenName);
    flrTokenCoin.name.should.equal('Wrapped Flare Testnet');
    flrTokenCoin.coin.should.equal('tflr');
    flrTokenCoin.network.should.equal('Testnet');
    flrTokenCoin.decimalPlaces.should.equal(18);
  });
});
