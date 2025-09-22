import 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo-beta/sdk-test';
import { BitGoAPI } from '@bitgo-beta/sdk-api';
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
    token.nodeAccountId.should.equal('0.0.3');
    token.tokenId.should.equal('0.0.429274');
    token.contractAddress.should.equal('0.0.429274');
    token.tokenId.should.equal(token.contractAddress);
  });
});
