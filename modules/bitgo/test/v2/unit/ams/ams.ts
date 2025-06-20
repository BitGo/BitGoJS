import * as should from 'should';
import * as nock from 'nock';

import { Environments } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo, BitGoOptions } from '../../../../src';
import { reducedAmsTokenConfig } from '../../resources/amsTokenConfig';

describe('Asset metadata service', () => {
  const microservicesUri = Environments['mock'].uri;
  let bitgo;
  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
    bitgo.initializeTestVars();
  });

  it('should create a custom coin factory from ams response', async () => {
    bitgo.initCoinFactory(reducedAmsTokenConfig);
    const coin = bitgo.coin('hteth:faketoken');
    should.exist(coin);
    coin.type.should.equal('hteth:faketoken');
    coin.name.should.equal('Holesky Testnet fake token');
    coin.decimalPlaces.should.equal(6);
    coin.tokenContractAddress.should.equal('0x89a959b9184b4f8c8633646d5dfd049d2ebc983a');
  });

  it('should not fetch coin from custom coin factory when useAms is false', async () => {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: false } as any);
    bitgo.initializeTestVars();
    bitgo.initCoinFactory(reducedAmsTokenConfig);
    (() => {
      bitgo.coin('hteth:faketoken');
    }).should.throw(
      'Coin or token type hteth:faketoken not supported or not compiled. Please be sure that you are using the latest version of BitGoJS. If using @bitgo/sdk-api, please confirm you have registered hteth:faketoken first.'
    );
  });

  it('should be able to register a token in the coin factory', () => {
    const tokenName = 'hteth:faketoken';
    const amsToken = reducedAmsTokenConfig[tokenName][0];
    bitgo.registerToken(amsToken);
    const coin = bitgo.coin(tokenName);
    should.exist(coin);
    coin.type.should.equal(tokenName);
    coin.name.should.equal('Holesky Testnet fake token');
    coin.decimalPlaces.should.equal(6);
    coin.tokenContractAddress.should.equal('0x89a959b9184b4f8c8633646d5dfd049d2ebc983a');
  });

  it('should fetch all assets from AMS and initialize the coin factory', async () => {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
    bitgo.initializeTestVars();

    // Setup nocks
    nock(microservicesUri).get('/api/v1/assets/list/testnet').reply(200, reducedAmsTokenConfig);

    await bitgo.registerAllTokens();
    const coin = bitgo.coin('hteth:faketoken');
    should.exist(coin);
  });

  describe('registerToken', () => {
    it('should throw an error when useAms is false', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: false } as BitGoOptions);
      bitgo.initializeTestVars();

      await bitgo
        .registerToken('hteth:faketoken')
        .should.be.rejectedWith('registerToken is only supported when useAms is set to true');
    });

    it('should register a token from statics library if available', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();
      await bitgo.registerToken('hteth:bgerchv2');
      const coin = bitgo.coin('hteth:bgerchv2');
      should.exist(coin);
    });

    it('should fetch token information from AMS if not in statics library', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();

      const tokenName = 'hteth:faketoken';

      // Setup nocks
      nock(microservicesUri).get(`/api/v1/assets/name/${tokenName}`).reply(200, reducedAmsTokenConfig[tokenName][0]);

      await bitgo.registerToken(tokenName);
      const coin = bitgo.coin(tokenName);
      should.exist(coin);
    });
  });
});
