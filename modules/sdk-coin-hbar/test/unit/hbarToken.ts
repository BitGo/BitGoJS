import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { HbarToken } from '../../src';

describe('Hedera Hashgraph Token', function () {
  let bitgo: TestBitGoAPI;
  let token: HbarToken;
  const tokenName = 'thbar:usdc';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    HbarToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    token = bitgo.coin(tokenName) as HbarToken;
  });

  it('Return correct configurations', function () {
    token.getChain().should.equal('thbar:usdc');
    token.getFullName().should.equal('Testnet Hedera USD Coin');
    token.getBaseFactor().should.equal(1e6);
    token.type.should.equal('thbar:usdc');
    token.name.should.equal('Testnet Hedera USD Coin');
    token.coin.should.equal('thbar');
    token.network.should.equal('Testnet');
    token.decimalPlaces.should.equal(6);
  });
});
