import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGo } from 'bitgo';
import { common, decodeOrElse } from '@bitgo/sdk-core';
import nock from 'nock';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { ExpressWalletUpdateResponse } from '../../../src/typedRoutes/api/v2/expressWalletUpdate';
import { handleWalletUpdate } from '../../../src/clientRoutes';
import { apiData } from './lightning/lightningSignerFixture';

describe('express.wallet.update (unit)', () => {
  let bitgo: TestBitGoAPI;
  let bgUrl: string;

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

  it('decodes successful response', async () => {
    const walletId = apiData.wallet.id;
    const coin = apiData.wallet.coin;
    const wpGet = nock(bgUrl)
      .get(`/api/v2/${coin}/wallet/${walletId}`)
      .query({ includeBalance: false })
      .reply(200, apiData.wallet);
    const wpKeychainNocks = [
      nock(bgUrl).get(`/api/v2/${coin}/key/${apiData.userAuthKey.id}`).reply(200, apiData.userAuthKey),
      nock(bgUrl).get(`/api/v2/${coin}/key/${apiData.nodeAuthKey.id}`).reply(200, apiData.nodeAuthKey),
    ];
    const wpPut = nock(bgUrl)
      .put(`/api/v2/${coin}/wallet/${walletId}`)
      .reply(200, {
        id: walletId,
        label: 'updated',
        coin: coin,
        keys: ['key1', 'key2', 'key3'],
        approvalsRequired: 1,
        balance: 0,
        confirmedBalance: 0,
        spendableBalance: 0,
        balanceString: '0',
        confirmedBalanceString: '0',
        spendableBalanceString: '0',
        enterprise: 'testEnterprise',
        multisigType: 'tss',
        coinSpecific: {},
        pendingApprovals: [],
      });

    const req = {
      bitgo,
      params: { coin: coin, id: walletId },
      body: {
        signerHost: 'host.example',
        signerTlsCert: 'cert',
        signerMacaroon: 'mac and cheeze',
        passphrase: apiData.initWalletRequestBody.passphrase,
      },
      decoded: {
        coin: coin,
        id: walletId,
        signerHost: 'host.example',
        signerTlsCert: 'cert',
        signerMacaroon: 'mac and cheeze',
        passphrase: apiData.initWalletRequestBody.passphrase,
      },
    } as unknown as ExpressApiRouteRequest<'express.wallet.update', 'put'>;

    const res = await handleWalletUpdate(req);
    decodeOrElse('ExpressWalletUpdateResponse200', ExpressWalletUpdateResponse[200], res, (errors) => {
      throw new Error(`Response did not match expected codec: ${errors}`);
    });

    wpPut.done();
    wpGet.done();
    wpKeychainNocks.forEach((s) => s.done());
  });
});
