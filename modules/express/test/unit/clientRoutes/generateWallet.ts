import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGo } from 'bitgo';
import { common, decodeOrElse } from '@bitgo/sdk-core';
import nock from 'nock';

import 'should-http';
import 'should-sinon';
import '../../lib/asserts';

import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { handleV2GenerateWallet } from '../../../src/clientRoutes';
import { GenerateWalletResponse } from '../../../src/typedRoutes/api/v2/generateWallet';

describe('Generate Wallet', () => {
  let bitgo: TestBitGoAPI;
  let bgUrl: string;
  const coin = 'tbtc';

  before(async function () {
    if (!nock.isActive()) {
      nock.activate();
    }

    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  after(() => {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should return the internal wallet object and keychains by default or if includeKeychains is true', async () => {
    // Mock keychain creation calls
    const userKeychainId = 'user-keychain-id';
    const backupKeychainId = 'backup-keychain-id';
    const bitgoKeychainId = 'bitgo-keychain-id';
    const walletId = 'wallet-id';

    // Mock wallet creation
    const walletNock = nock(bgUrl)
      .post(`/api/v2/${coin}/wallet/add`)
      .times(2)
      .reply(200, {
        id: walletId,
        label: 'Test Wallet',
        keys: [userKeychainId, backupKeychainId, bitgoKeychainId],
        coin: coin,
      });

    // Mock keychain retrieval calls
    const keychainRetrievalNocks = [
      nock(bgUrl).get(`/api/v2/${coin}/key/${userKeychainId}`).times(2).reply(200, {
        id: userKeychainId,
        pub: 'user-pub-key',
        source: 'user',
        encryptedPrv: 'encrypted-user-prv',
      }),
      nock(bgUrl).get(`/api/v2/${coin}/key/${backupKeychainId}`).times(2).reply(200, {
        id: backupKeychainId,
        pub: 'backup-pub-key',
        source: 'backup',
        prv: 'backup-prv',
      }),
      nock(bgUrl).get(`/api/v2/${coin}/key/${bitgoKeychainId}`).times(2).reply(200, {
        id: bitgoKeychainId,
        pub: 'bitgo-pub-key',
        source: 'bitgo',
        isBitGo: true,
      }),
    ];

    const walletGenerateBody = {
      label: 'Test Wallet',
      type: 'custodial',
      enterprise: 'test-enterprise',
    } as const;

    const reqDefault = {
      bitgo,
      params: {
        coin,
      },
      query: {},
      body: walletGenerateBody,
      decoded: {
        ...walletGenerateBody,
        coin,
      },
    } as unknown as ExpressApiRouteRequest<'express.wallet.generate', 'post'>;

    const reqIncludeKeychains = {
      bitgo,
      params: {
        coin,
      },
      query: {
        includeKeychains: true,
      },
      body: walletGenerateBody,
      decoded: {
        ...walletGenerateBody,
        coin,
        includeKeychains: true,
      },
    } as unknown as ExpressApiRouteRequest<'express.wallet.generate', 'post'>;

    const resDefault = await handleV2GenerateWallet(reqDefault);
    decodeOrElse('GenerateWalletResponse', GenerateWalletResponse[200], resDefault, (_) => {
      throw new Error('Response did not match expected codec');
    });

    const resIncludeKeychains = await handleV2GenerateWallet(reqIncludeKeychains);
    decodeOrElse('GenerateWalletResponse', GenerateWalletResponse[200], resIncludeKeychains, (_) => {
      throw new Error('Response did not match expected codec');
    });

    // Double verify the responses contain the expected structure
    resDefault.should.have.property('wallet');
    resDefault.should.have.property('userKeychain');
    resDefault.should.have.property('backupKeychain');
    resDefault.should.have.property('bitgoKeychain');

    resIncludeKeychains.should.have.property('wallet');
    resIncludeKeychains.should.have.property('userKeychain');
    resIncludeKeychains.should.have.property('backupKeychain');
    resIncludeKeychains.should.have.property('bitgoKeychain');

    walletNock.done();
    keychainRetrievalNocks.forEach((nock) => nock.done());
  });

  it('should only return wallet data if includeKeychains query param is false', async () => {
    // Mock keychain creation calls
    const userKeychainId = 'user-keychain-id';
    const backupKeychainId = 'backup-keychain-id';
    const bitgoKeychainId = 'bitgo-keychain-id';
    const walletId = 'wallet-id';

    // Mock wallet creation
    const walletNock = nock(bgUrl)
      .post(`/api/v2/${coin}/wallet/add`)
      .reply(200, {
        id: walletId,
        label: 'Test Wallet',
        keys: [userKeychainId, backupKeychainId, bitgoKeychainId],
        coin: coin,
      });

    // Mock keychain retrieval calls
    const keychainRetrievalNocks = [
      nock(bgUrl).get(`/api/v2/${coin}/key/${userKeychainId}`).reply(200, {
        id: userKeychainId,
        pub: 'user-pub-key',
        source: 'user',
        encryptedPrv: 'encrypted-user-prv',
      }),
      nock(bgUrl).get(`/api/v2/${coin}/key/${backupKeychainId}`).reply(200, {
        id: backupKeychainId,
        pub: 'backup-pub-key',
        source: 'backup',
        prv: 'backup-prv',
      }),
      nock(bgUrl).get(`/api/v2/${coin}/key/${bitgoKeychainId}`).reply(200, {
        id: bitgoKeychainId,
        pub: 'bitgo-pub-key',
        source: 'bitgo',
        isBitGo: true,
      }),
    ];

    const walletGenerateBody = {
      label: 'Test Wallet',
      type: 'custodial',
      enterprise: 'test-enterprise',
    } as const;

    const req = {
      bitgo,
      params: {
        coin,
      },
      query: {
        includeKeychains: false,
      },
      body: walletGenerateBody,
      decoded: {
        ...walletGenerateBody,
        coin,
        includeKeychains: false,
      },
    } as unknown as ExpressApiRouteRequest<'express.wallet.generate', 'post'>;

    const res = await handleV2GenerateWallet(req);
    decodeOrElse('GenerateWalletResponse', GenerateWalletResponse[200], res, (_) => {
      throw new Error('Response did not match expected codec');
    });

    // When includeKeychains is false, should only return wallet data
    res.should.have.property('id', walletId);
    res.should.have.property('label', 'Test Wallet');
    res.should.have.property('coin', coin);
    res.should.not.have.property('userKeychain');
    res.should.not.have.property('backupKeychain');
    res.should.not.have.property('bitgoKeychain');
    walletNock.done();
    keychainRetrievalNocks.forEach((nock) => nock.done());
  });
});
