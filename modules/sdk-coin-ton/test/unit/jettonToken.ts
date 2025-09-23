import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { JettonToken } from '../../src';

describe('Jetton Tokens', function () {
  let bitgo: TestBitGoAPI;
  let testnetJettonToken;
  let mainnetJettonToken;
  const testnetTokenName = 'tton:ukwny-us';
  const mainnetTokenName = 'ton:usdt';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    JettonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    testnetJettonToken = bitgo.coin(testnetTokenName);
    mainnetJettonToken = bitgo.coin(mainnetTokenName);
  });

  it('should return constants for Testnet Ton token', function () {
    testnetJettonToken.getChain().should.equal(testnetTokenName);
    testnetJettonToken.getBaseChain().should.equal('tton');
    testnetJettonToken.getFullName().should.equal('Ton Token');
    testnetJettonToken.getBaseFactor().should.equal(1e9);
    testnetJettonToken.type.should.equal(testnetTokenName);
    testnetJettonToken.name.should.equal('Test Unknown TokenY-US');
    testnetJettonToken.coin.should.equal('tton');
    testnetJettonToken.network.should.equal('Testnet');
    testnetJettonToken.contractAddress.should.equal('kQD8EQMavE1w6gvgMXUhN8hi7pSk4bKYM-W2dgkNqV54Y16Y');
    testnetJettonToken.decimalPlaces.should.equal(9);
  });

  it('should return constants for Mainnet Ton token', function () {
    mainnetJettonToken.getChain().should.equal(mainnetTokenName);
    mainnetJettonToken.getBaseChain().should.equal('ton');
    mainnetJettonToken.getFullName().should.equal('Ton Token');
    mainnetJettonToken.getBaseFactor().should.equal(1e6);
    mainnetJettonToken.type.should.equal(mainnetTokenName);
    mainnetJettonToken.name.should.equal('Ton USDT');
    mainnetJettonToken.coin.should.equal('ton');
    mainnetJettonToken.network.should.equal('Mainnet');
    mainnetJettonToken.contractAddress.should.equal('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
    mainnetJettonToken.decimalPlaces.should.equal(6);
  });
});
