import should = require('should');
import nock = require('nock');

import { Environments } from '@bitgo/sdk-core';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo, BitGoOptions } from '../../../../src';
import { reducedAmsTokenConfig } from '../../resources/amsTokenConfig';
import { EthLikeErc20Token, EthLikeErc721Token } from '@bitgo/sdk-coin-evm';
import { BscToken } from '@bitgo/sdk-coin-bsc';

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
    coin.name.should.equal('Hoodi Testnet fake token');
    coin.decimalPlaces.should.equal(6);
    coin.tokenContractAddress.should.equal('0x89a959b9184b4f8c8633646d5dfd049d2ebc983a');
  });

  it('should not fetch coin from custom coin factory when useAms is false', async () => {
    const bitgoNoAms = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: false } as any);
    bitgoNoAms.initializeTestVars();
    bitgoNoAms.initCoinFactory(reducedAmsTokenConfig);
    (() => {
      bitgoNoAms.coin('hteth:faketoken');
    }).should.throw(
      'Coin or token type hteth:faketoken not supported or not compiled. Please be sure that you are using the latest version of BitGoJS. If using @bitgo/sdk-api, please confirm you have registered hteth:faketoken first.'
    );
  });

  it('should be able to register a token in the coin factory', () => {
    const tokenName = 'hteth:faketoken';
    bitgo.registerToken(tokenName);
    const coin = bitgo.coin(tokenName);
    should.exist(coin);
    coin.type.should.equal(tokenName);
    coin.name.should.equal('Hoodi Testnet fake token');
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
      const bitgoNoAms = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: false } as BitGoOptions);
      bitgoNoAms.initializeTestVars();

      await bitgoNoAms
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

    it('should be able to register the ofc token', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();

      const tokenName = 'ofc';

      await bitgo.registerToken(tokenName);
      const coin = bitgo.coin(tokenName);
      should.exist(coin);
    });

    it('should register a EVM coin token from statics library if available', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();
      await bitgo.registerToken('tip:usdc');
      const coin = bitgo.coin('tip:usdc');
      should.exist(coin);
    });

    it('should register an EVM coin token from AMS', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();

      const tokenName = 'tip:faketoken';

      // Setup nocks for AMS API call
      nock(microservicesUri).get(`/api/v1/assets/name/${tokenName}`).reply(200, reducedAmsTokenConfig[tokenName][0]);

      await bitgo.registerToken(tokenName);
      const coin = bitgo.coin(tokenName);
      should.exist(coin);
      coin.type.should.equal(tokenName);
      const staticsCoin = coin.getConfig();
      staticsCoin.name.should.equal('tip');
      staticsCoin.decimalPlaces.should.equal(18);
      // For EVM tokens, contractAddress is available on the statics coin
      if ('contractAddress' in staticsCoin && staticsCoin.contractAddress) {
        (staticsCoin.contractAddress as string).should.equal('0x1234567890123456789012345678901234567890');
      }
      staticsCoin.family.should.equal('ip');
    });

    it('should register a thypeevm EVM coin token from AMS', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();

      const tokenName = 'thypeevm:faketoken';

      // Setup nocks for AMS API call
      nock(microservicesUri).get(`/api/v1/assets/name/${tokenName}`).reply(200, reducedAmsTokenConfig[tokenName][0]);

      await bitgo.registerToken(tokenName);
      const coin = bitgo.coin(tokenName);
      should.exist(coin);
      coin.type.should.equal(tokenName);
      const staticsCoin = coin.getConfig();
      staticsCoin.name.should.equal('thypeevm');
      staticsCoin.decimalPlaces.should.equal(18);
      // For EVM tokens, contractAddress is available on the statics coin
      if ('contractAddress' in staticsCoin && staticsCoin.contractAddress) {
        (staticsCoin.contractAddress as string).should.equal('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
      }
      staticsCoin.family.should.equal('hypeevm');
    });

    it('should register an AMS-only token on a new-gen EVM family via the lazy path', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();

      const tokenName = 'thypeevm:faketoken';

      // Setup nocks for AMS API call
      nock(microservicesUri).get(`/api/v1/assets/name/${tokenName}`).reply(200, reducedAmsTokenConfig[tokenName][0]);

      await bitgo.registerToken(tokenName);
      const coin = bitgo.coin(tokenName);
      should.exist(coin);
      coin.type.should.equal(tokenName);
      (coin as EthLikeErc20Token).tokenContractAddress.should.equal('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
    });

    it('should register a statics ERC721 token on a dual-standard EVM family via the lazy path', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();

      const tokenName = 'erc721:hbarevmtoken';
      await bitgo.registerToken(tokenName);
      const coin = bitgo.coin(tokenName);
      should.exist(coin);
      coin.type.should.equal(tokenName);
      coin.should.be.an.instanceOf(EthLikeErc721Token);
    });

    it('should register a testnet ERC721 token on a dual-standard EVM family via the lazy path', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();

      const tokenName = 'thbarevm:tmnft';
      await bitgo.registerToken(tokenName);
      const coin = bitgo.coin(tokenName);
      should.exist(coin);
      coin.type.should.equal(tokenName);
      coin.should.be.an.instanceOf(EthLikeErc721Token);
    });

    it('should register a SOL token from statics library if available', async () => {
      const bitgo = TestBitGo.decorate(BitGo, { env: 'mock', microservicesUri, useAms: true } as BitGoOptions);
      bitgo.initializeTestVars();
      await bitgo.registerToken('tsol:usdc');
      const coin = bitgo.coin('tsol:usdc');
      should.exist(coin);
      coin.type.should.equal('tsol:usdc');
      coin.getBaseFactor().should.equal(1e9);
    });
  });

  it('should create a custom coin factory from ams response and include SOL tokens from statics', async () => {
    bitgo.initCoinFactory(reducedAmsTokenConfig);
    const coin = bitgo.coin('tsol:usdc');
    should.exist(coin);
    coin.type.should.equal('tsol:usdc');
    coin.getBaseFactor().should.equal(1e9);
  });

  it('should resolve an AMS-only token on a new-gen EVM family after initCoinFactory', () => {
    bitgo.initCoinFactory(reducedAmsTokenConfig);
    const coin = bitgo.coin('thypeevm:faketoken');
    should.exist(coin);
    coin.type.should.equal('thypeevm:faketoken');
    coin.name.should.equal('Hyperliquid EVM Testnet Faketoken');
    coin.decimalPlaces.should.equal(18);
    coin.tokenContractAddress.should.equal('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd');
  });
  it('should resolve an AMS-only token on a legacy EVM family after initCoinFactory', () => {
    bitgo.initCoinFactory(reducedAmsTokenConfig);
    const coin = bitgo.coin('tbsc:faketoken');
    should.exist(coin);
    coin.type.should.equal('tbsc:faketoken');
    coin.name.should.equal('Testnet BNB fake token');
    coin.decimalPlaces.should.equal(18);
    coin.tokenContractAddress.should.equal('0x9876543210987654321098765432109876543210');
    // AMS-only tokens on legacy families are registered through the family-agnostic
    // EthLikeErc20Token, not the legacy BscToken class.
    coin.should.be.an.instanceOf(EthLikeErc20Token);
  });

  it('should not flip a statics token on a legacy EVM family to the generic token class', () => {
    bitgo.initCoinFactory(reducedAmsTokenConfig);
    const coin = bitgo.coin('bsc:solv');
    should.exist(coin);
    coin.should.be.an.instanceOf(BscToken);
  });
});
