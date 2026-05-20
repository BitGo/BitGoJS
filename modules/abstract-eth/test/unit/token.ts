import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

export function runTokenTestInitialization(
  currentCoinToken,
  coinName: string,
  tokenNetworkName: string,
  testData: any
) {
  describe(`${coinName} Token:`, () => {
    let bitgo: TestBitGoAPI;
    let tokenCoin;
    const coin = testData.COIN;
    const tokenName = testData.NETWORK_TOKEN_IDENTIFIER;
    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      currentCoinToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
        bitgo.safeRegister(name, coinConstructor);
      });
      bitgo.initializeTestVars();
      tokenCoin = bitgo.coin(tokenName);
    });

    it('should return constants', () => {
      tokenCoin.getChain().should.equal(tokenName);
      tokenCoin.getBaseChain().should.equal(coin);
      tokenCoin.getFullName().should.equal(`${coinName} Token`);
      tokenCoin.getBaseFactor().should.equal(1e18);
      tokenCoin.type.should.equal(tokenName);
      tokenCoin.name.should.equal(tokenNetworkName);
      tokenCoin.coin.should.equal(coin);
      tokenCoin.network.should.equal('Testnet');
      tokenCoin.decimalPlaces.should.equal(18);
    });

    it('should return same token by contract address', () => {
      const tokencoinBycontractAddress = bitgo.coin(tokenCoin.tokenContractAddress);
      tokenCoin.should.deepEqual(tokencoinBycontractAddress);
    });
  });
}
