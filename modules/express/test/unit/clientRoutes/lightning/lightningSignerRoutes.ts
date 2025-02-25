import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGo } from 'bitgo';
import { common } from '@bitgo/sdk-core';
import * as nock from 'nock';
import * as express from 'express';
import * as sinon from 'sinon';
import * as fs from 'fs';

import { lightningSignerConfigs, apiData, signerApiData } from './lightningSignerFixture';
import {
  handleCreateSignerMacaroon,
  handleGetLightningWalletState,
  handleInitLightningWallet,
  handleUnlockLightningWallet,
} from '../../../../src/lightning/lightningSignerRoutes';

describe('Lightning signer routes', () => {
  let bitgo: TestBitGoAPI;
  let bgUrl;

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

  for (const includingOptionalFields of [true, false]) {
    it(`should initialize lightning signer wallet ${
      includingOptionalFields ? 'with' : 'without'
    } optional fields`, async () => {
      const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(lightningSignerConfigs));
      const wpWalletnock = nock(bgUrl).get(`/api/v2/tlnbtc/wallet/${apiData.wallet.id}`).reply(200, apiData.wallet);

      const wpKeychainNocks = [
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.userKey.id}`).reply(200, apiData.userKey),
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.userAuthKey.id}`).reply(200, apiData.userAuthKey),
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.nodeAuthKey.id}`).reply(200, apiData.nodeAuthKey),
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.userAuthKey.id}`).reply(200, apiData.userAuthKey),
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.nodeAuthKey.id}`).reply(200, apiData.nodeAuthKey),
      ];

      const signerInitWalletNock = nock(lightningSignerConfigs.fakeid.url)
        .post(`/v1/initwallet`)
        .reply(200, signerApiData.initWallet);

      const wpWalletUpdateNock = nock(bgUrl).put(`/api/v2/tlnbtc/wallet/${apiData.wallet.id}`).reply(200);

      const req = {
        bitgo: bitgo,
        body: includingOptionalFields
          ? apiData.initWalletRequestBody
          : { ...apiData.initWalletRequestBody, expressHost: undefined },
        params: {
          coin: 'tlnbtc',
          id: 'fakeid',
        },
        config: {
          lightningSignerFileSystemPath: 'lightningSignerFileSystemPath',
        },
      } as unknown as express.Request;

      await handleInitLightningWallet(req);

      wpWalletUpdateNock.done();
      signerInitWalletNock.done();
      wpKeychainNocks.forEach((s) => s.done());
      wpWalletnock.done();
      readFileStub.calledOnceWith('lightningSignerFileSystemPath').should.be.true();
      readFileStub.restore();
    });
  }

  for (const includingOptionalFields of [true, false]) {
    it(`should create signer macaroon ${includingOptionalFields ? 'with' : 'without'} optional fields`, async () => {
      const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(lightningSignerConfigs));
      const wpWalletnock = nock(bgUrl).get(`/api/v2/tlnbtc/wallet/${apiData.wallet.id}`).reply(200, apiData.wallet);

      const wpKeychainNocks = [
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.userAuthKey.id}`).reply(200, apiData.userAuthKey),
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.nodeAuthKey.id}`).reply(200, apiData.nodeAuthKey),
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.userAuthKey.id}`).reply(200, apiData.userAuthKey),
        nock(bgUrl).get(`/api/v2/tlnbtc/key/${apiData.nodeAuthKey.id}`).reply(200, apiData.nodeAuthKey),
      ];

      const signerMacaroon = nock(lightningSignerConfigs.fakeid.url)
        .post(`/v1/macaroon`)
        .reply(200, signerApiData.bakeMacaroon);

      const wpWalletUpdateNock = nock(bgUrl).put(`/api/v2/tlnbtc/wallet/${apiData.wallet.id}`).reply(200);

      const req = {
        bitgo: bitgo,
        body: includingOptionalFields
          ? apiData.signerMacaroonRequestBody
          : { ...apiData.signerMacaroonRequestBody, watchOnlyIp: undefined },
        params: {
          coin: 'tlnbtc',
          id: 'fakeid',
        },
        config: {
          lightningSignerFileSystemPath: 'lightningSignerFileSystemPath',
        },
      } as unknown as express.Request;

      await handleCreateSignerMacaroon(req);

      wpWalletUpdateNock.done();
      signerMacaroon.done();
      wpKeychainNocks.forEach((s) => s.done());
      wpWalletnock.done();
      readFileStub.calledOnceWith('lightningSignerFileSystemPath').should.be.true();
      readFileStub.restore();
    });
  }

  it('should get signer wallet state', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(lightningSignerConfigs));
    const walletStateNock = nock(lightningSignerConfigs.fakeid.url)
      .get(`/v1/state`)
      .reply(200, signerApiData.walletState);

    const req = {
      bitgo: bitgo,
      params: {
        coin: 'tlnbtc',
        id: apiData.wallet.id,
      },
      config: {
        lightningSignerFileSystemPath: 'lightningSignerFileSystemPath',
      },
    } as unknown as express.Request;

    await handleGetLightningWalletState(req);

    walletStateNock.done();
    readFileStub.calledOnceWith('lightningSignerFileSystemPath').should.be.true();
    readFileStub.restore();
  });

  it('should unlock lightning wallet', async () => {
    const readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON.stringify(lightningSignerConfigs));

    const unlockwalletNock = nock(lightningSignerConfigs.fakeid.url).post(`/v1/unlockwallet`).reply(200);

    const req = {
      bitgo: bitgo,
      body: apiData.unlockWalletRequestBody,
      params: {
        coin: 'tlnbtc',
        id: 'fakeid',
      },
      config: {
        lightningSignerFileSystemPath: 'lightningSignerFileSystemPath',
      },
    } as unknown as express.Request;

    await handleUnlockLightningWallet(req);

    unlockwalletNock.done();
    readFileStub.calledOnceWith('lightningSignerFileSystemPath').should.be.true();
    readFileStub.restore();
  });
});
