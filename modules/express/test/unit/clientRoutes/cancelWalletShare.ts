import * as sinon from 'sinon';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import nock from 'nock';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGo } from 'bitgo';
import { BaseCoin, Wallets, decodeOrElse, common } from '@bitgo/sdk-core';
import { ExpressApiRouteRequest } from '../../../src/typedRoutes/api';
import { handleV2CancelWalletShare } from '../../../src/clientRoutes';
import { CancelWalletShareResponse } from '../../../src/typedRoutes/api/v2/cancelWalletShare';

describe('Cancel Wallet Share (typed handler)', () => {
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

  it('should call cancelShare and return a typed response', async () => {
    const coin = 'tbtc';
    const shareId = 'abc123shareId';

    const cancelResponse = {
      changed: true,
      state: 'canceled',
    };

    const cancelShareStub = sinon.stub().resolves(cancelResponse);
    const coinStub = sinon.createStubInstance(BaseCoin, {
      wallets: sinon.stub<[], Wallets>().returns({
        cancelShare: cancelShareStub,
      } as any),
    });

    const stubBitgo = sinon.createStubInstance(BitGo, { coin: sinon.stub<[string]>().returns(coinStub) });

    const req = {
      bitgo: stubBitgo,
      decoded: {
        coin,
        id: shareId,
      },
    } as unknown as ExpressApiRouteRequest<'express.wallet.cancelShare', 'delete'>;

    const res = await handleV2CancelWalletShare(req);

    cancelShareStub.calledOnceWith({ walletShareId: shareId }).should.be.true();
    decodeOrElse('CancelWalletShareResponse200', CancelWalletShareResponse[200], res, (errors) => {
      throw new Error(`Response did not match expected codec: ${errors}`);
    });
  });

  it('should pass the walletShareId from the route param to cancelShare', async () => {
    const coin = 'tbtc';
    const shareId = 'someOtherShareId';

    const cancelShareStub = sinon.stub().resolves({ changed: false, state: 'canceled' });
    const coinStub = sinon.createStubInstance(BaseCoin, {
      wallets: sinon.stub<[], Wallets>().returns({
        cancelShare: cancelShareStub,
      } as any),
    });

    const stubBitgo = sinon.createStubInstance(BitGo, { coin: sinon.stub<[string]>().returns(coinStub) });

    const req = {
      bitgo: stubBitgo,
      decoded: {
        coin,
        id: shareId,
      },
    } as unknown as ExpressApiRouteRequest<'express.wallet.cancelShare', 'delete'>;

    await handleV2CancelWalletShare(req);

    cancelShareStub.calledOnceWith({ walletShareId: shareId }).should.be.true();
  });
});
