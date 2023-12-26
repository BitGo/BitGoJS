import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { ZkethToken } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Zketh Token:', function () {
  let bitgo: TestBitGoAPI;
  let zkethTokenCoin;
  const tokenName = 'tzketh:link';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    ZkethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    zkethTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    zkethTokenCoin.getChain().should.equal('tzketh:link');
    zkethTokenCoin.getBaseChain().should.equal('tzketh');
    zkethTokenCoin.getFullName().should.equal('Zketh Token');
    zkethTokenCoin.getBaseFactor().should.equal(1e18);
    zkethTokenCoin.type.should.equal(tokenName);
    zkethTokenCoin.name.should.equal('zkSync Test LINK');
    zkethTokenCoin.coin.should.equal('tzketh');
    zkethTokenCoin.network.should.equal('Testnet');
    zkethTokenCoin.decimalPlaces.should.equal(18);
  });
});
