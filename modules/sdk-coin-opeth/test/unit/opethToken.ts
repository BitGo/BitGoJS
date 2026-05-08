import 'should';
import assert from 'assert';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { getToken } from '@bitgo/abstract-eth';

import { register } from '../../src';

describe('Opeth Token:', function () {
  let bitgo: TestBitGoAPI;
  let opethTokenCoin;
  let opTokenCoin;
  const tokenName = 'topeth:terc18dp';
  const opToken = 'opeth:op';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    register(bitgo);
    bitgo.initializeTestVars();
    opethTokenCoin = bitgo.coin(tokenName);
    opTokenCoin = bitgo.coin(opToken);
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

  it('should return only one token for optimism token contract address', function () {
    const token = getToken(
      '0x4200000000000000000000000000000000000042',
      opTokenCoin.getNetwork(),
      opTokenCoin.getFamily()
    );
    assert(token);
    token.name.should.equal('opeth:op');
  });
});
