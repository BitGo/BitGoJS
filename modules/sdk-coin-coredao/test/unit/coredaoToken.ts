import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { CoredaoToken } from '../../src';

describe('Coredao Token:', function () {
  let bitgo: TestBitGoAPI;
  let coredaoTokenCoin;
  const tokenName = 'tcoredao:stcore';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    CoredaoToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    coredaoTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    coredaoTokenCoin.getChain().should.equal('tcoredao:stcore');
    coredaoTokenCoin.getBaseChain().should.equal('tcoredao');
    coredaoTokenCoin.getFullName().should.equal('Coredao Token');
    coredaoTokenCoin.getBaseFactor().should.equal(1e18);
    coredaoTokenCoin.type.should.equal(tokenName);
    coredaoTokenCoin.name.should.equal('Testnet stCore token');
    coredaoTokenCoin.coin.should.equal('tcoredao');
    coredaoTokenCoin.network.should.equal('Testnet');
    coredaoTokenCoin.decimalPlaces.should.equal(18);
  });
});
