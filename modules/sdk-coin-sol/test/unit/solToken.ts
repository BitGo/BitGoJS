import 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { SolToken } from '../../src';

describe('SOL Token:', function () {
  let bitgo: TestBitGoAPI;
  let solTokenCoin;
  const tokenName = 'sol:spx';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    SolToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    solTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    solTokenCoin.getChain().should.equal(tokenName);
    solTokenCoin.getBaseChain().should.equal('sol');
    solTokenCoin.getBaseFactor().should.equal(1e8);
    solTokenCoin.getFullName().should.equal('Solana Token');
    solTokenCoin.coin.should.equal('sol');
    solTokenCoin.decimalPlaces.should.equal(8);
    solTokenCoin.network.should.equal('Mainnet');
    solTokenCoin.tokenAddress.should.equal('J3NKxxXZcnNiMjKw9hYb2K4LUxgwB6t1FtPtQVsv3KFr');
    solTokenCoin.contractAddress.should.equal('J3NKxxXZcnNiMjKw9hYb2K4LUxgwB6t1FtPtQVsv3KFr');
  });

  it('should return SPL token type for mainnet token', function () {
    solTokenCoin.getTokenType().should.equal('SPL');
  });

  it('should return SPL token type for testnet token', function () {
    (bitgo.coin('tsol:usdc') as SolToken).getTokenType().should.equal('SPL');
  });
});
