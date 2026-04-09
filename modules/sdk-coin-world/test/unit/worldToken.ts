import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { WorldToken } from '../../src/worldToken';

describe('World Token:', function () {
  let bitgo: TestBitGoAPI;
  let worldTokenCoin;
  const tokenName = 'tworld:wld';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    WorldToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    worldTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    worldTokenCoin.getChain().should.equal('tworld:wld');
    worldTokenCoin.getBaseChain().should.equal('tworld');
    worldTokenCoin.getFullName().should.equal('World Token');
    worldTokenCoin.getBaseFactor().should.equal(1e18);
    worldTokenCoin.type.should.equal(tokenName);
    worldTokenCoin.name.should.equal('Worldcoin Testnet');
    worldTokenCoin.coin.should.equal('tworld');
    worldTokenCoin.network.should.equal('Testnet');
    worldTokenCoin.decimalPlaces.should.equal(18);
  });
});
