import * as sinon from 'sinon';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import nock from 'nock';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGo } from 'bitgo';
import { BaseCoin, Wallets, Wallet, decodeOrElse, common } from '@bitgo/sdk-core';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { handleV2ShareWallet } from '../../../src/clientRoutes';
import { ShareWalletResponse } from '../../../src/typedRoutes/api/v2/shareWallet';

describe('Share Wallet (typed handler)', () => {
  let bitgo: TestBitGoAPI;

  before(async function () {
    if (!nock.isActive()) {
      nock.activate();
    }
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  after(() => {
    if (nock.isActive()) {
      nock.restore();
    }
  });

  it('should call shareWallet (no stub), mock BitGo HTTP, and return typed response', async () => {
    const coin = 'tbtc';
    const walletId = '59cd72485007a239fb00282ed480da1f';
    const email = 'user@example.com';
    const permissions = 'view';
    const message = 'hello';

    const baseCoin = bitgo.coin(coin);
    const walletData = {
      id: walletId,
      coin: coin,
      keys: ['k1', 'k2', 'k3'],
      coinSpecific: {},
      multisigType: 'onchain',
      type: 'hot',
    };
    const realWallet = new Wallet(bitgo, baseCoin, walletData);
    const coinStub = sinon.createStubInstance(BaseCoin, {
      wallets: sinon.stub<[], Wallets>().returns({
        get: sinon.stub<[any], Promise<Wallet>>().resolves(realWallet),
      } as any),
    });

    const stubBitgo = sinon.createStubInstance(BitGo, { coin: sinon.stub<[string]>().returns(coinStub) });

    const bgUrl = common.Environments[bitgo.getEnv()].uri;
    const getSharingKeyNock = nock(bgUrl).post('/api/v1/user/sharingkey', { email }).reply(200, { userId: 'u1' });
    const shareResponse = {
      id: walletId,
      coin,
      wallet: walletId,
      fromUser: 'u0',
      toUser: 'u1',
      permissions,
      message,
      state: 'active',
    };
    const createShareNock = nock(bgUrl)
      .post(`/api/v2/${coin}/wallet/${walletId}/share`, (body) => {
        body.user.should.equal('u1');
        body.permissions.should.equal(permissions);
        body.skipKeychain.should.equal(true);
        if (message) body.message.should.equal(message);
        return true;
      })
      .reply(200, shareResponse);

    const req = {
      bitgo: stubBitgo,
      decoded: {
        coin,
        id: walletId,
        email,
        permissions,
        message,
      },
    } as unknown as ExpressApiRouteRequest<'express.v2.wallet.share', 'post'>;

    const res = await handleV2ShareWallet(req);
    decodeOrElse('ShareWalletResponse200', ShareWalletResponse[200], res, (errors) => {
      throw new Error(`Response did not match expected codec: ${errors}`);
    });

    getSharingKeyNock.isDone().should.be.true();
    createShareNock.isDone().should.be.true();
  });
});
