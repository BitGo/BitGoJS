import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { AlgoToken } from '../../../../src/v2/coins/algoToken';

describe('Algo Unison Token:', function () {
  let bitgo;
  let algoTokenCoin;
  const tokenName = 'talgo:16026728';

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    bitgo.registerToken('algo', AlgoToken.createTokenConstructor);
    algoTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    algoTokenCoin.getChain().should.equal('talgo:16026728');
    algoTokenCoin.getBaseChain().should.equal('talgo');
    algoTokenCoin.getFullName().should.equal('Algo Token');
    algoTokenCoin.getBaseFactor().should.equal(1e2);
    algoTokenCoin.type.should.equal(tokenName);
    algoTokenCoin.name.should.equal('Unison');
    algoTokenCoin.coin.should.equal('talgo');
    algoTokenCoin.network.should.equal('Testnet');
    algoTokenCoin.decimalPlaces.should.equal(2);
  });
});

describe('Algo USDC Token:', function () {
  let bitgo;
  let algoTokenCoin;
  const USDCtokenName = 'talgo:10458941';

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    algoTokenCoin = bitgo.coin(USDCtokenName);
  });

  it('should return constants', function () {
    algoTokenCoin.getChain().should.equal(USDCtokenName);
    algoTokenCoin.getBaseChain().should.equal('talgo');
    algoTokenCoin.getFullName().should.equal('Algo Token');
    algoTokenCoin.getBaseFactor().should.equal(1e6);
    algoTokenCoin.type.should.equal(USDCtokenName);
    algoTokenCoin.name.should.equal('USDC');
    algoTokenCoin.coin.should.equal('talgo');
    algoTokenCoin.network.should.equal('Testnet');
    algoTokenCoin.decimalPlaces.should.equal(6);
  });
});

describe('Algo USDt Token:', function () {
  let bitgo;
  let algoTokenCoin;
  const USDTtokenName = 'talgo:180447';

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    algoTokenCoin = bitgo.coin(USDTtokenName);
  });

  it('should return constants', function () {
    algoTokenCoin.getChain().should.equal(USDTtokenName);
    algoTokenCoin.getBaseChain().should.equal('talgo');
    algoTokenCoin.getFullName().should.equal('Algo Token');
    algoTokenCoin.getBaseFactor().should.equal(1e6);
    algoTokenCoin.type.should.equal(USDTtokenName);
    algoTokenCoin.name.should.equal('USDt');
    algoTokenCoin.coin.should.equal('talgo');
    algoTokenCoin.network.should.equal('Testnet');
    algoTokenCoin.decimalPlaces.should.equal(6);
  });
});
