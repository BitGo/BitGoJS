import * as assert from 'assert';
import * as sinon from 'sinon';
import * as should from 'should';
import * as express from 'express';
import { BackupResponse, CustodialLightningWallet, SelfCustodialLightningWallet } from '@bitgo/abstract-lightning';
import { BitGo } from 'bitgo';

describe('Lightning Backup Routes', () => {
  const coin = 'tlnbtc';

  const mockRequestObject = (params: { params?: any; query?: any; bitgo?: any }) => {
    const req: Partial<express.Request> = {};
    req.params = params.params || {};
    req.query = params.query || {};
    req.bitgo = params.bitgo;
    return req as express.Request;
  };

  afterEach(() => {
    sinon.restore();
  });

  describe('Get Channel Backup', () => {
    it('should successfully get channel backup', async () => {
      const expectedResponse: BackupResponse = {
        chanPoints: [
          {
            fundingTxid: 'abc123',
            outputIndex: 1,
          },
        ],
        multiChanBackup: 'base64EncodedBackupData',
      };

      const walletStub = {
        type: () => 'hot',
        baseCoin: {
          getFamily: () => 'lnbtc',
        },
      };

      const mockLightningWallet = new SelfCustodialLightningWallet(walletStub as any);

      sinon.stub(mockLightningWallet, 'getChannelBackup').resolves(expectedResponse);

      const coinStub = {
        wallets: () => ({ get: sinon.stub().resolves(walletStub) }),
      };
      const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningBackupRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet, // Return the proper instance
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        bitgo: stubBitgo,
      });

      const result = await lightningRoutes.handleGetChannelBackup(req);

      should(result).deepEqual(expectedResponse);
      should(mockLightningWallet.getChannelBackup).be.calledOnce();
    });

    it('should fails to get channel backup for custodial lightning', async () => {
      const walletStub = {
        type: () => 'custodial',
        baseCoin: {
          getFamily: () => 'lnbtc',
        },
      };

      const mockLightningWallet = new CustodialLightningWallet(walletStub as any);

      const coinStub = {
        wallets: () => ({ get: sinon.stub().resolves(walletStub) }),
      };
      const stubBitgo = sinon.createStubInstance(BitGo as any, { coin: coinStub });

      const proxyquire = require('proxyquire');
      const lightningRoutes = proxyquire('../../../src/lightning/lightningBackupRoutes', {
        '@bitgo/abstract-lightning': {
          getLightningWallet: () => mockLightningWallet,
        },
      });

      const req = mockRequestObject({
        params: { id: 'testWalletId', coin },
        bitgo: stubBitgo,
      });

      assert.rejects(
        async () => await lightningRoutes.handleGetChannelBackup(req),
        `wallet testWalletId is not self custodial lightning`
      );
    });
  });
});
