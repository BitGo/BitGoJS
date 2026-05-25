import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { PolygonToken } from '../../src';

describe('Polygon Token: ', function () {
  let bitgo;
  let polygonToken;
  describe('Polygon tokens in test env:', function () {
    const tokenName = 'tpolygon:derc20';

    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      PolygonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
        bitgo.safeRegister(name, coinConstructor);
      });
      bitgo.initializeTestVars();
      polygonToken = bitgo.coin(tokenName);
    });

    it('should return constants', function () {
      polygonToken.getChain().should.equal('tpolygon:derc20');
      polygonToken.getBaseChain().should.equal('tpolygon');
      polygonToken.getFullName().should.equal('Polygon Token');
      polygonToken.type.should.equal(tokenName);
      polygonToken.name.should.equal('Polygon Test ERC20');
      polygonToken.coin.should.equal('tpolygon');
      polygonToken.network.should.equal('Testnet');
      polygonToken.decimalPlaces.should.equal(18);
    });

    it('should return same token by contract address', function () {
      const tokencoinBycontractAddress = bitgo.coin(polygonToken.tokenContractAddress);
      polygonToken.should.deepEqual(tokencoinBycontractAddress);
    });
  });

  describe('Polyon NFTs in test env:', function () {
    const tokenNames = ['tpolygon:name'];

    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      PolygonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
        bitgo.safeRegister(name, coinConstructor);
      });
      bitgo.initializeTestVars();
    });

    tokenNames.forEach((tokenName: string) => {
      it('should return constants', function () {
        const polygonToken = bitgo.coin(tokenName);
        polygonToken.getChain().should.equal(tokenName);
        polygonToken.getBaseChain().should.equal('tpolygon');
        polygonToken.getFullName().should.equal('Polygon Token');
        polygonToken.type.should.equal(tokenName);
        polygonToken.coin.should.equal('tpolygon');
        polygonToken.network.should.equal('Testnet');
      });

      it('should return same token by contract address', function () {
        const polygonToken = bitgo.coin(tokenName);
        const tokencoinBycontractAddress = bitgo.coin(polygonToken.tokenContractAddress);
        polygonToken.should.deepEqual(tokencoinBycontractAddress);
      });
    });
  });
});
