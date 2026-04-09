import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { SoneiumToken } from '../../src';

describe('Soneium Token: ', function () {
  let bitgo;

  describe('Soneium NFTs in test env:', function () {
    const tokenNames = ['tsoneium:test721', 'tsoneium:test1155'];

    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      SoneiumToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
        bitgo.safeRegister(name, coinConstructor);
      });
      bitgo.initializeTestVars();
    });

    tokenNames.forEach((tokenName: string) => {
      it('should return constants', function () {
        const soneiumToken = bitgo.coin(tokenName);
        soneiumToken.getChain().should.equal(tokenName);
        soneiumToken.getBaseChain().should.equal('tsoneium');
        soneiumToken.getFullName().should.equal('Soneium Token');
        soneiumToken.type.should.equal(tokenName);
        soneiumToken.coin.should.equal('tsoneium');
        soneiumToken.network.should.equal('Testnet');
      });

      it('should return same token by contract address', function () {
        const soneiumToken = bitgo.coin(tokenName);
        const tokencoinBycontractAddress = bitgo.coin(soneiumToken.tokenContractAddress);
        soneiumToken.should.deepEqual(tokencoinBycontractAddress);
      });
    });
  });
});
