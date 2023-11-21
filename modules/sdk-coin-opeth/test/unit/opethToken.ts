import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { OpethToken } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Opeth Token:', function () {
  let bitgo: TestBitGoAPI;
  let opethTokenCoin;
  const tokenName = 'topeth:terc18dp';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    OpethToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    opethTokenCoin = bitgo.coin(tokenName);
  });

  it('should return constants', function () {
    opethTokenCoin.getChain().should.equal('topeth:terc18dp');
    opethTokenCoin.getBaseChain().should.equal('topeth');
    opethTokenCoin.getFullName().should.equal('Opeth Token');
    opethTokenCoin.getBaseFactor().should.equal(1e18);
    opethTokenCoin.type.should.equal(tokenName);
    opethTokenCoin.name.should.equal('Optimism Test ERC Token 18 Decimals');
    opethTokenCoin.coin.should.equal('topeth');
    opethTokenCoin.network.should.equal('Testnet');
    opethTokenCoin.decimalPlaces.should.equal(18);
  });

  it('should return same token by contract address', function () {
    const tokencoinBycontractAddress = bitgo.coin(opethTokenCoin.tokenContractAddress);
    opethTokenCoin.should.deepEqual(tokencoinBycontractAddress);
  });
});
