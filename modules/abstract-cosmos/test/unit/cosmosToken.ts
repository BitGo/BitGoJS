import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { CosmosToken } from '../../src';

describe('Cosmos Tokens', function () {
  let bitgo: TestBitGoAPI;
  let mainnetCosmosToken;
  let testnetCosmosToken;
  const testnetTokenName = 'thash:ylds';
  const mainnetTokenName = 'hash:ylds';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    CosmosToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    mainnetCosmosToken = bitgo.coin(mainnetTokenName);
    testnetCosmosToken = bitgo.coin(testnetTokenName);
  });

  it('should return constants for Hash YLDS testnet token', function () {
    testnetCosmosToken.getChain().should.equal(testnetTokenName);
    testnetCosmosToken.getBaseChain().should.equal('thash');
    testnetCosmosToken.getFullName().should.equal('Hash Token');
    testnetCosmosToken.getBaseFactor().should.equal(1e6);
    testnetCosmosToken.type.should.equal(testnetTokenName);
    testnetCosmosToken.name.should.equal('Testnet YLDS Token');
    testnetCosmosToken.coin.should.equal('thash');
    testnetCosmosToken.network.should.equal('Testnet');
    testnetCosmosToken.denom.should.equal('uylds.fcc');
    testnetCosmosToken.decimalPlaces.should.equal(6);
  });

  it('should return constants for Hash YLDS mainnet token', function () {
    mainnetCosmosToken.getChain().should.equal(mainnetTokenName);
    mainnetCosmosToken.getBaseChain().should.equal('hash');
    mainnetCosmosToken.getFullName().should.equal('Hash Token');
    mainnetCosmosToken.getBaseFactor().should.equal(1e6);
    mainnetCosmosToken.type.should.equal(mainnetTokenName);
    mainnetCosmosToken.name.should.equal('YLDS Token');
    mainnetCosmosToken.coin.should.equal('hash');
    mainnetCosmosToken.network.should.equal('Mainnet');
    mainnetCosmosToken.denom.should.equal('uylds.fcc');
    mainnetCosmosToken.decimalPlaces.should.equal(6);
  });
});
