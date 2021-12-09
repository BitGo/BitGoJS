import 'should';

import { TestBitGo } from '../../../lib/test_bitgo';

describe('Avaxc Token:', function () {
  let bitgo;
  let avaxcTokenCoin;

  describe('In env test:', function () {
    const tokenName = 'tavaxc:PNG';

    before(function () {
      bitgo = new TestBitGo({ env: 'test' });
      bitgo.initializeTestVars();
      avaxcTokenCoin = bitgo.coin(tokenName);
    });

    it('should return constants', function () {
      avaxcTokenCoin.getChain().should.equal('tavaxc:PNG');
      avaxcTokenCoin.getBaseChain().should.equal('tavaxc:PNG');
      avaxcTokenCoin.getFullName().should.equal('Avaxc Token');
      avaxcTokenCoin.getBaseFactor().should.equal(1e18);
      avaxcTokenCoin.type.should.equal(tokenName);
      avaxcTokenCoin.name.should.equal('Test Pangolin');
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
    const tokenName = 'avaxc:PNG';
    before(function () {
      bitgo = new TestBitGo({ env: 'prod' });
      bitgo.initializeTestVars();
      avaxcTokenCoin = bitgo.coin(tokenName);
    });

    it('should return constants', function () {
      avaxcTokenCoin.getChain().should.equal('avaxc:PNG');
      avaxcTokenCoin.getBaseChain().should.equal('avaxc:PNG');
      avaxcTokenCoin.getFullName().should.equal('Avaxc Token');
      avaxcTokenCoin.getBaseFactor().should.equal(1e18);
      avaxcTokenCoin.type.should.equal(tokenName);
      avaxcTokenCoin.name.should.equal('Pangolin');
      avaxcTokenCoin.coin.should.equal('avaxc');
      avaxcTokenCoin.network.should.equal('Mainnet');
      avaxcTokenCoin.decimalPlaces.should.equal(18);
    });

    it('should return same token by contract address', function () {
      const tokencoinBycontractAddress = bitgo.coin(avaxcTokenCoin.tokenContractAddress);
      avaxcTokenCoin.should.deepEqual(tokencoinBycontractAddress);
    });

    it('should return mainnet token, however it uses a testnet contract address', function () {
      const tokencoinBycontractAddress = bitgo.coin(bitgo.coin('t' + tokenName).tokenContractAddress);
      avaxcTokenCoin.should.deepEqual(tokencoinBycontractAddress);
    });

  });
});
