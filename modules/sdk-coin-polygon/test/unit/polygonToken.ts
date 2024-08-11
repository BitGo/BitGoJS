import 'should';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { PolygonToken } from '../../src';
import { runTokenTestInitialization } from '@bitgo/abstract-eth';
import * as testData from '../resources';

describe('Polygon Token Tests', () => {
  const coinName = 'Polygon';
  const tokenNetworkName = 'Polygon Test ERC20';
  let bitgo;

  describe('Polygon tokens in test env:', () => {
    it('Polygon run token tests', () => {
      runTokenTestInitialization(PolygonToken, coinName, tokenNetworkName, testData);
    });
  });

  describe('Polyon NFTs in test env:', () => {
    const tokenNames = ['tpolygon:name'];
    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      PolygonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
        bitgo.safeRegister(name, coinConstructor);
      });
      bitgo.initializeTestVars();
    });

    tokenNames.forEach((tokenName: string) => {
      it('should return constants', () => {
        const polygonToken = bitgo.coin(tokenName);
        polygonToken.getChain().should.equal(tokenName);
        polygonToken.getBaseChain().should.equal('tpolygon');
        polygonToken.getFullName().should.equal('Polygon Token');
        polygonToken.type.should.equal(tokenName);
        polygonToken.coin.should.equal('tpolygon');
        polygonToken.network.should.equal('Testnet');
      });

      it('should return same token by contract address', () => {
        const polygonToken = bitgo.coin(tokenName);
        const tokencoinBycontractAddress = bitgo.coin(polygonToken.tokenContractAddress);
        polygonToken.should.deepEqual(tokencoinBycontractAddress);
      });
    });
  });
});
