import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { SuiToken } from '../../src';

describe('Sui Tokens', function () {
  let bitgo: TestBitGoAPI;
  let suiTokenCoin;
  const tokenName = 'tsui:deep';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    SuiToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    suiTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    suiTokenCoin.getChain().should.equal(tokenName);
    suiTokenCoin.getBaseChain().should.equal('tsui');
    suiTokenCoin.getFullName().should.equal('Sui Token');
    suiTokenCoin.getBaseFactor().should.equal(1e6);
    suiTokenCoin.type.should.equal(tokenName);
    suiTokenCoin.name.should.equal('Deepbook');
    suiTokenCoin.coin.should.equal('tsui');
    suiTokenCoin.network.should.equal('Testnet');
    suiTokenCoin.decimalPlaces.should.equal(6);
  });
});
