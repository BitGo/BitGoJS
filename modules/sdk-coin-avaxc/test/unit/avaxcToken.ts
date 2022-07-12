import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { AvaxCToken } from '../../src';

describe('Avaxc Token:', function () {
  let bitgo;
  let avaxcTokenCoin;

  describe('In env test:', function () {
    const tokenName = 'tavaxc:link';

    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      AvaxCToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
        bitgo.safeRegister(name, coinConstructor);
      });
      bitgo.initializeTestVars();
      avaxcTokenCoin = bitgo.coin(tokenName);
    });

    it('should return constants', function () {
      avaxcTokenCoin.getChain().should.equal('tavaxc:link');
      avaxcTokenCoin.getBaseChain().should.equal('tavaxc');
      avaxcTokenCoin.getFullName().should.equal('Avaxc Token');
      avaxcTokenCoin.getBaseFactor().should.equal(1e18);
      avaxcTokenCoin.type.should.equal(tokenName);
      avaxcTokenCoin.name.should.equal('Test Chainlink');
      avaxcTokenCoin.coin.should.equal('tavaxc');
      avaxcTokenCoin.network.should.equal('Testnet');
      avaxcTokenCoin.decimalPlaces.should.equal(18);
    });

    it('should return same token by contract address', function () {
      const tokencoinBycontractAddress = bitgo.coin(avaxcTokenCoin.tokenContractAddress);
      avaxcTokenCoin.should.deepEqual(tokencoinBycontractAddress);
    });
  });

  describe('In env prod:', function () {
    const prodTokenName = 'avaxc:png';
    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'prod' });
      bitgo.initializeTestVars();
      avaxcTokenCoin = bitgo.coin(prodTokenName);
    });

    it('should return constants', function () {
      avaxcTokenCoin.getChain().should.equal('avaxc:png');
      avaxcTokenCoin.getBaseChain().should.equal('avaxc');
      avaxcTokenCoin.getFullName().should.equal('Avaxc Token');
      avaxcTokenCoin.getBaseFactor().should.equal(1e18);
      avaxcTokenCoin.type.should.equal(prodTokenName);
      avaxcTokenCoin.name.should.equal('Pangolin');
      avaxcTokenCoin.coin.should.equal('avaxc');
      avaxcTokenCoin.network.should.equal('Mainnet');
      avaxcTokenCoin.decimalPlaces.should.equal(18);
    });

    it('should return same token by contract address', function () {
      const tokencoinBycontractAddress = bitgo.coin(avaxcTokenCoin.tokenContractAddress);
      avaxcTokenCoin.should.deepEqual(tokencoinBycontractAddress);
    });

    it('should successfully verify coin', function () {
      const txPrebuild = { coin: 'avaxc', token: 'avaxc:png' };
      avaxcTokenCoin.verifyCoin(txPrebuild).should.equal(true);
    });

    it('should fail verify coin', function () {
      const txPrebuild = { coin: 'eth', token: 'eth:png' };
      avaxcTokenCoin.verifyCoin(txPrebuild).should.equal(false);
    });
  });
});
